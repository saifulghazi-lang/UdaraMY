import { defineStore } from 'pinia';
import { getAirQualityData, generate24hHistory, generatePollutants } from '../services/apiService.js';
import { getCategoryFromApi } from '../data/stations.js';
import { getUserCoordinates, findNearestStation, calculateDistanceKm } from '../services/locationService.js';
import { getLiveHotspots } from '../services/hotspotService.js';
import {
  getAllCommunitySensors,
  fetchLiveOpenAqSensors,
  getOpenAqApiKey,
  setOpenAqApiKey
} from '../services/communityService.js';
import { fetchAirQualityForecast } from '../services/airQualityForecastService.js';
import {
  calculateNowCast,
  calculateHourlyVelocity,
  generate6HourProjection
} from '../services/mathematicsService.js';
import {
  fetchRegionalWindGrid,
  calculatePlumeThreat,
  interpolateWindVector,
  getClimatologicalWindGrid
} from '../services/windVectorService.js';

const WATCHLIST_STORAGE_KEY = 'udaramy_watchlist';
const PROFILE_STORAGE_KEY = 'udaramy_profile';

const DEFAULT_WATCHLIST = [
  { id: 'MCAQM001', label: 'Home', icon: '🏠' },
  { id: 'PJ01', label: 'Office', icon: '🏢' },
  { id: 'CA19B', label: 'School', icon: '🏫' }
];

export const useAirQualityStore = defineStore('airQuality', {
  state: () => {
    let savedWatchlist = DEFAULT_WATCHLIST;
    try {
      const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (raw) savedWatchlist = JSON.parse(raw);
    } catch (e) {}

    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY) || 'general';

    return {
      activeProfile: savedProfile,
      stations: [],
      selectedStationId: 'MCAQM001',
      isLoading: true,
      isRefreshing: false,
      isLive: false,
      lastUpdated: null,
      simulationApi: null,
      selectedRegion: 'All',
      searchQuery: '',
      alertThreshold: 100,
      schoolAlert: true,
      isOffline: !navigator.onLine,
      userLocation: null,
      isLocating: false,
      locationError: null,
      watchlist: savedWatchlist,
      communitySensors: getAllCommunitySensors(),
      showCommunitySensors: false, // Default to FALSE to ensure only official live APIMS stations are displayed
      communitySource: 'none', // 'openaq' | 'cached' | 'custom' | 'none'
      isCommunityLoading: false,
      openAqApiKey: getOpenAqApiKey(),
      forecast: null,
      isForecastLoading: false,
      hotspots: {
        sumatra: 142,
        kalimantan: 89,
        malaysia: 14,
        windDirection: 'Southwest (210°)',
        windSpeedKm: '18 km/h',
        smokeTrajectory: 'Northeast towards Straits of Malacca'
      },
      windFieldGrid: getClimatologicalWindGrid(),
      activePlumes: [],
      showWindOverlay: false,
      isWindLoading: false
    };
  },

  getters: {
    currentStation(state) {
      let st = state.stations.find(s => s.id === state.selectedStationId)
        || state.communitySensors.find(s => s.id === state.selectedStationId);
      if (!st) st = state.stations[0];
      if (!st) return null;

      let result = st;
      if (state.simulationApi !== null) {
        const api = state.simulationApi;
        result = {
          ...st,
          api,
          category: getCategoryFromApi(api),
          pollutants: generatePollutants(api, st.dominantPollutant, st.state, st.name),
          history24h: generate24hHistory(api)
        };
      }

      const recentSeries = result.history24h && result.history24h.length > 0
        ? [...result.history24h].reverse().map(h => (typeof h.api === 'number' ? h.api : result.api))
        : [result.api];

      const nowCast = calculateNowCast(recentSeries);
      const velocity3h = calculateHourlyVelocity(recentSeries);
      const forecastSeries = Array.isArray(state.forecast?.hourly)
        ? state.forecast.hourly.map(h => (typeof h?.api === 'number' ? h.api : (typeof h === 'number' ? h : null))).filter(v => v !== null)
        : [];

      const predictions6h = generate6HourProjection(
        nowCast.nowCastApi ?? result.api,
        forecastSeries
      );

      return {
        ...result,
        nowCast,
        velocity3h,
        predictions6h
      };
    },

    allDisplayStations(state) {
      if (!state.showCommunitySensors) return state.stations;
      return [...state.stations, ...state.communitySensors];
    },

    nearestCommunitySensor(state) {
      if (!state.userLocation || !state.communitySensors.length) return null;
      let closest = null;
      let minDistance = Infinity;

      for (const node of state.communitySensors) {
        const dist = calculateDistanceKm(state.userLocation.lat, state.userLocation.lng, node.lat, node.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = { ...node, distanceKm: dist };
        }
      }
      return closest;
    },

    filteredStations(state) {
      return state.stations.filter(st => {
        const matchesRegion = state.selectedRegion === 'All'
          || (state.selectedRegion === 'EastMalaysia'
              ? (st.region === 'Sabah' || st.region === 'Sarawak' || st.region === 'Sabah & Sarawak' || st.region === 'Borneo')
              : st.region === state.selectedRegion);
        const query = state.searchQuery.toLowerCase().trim();
        const matchesQuery = !query || 
          st.name.toLowerCase().includes(query) || 
          st.state.toLowerCase().includes(query);
        return matchesRegion && matchesQuery;
      });
    },

    topAffectedStations(state) {
      return [...state.stations]
        .sort((a, b) => b.api - a.api)
        .slice(0, 5);
    },

    nationalSummary(state) {
      if (!state.stations || state.stations.length === 0) {
        return {
          highestStation: null,
          cleanestStation: null,
          nationalAverage: 0,
          unhealthyCount: 0,
          schoolAlertCount: 0,
          totalStations: 0
        };
      }

      let highest = state.stations[0];
      let cleanest = state.stations[0];
      let totalApi = 0;
      let unhealthyCount = 0;
      let schoolAlertCount = 0;

      for (const st of state.stations) {
        totalApi += st.api;
        if (st.api > highest.api) highest = st;
        if (st.api < cleanest.api) cleanest = st;
        if (st.api > 100) unhealthyCount++;
        if (st.api > 200) schoolAlertCount++;
      }

      return {
        highestStation: highest,
        cleanestStation: cleanest,
        nationalAverage: Math.round(totalApi / state.stations.length),
        unhealthyCount,
        schoolAlertCount,
        totalStations: state.stations.length
      };
    },

    stateRankings(state) {
      if (!state.stations || state.stations.length === 0) return [];

      const groups = {};
      for (const st of state.stations) {
        const stateName = st.state || 'Lain-lain';
        if (!groups[stateName]) {
          groups[stateName] = [];
        }
        groups[stateName].push(st);
      }

      const results = [];
      for (const [stateName, stList] of Object.entries(groups)) {
        let highest = stList[0];
        let cleanest = stList[0];
        let totalApi = 0;

        for (const st of stList) {
          totalApi += st.api;
          if (st.api > highest.api) highest = st;
          if (st.api < cleanest.api) cleanest = st;
        }

        const averageApi = Math.round(totalApi / stList.length);

        // Compute 24-hour diurnal progression across all stations in this state (AM to PM)
        const hourlyProgression24h = [];
        for (let h = 0; h < 24; h++) {
          let sumHourApi = 0;
          let maxHourApi = 0;
          let count = 0;

          for (const st of stList) {
            if (st.history24h && st.history24h[h]) {
              const val = st.history24h[h].api;
              sumHourApi += val;
              if (val > maxHourApi) maxHourApi = val;
              count++;
            }
          }

          const avgAtHour = count > 0 ? Math.round(sumHourApi / count) : averageApi;
          const peakAtHour = count > 0 ? maxHourApi : highest.api;
          const timeLabel = stList[0]?.history24h?.[h]?.timeLabel || `${h}:00`;

          hourlyProgression24h.push({
            hour: h,
            timeLabel,
            avgApi: avgAtHour,
            peakApi: peakAtHour,
            category: getCategoryFromApi(avgAtHour)
          });
        }

        const morningApi = hourlyProgression24h[8]?.avgApi || averageApi;
        const currentAvg = hourlyProgression24h[hourlyProgression24h.length - 1]?.avgApi || averageApi;
        const trendDelta = currentAvg - morningApi;

        results.push({
          state: stateName,
          region: stList[0]?.region || 'Peninsular',
          stationCount: stList.length,
          stations: [...stList].sort((a, b) => b.api - a.api),
          peakStation: highest,
          cleanestStation: cleanest,
          averageApi,
          category: getCategoryFromApi(averageApi),
          peakCategory: getCategoryFromApi(highest.api),
          hourlyProgression24h,
          trendDelta
        });
      }

      return results.sort((a, b) => b.peakStation.api - a.peakStation.api);
    },

    distanceToCurrentStation(state) {
      if (!state.userLocation || !this.currentStation) return null;
      return calculateDistanceKm(
        state.userLocation.lat,
        state.userLocation.lng,
        this.currentStation.lat,
        this.currentStation.lng
      );
    },

    isNearestStationActive(state) {
      if (!state.userLocation || !state.stations.length) return false;
      const nearest = findNearestStation(state.userLocation.lat, state.userLocation.lng, state.stations);
      return nearest && nearest.id === state.selectedStationId;
    },

    watchlistStations(state) {
      return state.watchlist.map(item => {
        const st = state.stations.find(s => s.id === item.id);
        return {
          ...item,
          station: st || null,
          api: st?.api ?? '--',
          category: st?.category ?? 'good'
        };
      });
    },

    isCurrentStationInWatchlist(state) {
      return state.watchlist.some(w => w.id === state.selectedStationId);
    },

    trend3hAnalysis(state) {
      if (!this.currentStation || !this.currentStation.history24h || this.currentStation.history24h.length < 4) {
        return { delta: 0, status: 'stable' };
      }
      const history = this.currentStation.history24h;
      const current = history[history.length - 1].api;
      const threeHoursAgo = history[history.length - 4].api;
      const delta = current - threeHoursAgo;

      let status = 'stable';
      if (delta >= 5) status = 'deteriorating';
      else if (delta <= -5) status = 'improving';

      return { delta, status };
    },

    isPlumeThreatActive(state) {
      return Boolean(state.activePlumes?.some(p => p.threatLevel === 'severe' || p.threatLevel === 'elevated'));
    }
  },

  actions: {
    async init() {
      this.isLoading = true;
      try {
        // Sanitize existing in-memory communitySensors from any stale cache
        this.communitySensors = (this.communitySensors || []).filter(
          s => typeof s.lat === 'number' && typeof s.lng === 'number' && s.lat >= 0.8 && s.lat <= 7.5 && s.lng >= 99.5 && s.lng <= 119.5
        );
        if (this.communitySensors.length === 0) {
          this.communitySensors = getAllCommunitySensors();
        }

        this.refreshCommunitySensors();
        await Promise.allSettled([
          getAirQualityData().then(data => {
            this.stations = data.stations;
            this.lastUpdated = data.updatedAt;
            this.isLive = data.isLive;
          }),
          this.fetchHotspots(),
          this.fetchForecast()
        ]);

        if (this.activePlumes.length === 0) {
          await this.loadRegionalWindGrid();
        }

        if (navigator.geolocation) {
          this.detectUserLocation(true);
        }
      } catch (err) {
        console.error('Failed to initialize air quality data:', err);
      } finally {
        this.isLoading = false;
      }

      window.addEventListener('online', () => { this.isOffline = false; });
      window.addEventListener('offline', () => { this.isOffline = true; });
    },

    async refreshData(includeLocation = true) {
      this.isRefreshing = true;
      try {
        this.refreshCommunitySensors();
        const [data] = await Promise.all([
          getAirQualityData(true),
          this.fetchHotspots(),
          this.fetchForecast(),
          includeLocation && navigator.geolocation ? this.detectUserLocation(false) : Promise.resolve()
        ]);
        if (data && Array.isArray(data.stations)) {
          this.stations = data.stations;
          this.lastUpdated = data.updatedAt || new Date().toISOString();
          this.isLive = data.isLive;
        }
      } catch (err) {
        console.error('Refresh air quality error:', err);
      } finally {
        this.isRefreshing = false;
      }
    },

    async refreshCommunitySensors() {
      this.isCommunityLoading = true;
      try {
        const result = await fetchLiveOpenAqSensors();
        if (result && Array.isArray(result.nodes) && result.nodes.length > 0) {
          this.communitySensors = result.nodes.filter(
            s => typeof s.lat === 'number' && typeof s.lng === 'number' && s.lat >= 0.8 && s.lat <= 7.5 && s.lng >= 99.5 && s.lng <= 119.5
          );
          this.communitySource = result.source;
        } else {
          this.communitySensors = getAllCommunitySensors();
          this.communitySource = 'preset';
        }
      } catch (e) {
        console.warn('Community sensors fetch error, fallback to presets:', e);
        this.communitySensors = getAllCommunitySensors();
        this.communitySource = 'preset';
      } finally {
        this.isCommunityLoading = false;
      }
    },

    updateOpenAqApiKey(key) {
      setOpenAqApiKey(key);
      this.openAqApiKey = key ? key.trim() : '';
      return this.refreshCommunitySensors();
    },

    toggleCommunitySensors(val) {
      this.showCommunitySensors = typeof val === 'boolean' ? val : !this.showCommunitySensors;
    },

    async fetchForecast(coords = null) {
      this.isForecastLoading = true;
      try {
        const loc = coords || (this.currentStation ? { lat: this.currentStation.lat, lng: this.currentStation.lng } : { lat: 3.139, lng: 101.6869 });
        const res = await fetchAirQualityForecast(loc.lat, loc.lng);
        if (res) {
          this.forecast = res;
        }
      } catch (err) {
        console.warn('Forecast fetch error:', err);
      } finally {
        this.isForecastLoading = false;
      }
    },

    async fetchHotspots(coords = null) {
      try {
        const loc = coords || (this.currentStation ? { lat: this.currentStation.lat, lng: this.currentStation.lng } : null);
        const data = await getLiveHotspots(loc);
        if (data) {
          this.hotspots = data;
        }
        await this.loadRegionalWindGrid();
      } catch (err) {
        console.warn('Live hotspots update error:', err);
      }
    },

    async loadRegionalWindGrid() {
      this.isWindLoading = true;
      try {
        const grid = await fetchRegionalWindGrid();
        this.windFieldGrid = grid;

        const sumatraVector = interpolateWindVector(0.5, 101.5, grid);
        const sumatraPlume = calculatePlumeThreat(
          { lat: 0.5, lng: 101.5, name: 'Sumatra' },
          this.hotspots?.sumatra || 0,
          sumatraVector
        );

        const kalimantanVector = interpolateWindVector(-1.0, 111.5, grid);
        const kalimantanPlume = calculatePlumeThreat(
          { lat: -1.0, lng: 111.5, name: 'Kalimantan' },
          this.hotspots?.kalimantan || 0,
          kalimantanVector
        );

        this.activePlumes = [sumatraPlume, kalimantanPlume];

        if (this.hotspots?.sumatra > 50 || this.hotspots?.kalimantan > 100) {
          this.showWindOverlay = true;
        }
      } catch (err) {
        console.warn('Failed to load regional wind grid:', err);
      } finally {
        this.isWindLoading = false;
      }
    },

    toggleWindOverlay(forceState = null) {
      if (typeof forceState === 'boolean') {
        this.showWindOverlay = forceState;
      } else {
        this.showWindOverlay = !this.showWindOverlay;
      }
    },

    async initialize() {
      return this.init();
    },

    async detectUserLocation(autoSelect = true) {
      this.isLocating = true;
      this.locationError = null;
      try {
        const coords = await getUserCoordinates();
        this.userLocation = coords;
        this.refreshCommunitySensors();

        if (autoSelect && this.stations.length > 0) {
          const nearest = findNearestStation(coords.lat, coords.lng, this.stations);
          if (nearest) {
            this.selectedStationId = nearest.id;
          }
        }
        // Update wind & forecast for user's detected location
        this.fetchHotspots(coords);
        this.fetchForecast(coords);
        return coords;
      } catch (err) {
        console.warn('Geolocation detection error:', err.message);
        this.locationError = err.message;
        return null;
      } finally {
        this.isLocating = false;
      }
    },

    selectStation(id) {
      this.selectedStationId = id;
      this.simulationApi = null;
      const st = [...this.stations, ...this.communitySensors].find(s => s.id === id);
      if (st) {
        if (st.isCommunity) {
          this.showCommunitySensors = true;
        }
        this.fetchHotspots({ lat: st.lat, lng: st.lng });
        this.fetchForecast({ lat: st.lat, lng: st.lng });
      }
    },

    setSimulationApi(val) {
      this.simulationApi = val;
    },

    clearSimulation() {
      this.simulationApi = null;
    },

    setRegion(region) {
      this.selectedRegion = region;
    },

    setProfile(profile) {
      this.activeProfile = profile;
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, profile);
      } catch (e) {}
    },

    toggleWatchlist(stationId, label = '', icon = '📍') {
      const idx = this.watchlist.findIndex(w => w.id === stationId);
      if (idx !== -1) {
        this.watchlist.splice(idx, 1);
      } else {
        const st = this.stations.find(s => s.id === stationId);
        this.watchlist.push({
          id: stationId,
          label: label || st?.name || 'Saved',
          icon
        });
      }
      this.saveWatchlist();
    },

    addToWatchlist({ id, label = '', icon = '📍' }) {
      if (!id) return;
      const existingIdx = this.watchlist.findIndex(w => w.id === id);
      const st = this.stations.find(s => s.id === id);
      const entry = {
        id,
        label: label.trim() || st?.name || 'Saved',
        icon: icon || '📍'
      };
      if (existingIdx !== -1) {
        this.watchlist[existingIdx] = entry;
      } else {
        this.watchlist.push(entry);
      }
      this.saveWatchlist();
    },

    updateWatchlistItem(oldId, updatedData) {
      const idx = this.watchlist.findIndex(w => w.id === oldId);
      if (idx !== -1) {
        this.watchlist[idx] = {
          ...this.watchlist[idx],
          ...updatedData
        };
        this.saveWatchlist();
      }
    },

    removeFromWatchlist(stationId) {
      this.watchlist = this.watchlist.filter(w => w.id !== stationId);
      this.saveWatchlist();
    },

    saveWatchlist() {
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(this.watchlist));
      } catch (e) {}
    },

    setProfile(id) {
      this.activeProfile = id;
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, id);
      } catch (e) {}
    }
  }
});

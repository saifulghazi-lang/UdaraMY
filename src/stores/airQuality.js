import { defineStore } from 'pinia';
import { getAirQualityData, generate24hHistory, generatePollutants } from '../services/apiService.js';
import { getCategoryFromApi } from '../data/stations.js';
import { getUserCoordinates, findNearestStation, calculateDistanceKm } from '../services/locationService.js';
import { getLiveHotspots } from '../services/hotspotService.js';

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
      activeProfile: savedProfile,
      hotspots: {
        sumatra: 142,
        kalimantan: 89,
        malaysia: 14,
        windDirection: 'Southwest (210°)',
        windSpeedKm: '18 km/h',
        smokeTrajectory: 'Northeast towards Straits of Malacca'
      }
    };
  },

  getters: {
    currentStation(state) {
      const st = state.stations.find(s => s.id === state.selectedStationId) || state.stations[0];
      if (!st) return null;

      if (state.simulationApi !== null) {
        const api = state.simulationApi;
        return {
          ...st,
          api,
          category: getCategoryFromApi(api),
          pollutants: generatePollutants(api),
          history24h: generate24hHistory(api)
        };
      }
      return st;
    },

    filteredStations(state) {
      return state.stations.filter(st => {
        const matchesRegion = state.selectedRegion === 'All' || st.region === state.selectedRegion;
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
    }
  },

  actions: {
    async init() {
      this.isLoading = true;
      try {
        await Promise.allSettled([
          getAirQualityData().then(data => {
            this.stations = data.stations;
            this.lastUpdated = data.updatedAt;
            this.isLive = data.isLive;
          }),
          this.fetchHotspots()
        ]);

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
        const [data] = await Promise.all([
          getAirQualityData(true),
          this.fetchHotspots(),
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

    async fetchHotspots(coords = null) {
      try {
        const loc = coords || (this.currentStation ? { lat: this.currentStation.lat, lng: this.currentStation.lng } : null);
        const data = await getLiveHotspots(loc);
        if (data) {
          this.hotspots = data;
        }
      } catch (err) {
        console.warn('Live hotspots update error:', err);
      }
    },

    async detectUserLocation(autoSelect = true) {
      this.isLocating = true;
      this.locationError = null;
      try {
        const coords = await getUserCoordinates();
        this.userLocation = coords;

        if (autoSelect && this.stations.length > 0) {
          const nearest = findNearestStation(coords.lat, coords.lng, this.stations);
          if (nearest) {
            this.selectedStationId = nearest.id;
          }
        }
        // Update wind for user's detected location
        this.fetchHotspots(coords);
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
      const st = this.stations.find(s => s.id === id);
      if (st) {
        this.fetchHotspots({ lat: st.lat, lng: st.lng });
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
    }
  }
});

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula
 * @returns distance in kilometers (rounded to 1 decimal place)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Finds the nearest monitoring station from user's coordinates
 */
export function findNearestStation(userLat, userLng, stations) {
  if (!stations || stations.length === 0) return null;

  let nearest = null;
  let minDistance = Infinity;

  stations.forEach(st => {
    const dist = calculateDistanceKm(userLat, userLng, st.lat, st.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = { ...st, distanceKm: dist };
    }
  });

  return nearest;
}

/**
 * Requests GPS position from browser Geolocation API
 */
export function getUserCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser'));
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      err => {
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

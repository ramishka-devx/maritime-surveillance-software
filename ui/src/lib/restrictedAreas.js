import { apiRequest } from './api.js';

/**
 * Fetch all restricted areas
 * @param {string} token - Auth token
 * @returns {Promise<Array>} Array of restricted areas
 */
export async function getRestrictedAreas(token) {
  const data = await apiRequest('/api/restricted-areas', { token });
  return data;
}

/**
 * Create a new restricted area
 * @param {string} token - Auth token
 * @param {Object} areaData - { name, type, coordinates: [{lat, lon}, ...] }
 * @returns {Promise<Object>} Created restricted area
 */
export async function createRestrictedArea(token, areaData) {
  const data = await apiRequest('/api/restricted-areas', {
    token,
    method: 'POST',
    body: areaData,
  });
  return data;
}

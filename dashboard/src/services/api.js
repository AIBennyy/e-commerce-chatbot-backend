import axios from 'axios';

const API_BASE_URL = '/api/dashboard';

/**
 * Fetch system status information
 * @returns {Promise<Object>} System status data
 */
export async function fetchSystemStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching system status:', error);
    throw error;
  }
}

/**
 * Fetch error logs
 * @param {Object} filters - Optional filters for error logs
 * @returns {Promise<Object>} Error log data
 */
export async function fetchErrorLogs(filters = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/errors`, { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching error logs:', error);
    throw error;
  }
}

/**
 * Fetch cookie health information
 * @returns {Promise<Object>} Cookie health data
 */
export async function fetchCookieHealth() {
  try {
    const response = await axios.get(`${API_BASE_URL}/cookies`);
    return response.data;
  } catch (error) {
    console.error('Error fetching cookie health:', error);
    throw error;
  }
}

/**
 * Fetch system configuration
 * @returns {Promise<Object>} Configuration data
 */
export async function fetchConfiguration() {
  try {
    const response = await axios.get(`${API_BASE_URL}/config`);
    return response.data;
  } catch (error) {
    console.error('Error fetching configuration:', error);
    throw error;
  }
}

/**
 * Update system configuration
 * @param {Object} config - Configuration data to update
 * @returns {Promise<Object>} Updated configuration
 */
export async function updateConfiguration(config) {
  try {
    const response = await axios.post(`${API_BASE_URL}/config`, config);
    return response.data;
  } catch (error) {
    console.error('Error updating configuration:', error);
    throw error;
  }
}

/**
 * Fetch usage statistics
 * @param {Object} params - Optional parameters for statistics
 * @returns {Promise<Object>} Usage statistics data
 */
export async function fetchUsageStats(params = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching usage statistics:', error);
    throw error;
  }
}

/**
 * Fetch performance metrics
 * @param {Object} params - Optional parameters for metrics
 * @returns {Promise<Object>} Performance metrics data
 */
export async function fetchPerformanceMetrics(params = {}) {
  try {
    const response = await axios.get(`${API_BASE_URL}/metrics`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
}

/**
 * Trigger manual cookie refresh for a platform
 * @param {string} platform - Platform identifier
 * @returns {Promise<Object>} Refresh result
 */
export async function refreshPlatformCookies(platform) {
  try {
    const response = await axios.post(`${API_BASE_URL}/cookies/refresh`, { platform });
    return response.data;
  } catch (error) {
    console.error('Error refreshing cookies:', error);
    throw error;
  }
}

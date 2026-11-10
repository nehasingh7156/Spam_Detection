import axios from 'axios';

// Default base URL from Vite environment or fallback to standard FastAPI local address
const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const getApiBaseUrl = () => {
  return localStorage.getItem('emailshield_api_base_url') || DEFAULT_API_BASE_URL;
};

export const setApiBaseUrl = (url) => {
  if (!url) {
    localStorage.removeItem('emailshield_api_base_url');
  } else {
    // Strip trailing slash if present
    const cleanUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('emailshield_api_base_url', cleanUrl);
  }
};

const createApiClient = () => {
  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Health check endpoint
 * GET /api/health
 */
export const checkHealth = async () => {
  const startTime = Date.now();
  const client = createApiClient();
  try {
    const response = await client.get('/api/health');
    const latency = Date.now() - startTime;
    return {
      success: true,
      data: response.data,
      latency,
      status: response.status,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    let message = 'Unable to reach EmailShield backend server.';
    if (error.response?.data?.detail) {
      message = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.code === 'ERR_NETWORK') {
      message = 'Network Error: Backend is offline or connection refused on ' + getApiBaseUrl();
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timeout: Backend took too long to respond.';
    } else if (error.message) {
      message = error.message;
    }

    return {
      success: false,
      error: message,
      latency,
      statusCode: error.response?.status || 0,
      isNetworkError: error.code === 'ERR_NETWORK' || !error.response,
    };
  }
};

/**
 * Single message prediction endpoint
 * POST /api/predict
 * @param {string} message - Message text to classify
 */
export const predictMessage = async (message) => {
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty.');
  }

  const client = createApiClient();
  try {
    const response = await client.post('/api/predict', {
      message: message.trim(),
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    let errorMessage = 'Prediction failed.';
    if (error.response?.data?.detail) {
      errorMessage = typeof error.response.data.detail === 'string'
        ? error.response.data.detail
        : JSON.stringify(error.response.data.detail);
    } else if (error.code === 'ERR_NETWORK') {
      errorMessage = 'Cannot connect to backend server at ' + getApiBaseUrl() + '. Ensure FastAPI is running on port 8000.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      statusCode: error.response?.status || 0,
    };
  }
};

export default {
  getApiBaseUrl,
  setApiBaseUrl,
  checkHealth,
  predictMessage,
};

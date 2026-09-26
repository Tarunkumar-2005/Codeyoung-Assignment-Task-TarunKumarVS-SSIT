import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for structured error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const formattedError = {
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      message: error.response?.data?.error?.message || error.message || 'Something went wrong. Please try again.',
      details: error.response?.data?.error?.details || null,
      status: error.response?.status || 500,
    };
    return Promise.reject(formattedError);
  }
);

export const checkHealth = async () => {
  return apiClient.get('/health');
};

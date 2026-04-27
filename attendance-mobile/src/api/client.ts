import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { secureStorage } from '../utils/secureStorage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await secureStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Ignore storage errors
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      try {
        await secureStorage.removeItem('auth_token');
        await secureStorage.removeItem('user_type');
      } catch (error) {
        // Ignore storage errors
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

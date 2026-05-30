import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../constants/config';
import { secureStorage } from '../utils/secureStorage';
import { clearPersistedAuth } from '../utils/authStorage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearPersistedAuth();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

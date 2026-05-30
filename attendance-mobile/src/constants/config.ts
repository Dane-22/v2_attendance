import { Platform } from 'react-native';

// Use the workstation LAN IP for physical-device testing.
// Update this when your PC gets a different IP from Wi-Fi.
const DEV_HOST = '192.168.100.20';

export const API_BASE_URL = `http://${DEV_HOST}:5000/api`;

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER_TYPE: 'user_type',
  USER: 'auth_user',
  THEME: 'theme_preference',
} as const;

export const APP_COPY = {
  name: 'JAJR Pulse',
  scannerSubtitle: 'Dedicated branch attendance scanner',
} as const;

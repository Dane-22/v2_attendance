import { Platform } from 'react-native';

// Production API URL
const DEV_HOST = 'attendacev2.xandree.com';

export const API_BASE_URL = `https://${DEV_HOST}/api`;

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

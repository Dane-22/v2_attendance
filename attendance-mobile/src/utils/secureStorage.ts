import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/config';

export const secureStorage = {
  setItem: async (key: string, value: any): Promise<void> => {
    try {
      let stringValue: string;
      if (typeof value === 'string') {
        stringValue = value;
      } else if (value === undefined || value === null) {
        stringValue = '';
      } else {
        stringValue = JSON.stringify(value);
      }
      await SecureStore.setItemAsync(key, stringValue);
    } catch (error) {
      console.error('Secure storage error:', error);
      // Fallback to AsyncStorage
      let stringValue: string;
      if (typeof value === 'string') {
        stringValue = value;
      } else if (value === undefined || value === null) {
        stringValue = '';
      } else {
        stringValue = JSON.stringify(value);
      }
      await AsyncStorage.setItem(key, stringValue);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (error) {
      console.error('Secure storage error:', error);
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(key);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Secure storage error:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(key);
    }
  },
};

export const clearAuthData = async (): Promise<void> => {
  await secureStorage.removeItem(STORAGE_KEYS.TOKEN);
  await secureStorage.removeItem(STORAGE_KEYS.USER_TYPE);
};

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const serialize = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return JSON.stringify(value);
};

export const secureStorage = {
  setItem: async (key: string, value: unknown): Promise<void> => {
    const stringValue = serialize(value);
    try {
      await SecureStore.setItemAsync(key, stringValue);
    } catch {
      await AsyncStorage.setItem(key, stringValue);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return await AsyncStorage.getItem(key);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      await AsyncStorage.removeItem(key);
    }
  },
};

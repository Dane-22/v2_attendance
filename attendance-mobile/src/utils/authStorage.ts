import { STORAGE_KEYS } from '../constants/config';
import { API_BASE_URL } from '../constants/config';
import { AuthPayload } from '../types';
import { secureStorage } from './secureStorage';

export const persistAuth = async (payload: AuthPayload) => {
  await Promise.all([
    secureStorage.setItem(STORAGE_KEYS.TOKEN, payload.token),
    secureStorage.setItem(STORAGE_KEYS.USER_TYPE, payload.userType),
    secureStorage.setItem(STORAGE_KEYS.USER, payload.user),
  ]);
};

export const readStoredAuth = async (): Promise<AuthPayload | null> => {
  const [token, userType, userRaw] = await Promise.all([
    secureStorage.getItem(STORAGE_KEYS.TOKEN),
    secureStorage.getItem(STORAGE_KEYS.USER_TYPE),
    secureStorage.getItem(STORAGE_KEYS.USER),
  ]);

  if (!token || !userType || !userRaw) {
    return null;
  }

  try {
    return {
      token,
      userType: userType as AuthPayload['userType'],
      user: JSON.parse(userRaw),
    };
  } catch {
    return null;
  }
};

export const clearPersistedAuth = async () => {
  await Promise.all([
    secureStorage.removeItem(STORAGE_KEYS.TOKEN),
    secureStorage.removeItem(STORAGE_KEYS.USER_TYPE),
    secureStorage.removeItem(STORAGE_KEYS.USER),
  ]);
};

export const destroySession = async () => {
  try {
    const token = await secureStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }
  } catch {
    // Best-effort server logout. Always clear local auth state.
  }
  await clearPersistedAuth();
};

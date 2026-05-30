import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthPayload, AuthState } from '../types';

const initialState: AuthState = {
  isAuthenticated: false,
  isHydrated: false,
  userType: null,
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    hydrateAuth: (state, action: PayloadAction<AuthPayload | null>) => {
      state.isHydrated = true;

      if (!action.payload) {
        state.isAuthenticated = false;
        state.userType = null;
        state.user = null;
        state.token = null;
        return;
      }

      state.isAuthenticated = true;
      state.userType = action.payload.userType;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setAuth: (state, action: PayloadAction<AuthPayload>) => {
      state.isHydrated = true;
      state.isAuthenticated = true;
      state.userType = action.payload.userType;
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isHydrated = true;
      state.isAuthenticated = false;
      state.userType = null;
      state.user = null;
      state.token = null;
    },
  },
});

export const { hydrateAuth, setAuth, logout } = authSlice.actions;
export default authSlice.reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, Admin } from '../types';

const initialState: AuthState = {
  isAuthenticated: false,
  userType: null,
  user: null,
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAdminAuth: (state, action: PayloadAction<{ user: Admin; token: string }>) => {
      state.isAuthenticated = true;
      state.userType = 'admin';
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.userType = null;
      state.user = null;
      state.token = null;
    },
  },
});

export const { setAdminAuth, logout } = authSlice.actions;
export default authSlice.reducer;

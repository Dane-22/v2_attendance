import apiClient from './client';
import { User, Admin } from '../types';

interface LoginResponse {
  token: string;
  user: User | Admin;
  userType: 'admin';
}

export const authApi = {
  adminLogin: async (username: string, password: string) => {
    const response = await apiClient.post<{ success: boolean; message: string; data: LoginResponse }>('/auth/login', {
      username,
      password,
    });
    return response.data.data;
  },
};

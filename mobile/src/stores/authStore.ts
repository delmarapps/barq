import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi, userApi } from '../services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  fullNameAr?: string;
  languagePreference: 'EN' | 'AR';
}

interface AuthState {
  user:        User | null;
  isLoggedIn:  boolean;
  isLoading:   boolean;
  error:       string | null;

  login:    (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  logout:   () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:       null,
  isLoggedIn: false,
  isLoading:  false,
  error:      null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.login({ email, password });
      await SecureStore.setItemAsync('accessToken',  data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (regData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.register(regData);
      await SecureStore.setItemAsync('accessToken',  data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      set({ user: data.user, isLoggedIn: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    const token = await SecureStore.getItemAsync('refreshToken');
    if (token) await authApi.logout(token).catch(() => {});
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, isLoggedIn: false });
  },

  loadUser: async () => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (!token) return;
    try {
      const { data } = await userApi.getProfile();
      set({ user: data, isLoggedIn: true });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
  },

  clearError: () => set({ error: null }),
}));

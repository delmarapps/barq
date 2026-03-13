import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request: attach access token ─────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response: auto-refresh on 401 ───────────────────────────────────
let refreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status !== 401 || original._retry) throw err;

    if (refreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    refreshing = true;

    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
      await SecureStore.setItemAsync('accessToken',  data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);

      queue.forEach((cb) => cb(data.accessToken));
      queue = [];

      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      throw err;
    } finally {
      refreshing = false;
    }
  }
);

// ─── API Functions ────────────────────────────────────────────────────

// Auth
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; fullNameAr?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }),
};

// Wellness
export const wellnessApi = {
  getToday:       () => api.get('/wellness/today'),
  getHistory:     (days = 30) => api.get(`/wellness/history?days=${days}`),
  getWeeklySummary: () => api.get('/wellness/weekly-summary'),
};

// Recovery
export const recoveryApi = {
  getLatest:  () => api.get('/recovery/latest'),
  getHistory: (days = 30) => api.get(`/recovery/history?days=${days}`),
  log: (data: object) => api.post('/recovery/log', data),
};

// Sleep
export const sleepApi = {
  getLastNight: () => api.get('/sleep/last-night'),
  getHistory:   (days = 30) => api.get(`/sleep/history?days=${days}`),
  log: (data: object) => api.post('/sleep/log', data),
};

// Activity
export const activityApi = {
  getToday:   () => api.get('/activity/today'),
  getHistory: (page = 1) => api.get(`/activity/history?page=${page}`),
  start: (data: { activityType: string }) => api.post('/activity/start', data),
  end:   (id: string, data: object) => api.put(`/activity/${id}/end`, data),
  delete:(id: string) => api.delete(`/activity/${id}`),
};

// User
export const userApi = {
  getProfile:     () => api.get('/user'),
  updateProfile:  (data: object) => api.put('/user', data),
  updateLanguage: (language: string) => api.put('/user/language', { language }),
};

// Device
export const deviceApi = {
  getDevices: () => api.get('/device'),
  pair:  (data: object) => api.post('/device/pair', data),
  sync:  (id: string, data: object) => api.put(`/device/${id}/sync`, data),
  delete:(id: string) => api.delete(`/device/${id}`),
};

// Goals
export const goalsApi = {
  getGoals:   () => api.get('/goals'),
  create: (data: object) => api.post('/goals', data),
  update: (id: string, data: object) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
};

// Notifications
export const notificationsApi = {
  getAll:  () => api.get('/notifications'),
  markRead:(id: string) => api.put(`/notifications/${id}/read`),
  delete:  (id: string) => api.delete(`/notifications/${id}`),
};

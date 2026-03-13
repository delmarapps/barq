import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wellnessApi, recoveryApi, sleepApi, activityApi, goalsApi, notificationsApi } from '../services/api';

// ─── WELLNESS ─────────────────────────────────────────────────────────
export function useWellnessToday() {
  return useQuery({
    queryKey: ['wellness', 'today'],
    queryFn:  () => wellnessApi.getToday().then(r => r.data),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    refetchOnWindowFocus: true,
  });
}

export function useWellnessHistory(days = 30) {
  return useQuery({
    queryKey: ['wellness', 'history', days],
    queryFn:  () => wellnessApi.getHistory(days).then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── RECOVERY ────────────────────────────────────────────────────────
export function useLatestRecovery() {
  return useQuery({
    queryKey: ['recovery', 'latest'],
    queryFn:  () => recoveryApi.getLatest().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecoveryHistory(days = 7) {
  return useQuery({
    queryKey: ['recovery', 'history', days],
    queryFn:  () => recoveryApi.getHistory(days).then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── SLEEP ────────────────────────────────────────────────────────────
export function useLastNightSleep() {
  return useQuery({
    queryKey: ['sleep', 'lastNight'],
    queryFn:  () => sleepApi.getLastNight().then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSleepHistory(days = 7) {
  return useQuery({
    queryKey: ['sleep', 'history', days],
    queryFn:  () => sleepApi.getHistory(days).then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
}

// ─── ACTIVITY ────────────────────────────────────────────────────────
export function useTodayActivities() {
  return useQuery({
    queryKey: ['activity', 'today'],
    queryFn:  () => activityApi.getToday().then(r => r.data),
    staleTime: 30 * 1000,   // 30s — refreshes often
    refetchInterval: 60 * 1000,
  });
}

export function useStartActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: string) => activityApi.start({ activityType: type }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity'] }),
  });
}

export function useEndActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      activityApi.end(id, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activity'] });
      qc.invalidateQueries({ queryKey: ['wellness'] });
    },
  });
}

// ─── GOALS ────────────────────────────────────────────────────────────
export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn:  () => goalsApi.getGoals().then(r => r.data),
    staleTime: 60 * 1000,
  });
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll().then(r => r.data),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

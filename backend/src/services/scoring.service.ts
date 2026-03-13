// ─── BARQ WELLNESS SCORING ENGINE ────────────────────────────────────
// All scoring logic centralized here.

// ─── RECOVERY SCORE (0-100) ──────────────────────────────────────────
interface RecoveryInputs {
  hrv: number;
  avgHrv30d: number;     // 30-day average HRV
  rhr: number;
  avgRhr30d: number;     // 30-day average RHR
  bloodOxygen: number;
  skinTempDeviation: number;
  sleepScorePreviousNight: number;
}

export function calculateRecoveryScore(inputs: RecoveryInputs): number {
  // HRV: higher is better — compare to personal baseline
  const hrvDelta  = (inputs.hrv - inputs.avgHrv30d) / (inputs.avgHrv30d || 1);
  const hrvScore  = Math.min(100, Math.max(0, 50 + hrvDelta * 150));

  // RHR: lower is better
  const rhrDelta  = (inputs.avgRhr30d - inputs.rhr) / (inputs.avgRhr30d || 1);
  const rhrScore  = Math.min(100, Math.max(0, 50 + rhrDelta * 150));

  // Blood oxygen: 95-100% = good
  const spo2Score = inputs.bloodOxygen >= 97 ? 100
    : inputs.bloodOxygen >= 95 ? 70
    : inputs.bloodOxygen >= 93 ? 40 : 20;

  // Skin temp: closer to 0 = better
  const tempScore = Math.max(0, 100 - Math.abs(inputs.skinTempDeviation) * 60);

  // Weighted composite
  const score =
    hrvScore  * 0.40 +
    rhrScore  * 0.25 +
    inputs.sleepScorePreviousNight * 0.20 +
    spo2Score * 0.10 +
    tempScore * 0.05;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── SLEEP SCORE (0-100) ─────────────────────────────────────────────
interface SleepInputs {
  totalMinutes: number;
  deepMinutes: number;
  remMinutes: number;
  awakeMinutes: number;
  lightMinutes: number;
  recentSleepScores: number[];  // last 7 nights
}

export function calculateSleepScore(inputs: SleepInputs): number {
  // Duration: 420-540 min (7-9h) = ideal
  const durationScore = inputs.totalMinutes >= 420 && inputs.totalMinutes <= 540
    ? 100
    : inputs.totalMinutes >= 360
    ? 70 + (inputs.totalMinutes - 360) / 60 * 15
    : Math.max(0, inputs.totalMinutes / 360 * 70);

  // Deep sleep: ideal 15-20% of total
  const deepPct = inputs.deepMinutes / (inputs.totalMinutes || 1);
  const deepScore = deepPct >= 0.15 && deepPct <= 0.25 ? 100
    : deepPct >= 0.10 ? 70
    : deepPct * 467;

  // REM: ideal 20-25%
  const remPct = inputs.remMinutes / (inputs.totalMinutes || 1);
  const remScore = remPct >= 0.20 && remPct <= 0.30 ? 100
    : remPct >= 0.15 ? 75
    : remPct * 375;

  // Awakenings penalty
  const awakeScore = Math.max(0, 100 - (inputs.awakeMinutes / (inputs.totalMinutes || 1)) * 200);

  // Consistency vs last 7 nights
  const consistencyScore = inputs.recentSleepScores.length > 0
    ? 100 - Math.min(30, Math.abs(
        inputs.totalMinutes -
        inputs.recentSleepScores.reduce((a, b) => a + b, 0) / inputs.recentSleepScores.length
      ) / 30)
    : 80;

  const score =
    durationScore     * 0.35 +
    deepScore         * 0.25 +
    remScore          * 0.20 +
    awakeScore        * 0.10 +
    consistencyScore  * 0.10;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── STRAIN SCORE (0-21) ─────────────────────────────────────────────
// Mirrors Whoop-style accumulation
interface HrZoneData {
  zone: 'rest' | 'easy' | 'aerobic' | 'threshold' | 'max';
  minutes: number;
}

const ZONE_WEIGHTS: Record<string, number> = {
  rest:      0.0,
  easy:      0.3,
  aerobic:   0.7,
  threshold: 1.2,
  max:       2.0,
};

export function calculateStrainScore(zones: HrZoneData[]): number {
  const raw = zones.reduce((acc, z) => acc + (ZONE_WEIGHTS[z.zone] || 0) * z.minutes, 0);
  // Normalize to 0-21
  const score = Math.min(21, raw / 7);
  return Math.round(score * 10) / 10;
}

// ─── OVERALL WELLNESS SCORE (0-100) ──────────────────────────────────
export function calculateWellnessScore(
  recoveryScore: number,
  sleepScore:    number,
  strainScore:   number   // 0-21
): number {
  const activityScore = (strainScore / 21) * 100;
  const score =
    recoveryScore * 0.40 +
    sleepScore    * 0.35 +
    activityScore * 0.25;
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ─── RECOMMENDATION ENGINE ────────────────────────────────────────────
export function getRecommendation(wellnessScore: number, lang: 'EN' | 'AR' = 'EN'): string {
  const messages = {
    EN: {
      optimal:  'Push hard — your body is ready for intense training.',
      good:     'Moderate session recommended — you\'re in good shape.',
      light:    'Keep it light today — your body needs some recovery.',
      rest:     'Rest day recommended — prioritize sleep and recovery.',
    },
    AR: {
      optimal:  'جسدك جاهز — اضغط بقوة اليوم في التمرين.',
      good:     'تمرين متوسط موصى به — أنت في حالة جيدة.',
      light:    'نشاط خفيف اليوم — جسدك يحتاج للتعافي.',
      rest:     'يوم راحة موصى به — ركّز على النوم والتعافي.',
    },
  };

  const m = messages[lang];
  if (wellnessScore >= 80) return m.optimal;
  if (wellnessScore >= 60) return m.good;
  if (wellnessScore >= 40) return m.light;
  return m.rest;
}

// ─── SLEEP PERFORMANCE ────────────────────────────────────────────────
export function calculateSleepPerformance(
  totalMinutes:  number,
  neededMinutes: number
): number {
  return Math.round(Math.min(100, (totalMinutes / neededMinutes) * 100));
}

// ─── STRAIN NEEDED (based on recovery) ───────────────────────────────
export function getOptimalStrainRange(recoveryScore: number): { min: number; max: number } {
  if (recoveryScore >= 80) return { min: 14, max: 18 };
  if (recoveryScore >= 60) return { min: 10, max: 14 };
  if (recoveryScore >= 40) return { min: 6,  max: 10 };
  return { min: 2, max: 6 };
}

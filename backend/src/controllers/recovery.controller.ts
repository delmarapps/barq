// ─── RECOVERY ────────────────────────────────────────────────────────
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';
import { calculateRecoveryScore } from '../services/scoring.service';

export async function getLatestRecovery(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const latest = await prisma.recoveryMetric.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  });

  if (!latest) return res.status(404).json({ error: 'No recovery data yet' });

  // 30-day averages for context
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const history = await prisma.recoveryMetric.findMany({
    where: { userId, recordedAt: { gte: thirtyDaysAgo } },
  });

  const avg30hrv = history.reduce((a, b) => a + (b.hrvMs || 0), 0) / (history.length || 1);
  const avg30rhr = history.reduce((a, b) => a + (b.restingHrBpm || 0), 0) / (history.length || 1);

  return res.json({
    ...latest,
    avg30DayHrv: Math.round(avg30hrv * 10) / 10,
    avg30DayRhr: Math.round(avg30rhr),
  });
}

export async function getRecoveryHistory(req: AuthRequest, res: Response) {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const from = new Date();
  from.setDate(from.getDate() - days);

  const metrics = await prisma.recoveryMetric.findMany({
    where: { userId: req.userId!, recordedAt: { gte: from } },
    orderBy: { recordedAt: 'asc' },
  });

  return res.json({ metrics, days });
}

export async function logRecovery(req: AuthRequest, res: Response) {
  const { hrvMs, restingHrBpm, skinTempDeviation, bloodOxygenPct, respiratoryRate } = req.body;
  const userId = req.userId!;

  // Get 30d averages for scoring
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const history = await prisma.recoveryMetric.findMany({
    where: { userId, recordedAt: { gte: thirtyDaysAgo } },
  });
  const lastSleep = await prisma.sleepSession.findFirst({
    where: { userId }, orderBy: { sleepEnd: 'desc' },
  });

  const avg30hrv = history.length
    ? history.reduce((a, b) => a + (b.hrvMs || 0), 0) / history.length
    : hrvMs;
  const avg30rhr = history.length
    ? history.reduce((a, b) => a + (b.restingHrBpm || 0), 0) / history.length
    : restingHrBpm;

  const recoveryScore = calculateRecoveryScore({
    hrv: hrvMs, avgHrv30d: avg30hrv,
    rhr: restingHrBpm, avgRhr30d: avg30rhr,
    bloodOxygen: bloodOxygenPct,
    skinTempDeviation: skinTempDeviation ?? 0,
    sleepScorePreviousNight: lastSleep?.sleepScore ?? 50,
  });

  const metric = await prisma.recoveryMetric.create({
    data: {
      userId,
      recordedAt: new Date(),
      recoveryScore,
      hrvMs,
      restingHrBpm,
      skinTempDeviation,
      bloodOxygenPct,
      respiratoryRate,
    },
  });

  return res.status(201).json({ ...metric, recoveryScore });
}

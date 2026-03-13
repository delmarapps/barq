import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';
import { calculateSleepScore, calculateSleepPerformance } from '../services/scoring.service';

export async function getLastNightSleep(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const session = await prisma.sleepSession.findFirst({
    where: { userId },
    orderBy: { sleepEnd: 'desc' },
  });

  if (!session) return res.status(404).json({ error: 'No sleep data yet' });

  // 7-day trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const trend = await prisma.sleepSession.findMany({
    where: { userId, sleepEnd: { gte: sevenDaysAgo } },
    orderBy: { sleepEnd: 'asc' },
    select: { sleepScore: true, totalMinutes: true, sleepEnd: true },
  });

  return res.json({ session, trend });
}

export async function getSleepHistory(req: AuthRequest, res: Response) {
  const days = Math.min(Number(req.query.days) || 30, 90);
  const from = new Date();
  from.setDate(from.getDate() - days);

  const sessions = await prisma.sleepSession.findMany({
    where: { userId: req.userId!, sleepEnd: { gte: from } },
    orderBy: { sleepEnd: 'asc' },
  });

  return res.json({ sessions, days });
}

export async function logSleep(req: AuthRequest, res: Response) {
  const { sleepStart, sleepEnd, awakeMinutes = 0, lightMinutes, deepMinutes, remMinutes } = req.body;
  const userId = req.userId!;

  const start = new Date(sleepStart);
  const end   = new Date(sleepEnd);
  const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000) - awakeMinutes;

  // Get recent sleep for consistency scoring
  const recent = await prisma.sleepSession.findMany({
    where: { userId }, orderBy: { sleepEnd: 'desc' }, take: 7,
    select: { totalMinutes: true },
  });

  const sleepScore = calculateSleepScore({
    totalMinutes,
    deepMinutes:   deepMinutes ?? Math.round(totalMinutes * 0.18),
    remMinutes:    remMinutes  ?? Math.round(totalMinutes * 0.22),
    awakeMinutes,
    lightMinutes:  lightMinutes ?? totalMinutes - deepMinutes - remMinutes - awakeMinutes,
    recentSleepScores: recent.map(r => r.totalMinutes),
  });

  const performance = calculateSleepPerformance(totalMinutes, 480);

  const session = await prisma.sleepSession.create({
    data: {
      userId,
      sleepStart: start,
      sleepEnd:   end,
      totalMinutes,
      awakeMinutes,
      lightMinutes: lightMinutes ?? Math.round(totalMinutes * 0.50),
      deepMinutes:  deepMinutes  ?? Math.round(totalMinutes * 0.18),
      remMinutes:   remMinutes   ?? Math.round(totalMinutes * 0.22),
      sleepScore,
      sleepPerformancePct: performance,
    },
  });

  return res.status(201).json(session);
}

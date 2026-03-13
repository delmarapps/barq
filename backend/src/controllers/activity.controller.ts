import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';
import { calculateStrainScore } from '../services/scoring.service';
import { ActivityType } from '@prisma/client';

export async function getTodayActivities(req: AuthRequest, res: Response) {
  const userId  = req.userId!;
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

  const sessions = await prisma.activitySession.findMany({
    where: { userId, startedAt: { gte: today, lt: tomorrow } },
    include: { hrZones: true },
    orderBy: { startedAt: 'asc' },
  });

  const activeSession = sessions.find(s => s.isActive);
  const totalStrain   = sessions.reduce((a, b) => a + (b.strainPoints ?? 0), 0);
  const totalCalories = sessions.reduce((a, b) => a + (b.caloriesBurned ?? 0), 0);

  return res.json({ sessions, activeSession: activeSession || null, totalStrain, totalCalories });
}

export async function startActivity(req: AuthRequest, res: Response) {
  const { activityType, notes } = req.body;
  const userId = req.userId!;

  // End any active sessions first
  await prisma.activitySession.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false, endedAt: new Date() },
  });

  const session = await prisma.activitySession.create({
    data: {
      userId,
      activityType: activityType as ActivityType,
      startedAt: new Date(),
      isActive: true,
      notes,
    },
  });

  return res.status(201).json(session);
}

export async function endActivity(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { avgHrBpm, maxHrBpm, caloriesBurned, steps, hrZones } = req.body;
  const userId = req.userId!;

  const session = await prisma.activitySession.findFirst({
    where: { id, userId },
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const endedAt       = new Date();
  const durationMinutes = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 60000);

  // Calculate strain from HR zones
  let strainPoints = 0;
  if (hrZones && hrZones.length > 0) {
    strainPoints = calculateStrainScore(hrZones);
  } else {
    // Estimate from duration and avg HR
    const intensity = avgHrBpm ? Math.min(1, (avgHrBpm - 60) / 100) : 0.5;
    strainPoints = Math.round(durationMinutes * intensity * 0.12 * 10) / 10;
  }

  const updated = await prisma.activitySession.update({
    where: { id },
    data: {
      endedAt,
      durationMinutes,
      isActive: false,
      avgHrBpm,
      maxHrBpm,
      caloriesBurned,
      steps,
      strainPoints,
    },
  });

  // Save HR zones if provided
  if (hrZones?.length) {
    await prisma.hrZone.createMany({
      data: hrZones.map((z: any) => ({
        sessionId:    id,
        zoneName:     z.zone,
        minutesInZone:z.minutes,
        percentage:   z.percentage ?? 0,
      })),
    });
  }

  return res.json(updated);
}

export async function getActivityHistory(req: AuthRequest, res: Response) {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [sessions, total] = await Promise.all([
    prisma.activitySession.findMany({
      where: { userId: req.userId!, isActive: false },
      include: { hrZones: true },
      orderBy: { startedAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.activitySession.count({ where: { userId: req.userId!, isActive: false } }),
  ]);

  return res.json({ sessions, total, page: Number(page), limit: Number(limit) });
}

export async function deleteActivity(req: AuthRequest, res: Response) {
  const { id } = req.params;
  await prisma.activitySession.deleteMany({ where: { id, userId: req.userId! } });
  return res.json({ deleted: true });
}

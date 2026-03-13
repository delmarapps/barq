import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';
import {
  calculateWellnessScore,
  calculateRecoveryScore,
  getRecommendation,
  getOptimalStrainRange,
} from '../services/scoring.service';

// ─── TODAY ────────────────────────────────────────────────────────────
export async function getToday(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const today  = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or compute today's score
    let score = await prisma.wellnessScore.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (!score) {
      // Compute from latest data
      const recovery = await prisma.recoveryMetric.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      });
      const sleep = await prisma.sleepSession.findFirst({
        where: { userId },
        orderBy: { sleepEnd: 'desc' },
      });

      const recoveryScore = recovery?.recoveryScore ?? 50;
      const sleepScore    = sleep?.sleepScore ?? 50;
      const strainScore   = 0;
      const overall       = calculateWellnessScore(recoveryScore, sleepScore, strainScore);

      score = await prisma.wellnessScore.create({
        data: {
          userId,
          date: today,
          overallScore: overall,
          recoveryScore,
          strainScore,
          sleepScore,
          recommendation: getRecommendation(overall),
        },
      });
    }

    // 7-day history for chart
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const history = await prisma.wellnessScore.findMany({
      where: { userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const lang = (user?.languagePreference || 'EN') as 'EN' | 'AR';
    const strainRange = getOptimalStrainRange(score.recoveryScore);

    return res.json({
      today: {
        ...score,
        recommendation: getRecommendation(score.overallScore, lang),
        optimalStrainRange: strainRange,
      },
      history: history.map(h => ({
        date: h.date,
        overallScore:  h.overallScore,
        recoveryScore: h.recoveryScore,
        strainScore:   h.strainScore,
        sleepScore:    h.sleepScore,
      })),
      weeklyAvg: history.length
        ? Math.round(history.reduce((a, b) => a + b.overallScore, 0) / history.length)
        : score.overallScore,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch wellness data' });
  }
}

// ─── HISTORY ──────────────────────────────────────────────────────────
export async function getHistory(req: AuthRequest, res: Response) {
  const days   = Math.min(Number(req.query.days) || 30, 365);
  const userId = req.userId!;
  const from   = new Date();
  from.setDate(from.getDate() - days);

  const scores = await prisma.wellnessScore.findMany({
    where: { userId, date: { gte: from } },
    orderBy: { date: 'asc' },
  });

  return res.json({ scores, days });
}

// ─── WEEKLY SUMMARY ──────────────────────────────────────────────────
export async function getWeeklySummary(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const from   = new Date();
  from.setDate(from.getDate() - 7);

  const scores = await prisma.wellnessScore.findMany({
    where: { userId, date: { gte: from } },
  });

  if (!scores.length) return res.json({ message: 'No data available' });

  const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  return res.json({
    avgOverall:   avg(scores.map(s => s.overallScore)),
    avgRecovery:  avg(scores.map(s => s.recoveryScore)),
    avgStrain:    avg(scores.map(s => s.strainScore)),
    avgSleep:     avg(scores.map(s => s.sleepScore)),
    daysTracked:  scores.length,
  });
}

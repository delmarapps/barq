import { PrismaClient, ActivityType, GoalType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BARQ database...');

  // ─── Create test user ────────────────────────────────
  const passwordHash = await bcrypt.hash('barq1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'ahmed@barq.sa' },
    update: {},
    create: {
      email: 'ahmed@barq.sa',
      passwordHash,
      fullName: 'Ahmed Mohamed',
      fullNameAr: 'أحمد محمد',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      weightKg: 80,
      heightCm: 178,
      languagePreference: 'AR',
    },
  });
  console.log('✅ User created:', user.email);

  // ─── Device ──────────────────────────────────────────
  await prisma.device.upsert({
    where: { id: 'device-seed-001' },
    update: {},
    create: {
      id: 'device-seed-001',
      userId: user.id,
      deviceName: 'BARQ Pro S2',
      deviceSerial: 'BRQ-2026-001234',
      firmwareVersion: '2.1.4',
      batteryLevel: 87,
      lastSyncedAt: new Date(),
    },
  });
  console.log('✅ Device created');

  // ─── Seed 14 days of wellness + recovery + sleep ─────
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateOnly = new Date(date.toISOString().split('T')[0]);

    const recoveryScore  = 50 + Math.random() * 40;
    const sleepScore     = 55 + Math.random() * 40;
    const strainScore    = 5  + Math.random() * 14;
    const overallScore   = recoveryScore * 0.4 + sleepScore * 0.35 + (strainScore / 21) * 100 * 0.25;

    // Wellness
    await prisma.wellnessScore.upsert({
      where: { userId_date: { userId: user.id, date: dateOnly } },
      update: {},
      create: {
        userId: user.id,
        date: dateOnly,
        overallScore: Math.round(overallScore),
        recoveryScore: Math.round(recoveryScore),
        strainScore: Math.round(strainScore * 10) / 10,
        sleepScore: Math.round(sleepScore),
      },
    });

    // Recovery metrics
    await prisma.recoveryMetric.create({
      data: {
        userId: user.id,
        recordedAt: new Date(date.setHours(7, 0, 0)),
        recoveryScore: Math.round(recoveryScore),
        hrvMs: 45 + Math.random() * 25,
        restingHrBpm: Math.round(55 + Math.random() * 10),
        skinTempDeviation: (Math.random() - 0.5) * 0.8,
        bloodOxygenPct: 96 + Math.random() * 3,
        respiratoryRate: 14 + Math.random() * 4,
      },
    });

    // Sleep session (previous night)
    const sleepStart = new Date(dateOnly);
    sleepStart.setHours(23, 30);
    sleepStart.setDate(sleepStart.getDate() - 1);
    const sleepEnd = new Date(dateOnly);
    sleepEnd.setHours(7, 15);

    const totalMins = 465;
    await prisma.sleepSession.create({
      data: {
        userId: user.id,
        sleepStart,
        sleepEnd,
        totalMinutes: totalMins,
        awakeMinutes: Math.round(10 + Math.random() * 20),
        lightMinutes: Math.round(130 + Math.random() * 40),
        deepMinutes:  Math.round(80 + Math.random() * 40),
        remMinutes:   Math.round(70 + Math.random() * 40),
        sleepScore: Math.round(sleepScore),
        sleepPerformancePct: (sleepScore / 100) * 100,
      },
    });
  }
  console.log('✅ 14 days of wellness + recovery + sleep seeded');

  // ─── Sample activity sessions ─────────────────────────
  const activities: Array<{ type: ActivityType; strain: number; dur: number; cal: number }> = [
    { type: 'walking',  strain: 4.2,  dur: 32,  cal: 210 },
    { type: 'running',  strain: 12.5, dur: 45,  cal: 480 },
    { type: 'strength', strain: 9.8,  dur: 60,  cal: 320 },
  ];

  for (const act of activities) {
    const startTime = new Date();
    startTime.setHours(6, 30, 0);
    const endTime = new Date(startTime.getTime() + act.dur * 60 * 1000);

    await prisma.activitySession.create({
      data: {
        userId: user.id,
        activityType: act.type,
        startedAt: startTime,
        endedAt: endTime,
        durationMinutes: act.dur,
        strainPoints: act.strain,
        avgHrBpm: 120 + Math.round(Math.random() * 30),
        maxHrBpm: 160 + Math.round(Math.random() * 20),
        caloriesBurned: act.cal,
        steps: act.type === 'walking' || act.type === 'running' ? Math.round(act.dur * 120) : undefined,
        isActive: false,
      },
    });
  }
  console.log('✅ Activity sessions seeded');

  // ─── Goals ───────────────────────────────────────────
  const goalTypes: GoalType[] = ['better_sleep', 'build_strength', 'more_active'];
  for (const goalType of goalTypes) {
    await prisma.goal.create({ data: { userId: user.id, goalType } });
  }
  console.log('✅ Goals seeded');

  // ─── Notifications ───────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'recovery',
        titleEn: 'Morning Recovery Ready',
        titleAr: 'تقرير التعافي الصباحي',
        bodyEn: 'Your recovery score is 74 — a solid day for moderate training.',
        bodyAr: 'درجة تعافيك 74 — يوم مثالي لتمرين متوسط.',
      },
      {
        userId: user.id,
        type: 'sleep',
        titleEn: 'Sleep Goal Achieved!',
        titleAr: 'حققت هدف النوم!',
        bodyEn: 'You hit 7h 20m of sleep last night. Keep it up!',
        bodyAr: 'حصلت على 7 ساعات و20 دقيقة من النوم الليلة الماضية.',
      },
    ],
  });
  console.log('✅ Notifications seeded');

  console.log('\n🚀 Seed complete! Login: ahmed@barq.sa / barq1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

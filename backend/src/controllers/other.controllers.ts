import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';

// ══════════════════════════════════════════════
// USER
// ══════════════════════════════════════════════
export async function getProfile(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: {
      id: true, email: true, fullName: true, fullNameAr: true,
      dateOfBirth: true, gender: true, weightKg: true, heightCm: true,
      languagePreference: true, avatarUrl: true, createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const { fullName, fullNameAr, dateOfBirth, gender, weightKg, heightCm } = req.body;
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: { fullName, fullNameAr, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, gender, weightKg, heightCm },
    select: { id: true, email: true, fullName: true, fullNameAr: true, languagePreference: true },
  });
  return res.json(user);
}

export async function updateLanguage(req: AuthRequest, res: Response) {
  const { language } = req.body;
  if (!['EN', 'AR'].includes(language)) return res.status(400).json({ error: 'Invalid language' });
  await prisma.user.update({ where: { id: req.userId! }, data: { languagePreference: language } });
  return res.json({ language });
}

export async function deleteAccount(req: AuthRequest, res: Response) {
  await prisma.user.delete({ where: { id: req.userId! } });
  return res.json({ deleted: true });
}

// ══════════════════════════════════════════════
// DEVICE
// ══════════════════════════════════════════════
export async function getDevices(req: AuthRequest, res: Response) {
  const devices = await prisma.device.findMany({ where: { userId: req.userId! } });
  return res.json(devices);
}

export async function pairDevice(req: AuthRequest, res: Response) {
  const { deviceName, deviceSerial, firmwareVersion } = req.body;
  const device = await prisma.device.create({
    data: { userId: req.userId!, deviceName, deviceSerial, firmwareVersion },
  });
  return res.status(201).json(device);
}

export async function syncDevice(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const { batteryLevel, firmwareVersion } = req.body;
  const device = await prisma.device.updateMany({
    where: { id, userId: req.userId! },
    data: { batteryLevel, firmwareVersion, lastSyncedAt: new Date() },
  });
  return res.json({ synced: true, device });
}

export async function deleteDevice(req: AuthRequest, res: Response) {
  await prisma.device.deleteMany({ where: { id: req.params.id, userId: req.userId! } });
  return res.json({ deleted: true });
}

// ══════════════════════════════════════════════
// GOALS
// ══════════════════════════════════════════════
export async function getGoals(req: AuthRequest, res: Response) {
  const goals = await prisma.goal.findMany({
    where: { userId: req.userId!, isActive: true },
  });
  return res.json(goals);
}

export async function createGoal(req: AuthRequest, res: Response) {
  const { goalType, targetValue, unit } = req.body;
  const goal = await prisma.goal.create({
    data: { userId: req.userId!, goalType, targetValue, unit },
  });
  return res.status(201).json(goal);
}

export async function updateGoal(req: AuthRequest, res: Response) {
  const { isActive, targetValue } = req.body;
  const goal = await prisma.goal.updateMany({
    where: { id: req.params.id, userId: req.userId! },
    data: { isActive, targetValue },
  });
  return res.json(goal);
}

export async function deleteGoal(req: AuthRequest, res: Response) {
  await prisma.goal.deleteMany({ where: { id: req.params.id, userId: req.userId! } });
  return res.json({ deleted: true });
}

// ══════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════
export async function getNotifications(req: AuthRequest, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  const unread = notifications.filter(n => !n.readAt).length;
  return res.json({ notifications, unread });
}

export async function markRead(req: AuthRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.userId! },
    data: { readAt: new Date() },
  });
  return res.json({ read: true });
}

export async function deleteNotification(req: AuthRequest, res: Response) {
  await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.userId! } });
  return res.json({ deleted: true });
}

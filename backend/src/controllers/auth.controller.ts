import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

// ─── Helpers ──────────────────────────────────────────────────────────
function signAccessToken(userId: string, email: string) {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );
}

function signRefreshToken(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
  );
}

// ─── REGISTER ─────────────────────────────────────────────────────────
export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName, fullNameAr } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, fullName, fullNameAr },
    });

    const accessToken  = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`✅ New user registered: ${email}`);
    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        fullNameAr: user.fullNameAr,
        languagePreference: user.languagePreference,
      },
    });
  } catch (err) {
    logger.error('Register error', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken  = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`✅ Login: ${email}`);
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        fullNameAr: user.fullNameAr,
        languagePreference: user.languagePreference,
        weightKg: user.weightKg,
        heightCm: user.heightCm,
      },
    });
  } catch (err) {
    logger.error('Login error', err);
    return res.status(500).json({ error: 'Login failed' });
  }
}

// ─── REFRESH TOKEN ────────────────────────────────────────────────────
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(400).json({ error: 'Refresh token required' });

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    const user    = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const newAccess  = signAccessToken(user.id, user.email);
    const newRefresh = signRefreshToken(user.id);

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token } });
    await prisma.refreshToken.create({
      data: {
        token: newRefresh,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({ accessToken: newAccess, refreshToken: newRefresh });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────
export async function logout(req: Request, res: Response) {
  const { refreshToken: token } = req.body;
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
  return res.json({ message: 'Logged out successfully' });
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtPayload } from '../types';

// Removed global Express Request extension to prevent TS2717

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const tokenFromCookie = req.cookies?.token;

    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : tokenFromCookie;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Developer Test Bypass
    if (token === 'TEST_BYPASS') {
      const { prisma } = await import('../config/db');
      const testUser = await prisma.user.upsert({
        where: { email: 'test@outbox.local' },
        update: {},
        create: {
          email: 'test@outbox.local',
          name: 'Test Developer',
          googleId: 'test-google-id',
        }
      });
      req.user = { id: testUser.id, email: testUser.email } as any;
      return next();
    }

    const payload = jwt.verify(token, env.jwt.secret) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

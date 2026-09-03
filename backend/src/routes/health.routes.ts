import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { esClient } from '../config/elasticsearch';
import { getQueueCounts } from '../services/queue.service';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/health — System health check
router.get('/', async (_req: Request, res: Response) => {
  const checks: Record<string, { status: string; message?: string }> = {};

  // PostgreSQL
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'healthy' };
  } catch (error) {
    checks.database = { status: 'unhealthy', message: String(error) };
  }

  // Redis
  try {
    await redis.ping();
    checks.redis = { status: 'healthy' };
  } catch (error) {
    checks.redis = { status: 'unhealthy', message: String(error) };
  }

  // Elasticsearch
  try {
    await esClient.ping();
    checks.elasticsearch = { status: 'healthy' };
  } catch (error) {
    checks.elasticsearch = { status: 'unhealthy', message: String(error) };
  }

  // BullMQ Queue
  try {
    const counts = await getQueueCounts();
    checks.queue = {
      status: 'healthy',
      message: `active=${counts.active}, delayed=${counts.delayed}, waiting=${counts.waiting}`,
    };
  } catch (error) {
    checks.queue = { status: 'unhealthy', message: String(error) };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;

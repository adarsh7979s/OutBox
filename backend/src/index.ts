import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';
import { initElasticsearch } from './config/elasticsearch';
import { emailQueue } from './services/queue.service';
import { startWorker, stopWorker, recoverMissedJobs } from './services/worker.service';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

import authRoutes from './routes/auth.routes';
import emailRoutes from './routes/email.routes';
import senderRoutes from './routes/sender.routes';
import slackRoutes from './routes/slack.routes';
import healthRoutes from './routes/health.routes';

async function bootstrap() {
  const app = express();

  // ── Middleware ──
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());

  // ── Bull Board (Queue Dashboard) ──
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: [new BullMQAdapter(emailQueue) as any],
    serverAdapter,
  });
  app.use('/admin/queues', serverAdapter.getRouter());

  // ── Routes ──
  app.use('/api/auth', authRoutes);
  app.use('/api/emails', emailRoutes);
  app.use('/api/senders', senderRoutes);
  app.use('/api/slack', slackRoutes);
  app.use('/api/health', healthRoutes);

  // ── Root ──
  app.get('/', (_req, res) => {
    res.json({
      service: 'OutBox Email Scheduler API',
      version: '1.0.0',
      docs: {
        health: '/api/health',
        queueDashboard: '/admin/queues',
      },
    });
  });

  // ── Error Handler (must be last) ──
  app.use(errorHandler);

  // ── Connect Infrastructure ──
  await connectDatabase();
  await initElasticsearch();

  // ── Start Worker ──
  startWorker();

  // ── Recover Missed Jobs (on restart) ──
  const recovered = await recoverMissedJobs();
  if (recovered > 0) {
    logger.info(`Recovered ${recovered} missed jobs from previous session`);
  }

  // ── Start Server ──
  const server = app.listen(env.port, () => {
    logger.info(`🚀 Server running on http://localhost:${env.port}`);
    logger.info(`📊 Bull Board: http://localhost:${env.port}/admin/queues`);
    logger.info(`🏥 Health: http://localhost:${env.port}/api/health`);
  });

  // ── Graceful Shutdown ──
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    await stopWorker();
    await disconnectDatabase();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
    // Force exit after 10 seconds
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

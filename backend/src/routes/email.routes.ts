import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import {
  scheduleEmails,
  getEmails,
  getEmailCounts,
  cancelEmail,
} from '../services/email.service';
import { searchEmails } from '../services/search.service';
import { logger } from '../utils/logger';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const scheduleSchema = z.object({
  senderId: z.string().uuid(),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  scheduledAt: z.string().refine(
    (val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(),
    'scheduledAt must be a valid future date'
  ),
  delayBetweenEmails: z.number().min(0).default(2),
  hourlyLimit: z.number().min(1).optional(),
});

const paginationSchema = z.object({
  page: z.string().optional().transform((v) => parseInt(v || '1', 10)),
  limit: z.string().optional().transform((v) => parseInt(v || '20', 10)),
});

// POST /api/emails/schedule — Schedule a batch of emails
router.post('/schedule', validate(scheduleSchema), async (req: Request, res: Response) => {
  try {
    const result = await scheduleEmails(req.user!.id, req.body);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Schedule error:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

// GET /api/emails/scheduled — List scheduled emails
router.get(
  '/scheduled',
  validateQuery(paginationSchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query as any;
      const result = await getEmails(
        req.user!.id,
        ['SCHEDULED', 'RATE_LIMITED', 'PROCESSING'],
        page,
        limit
      );
      res.json(result);
    } catch (error) {
      logger.error('Fetch scheduled emails error:', error);
      res.status(500).json({ error: 'Failed to fetch scheduled emails' });
    }
  }
);

// GET /api/emails/sent — List sent emails
router.get(
  '/sent',
  validateQuery(paginationSchema),
  async (req: Request, res: Response) => {
    try {
      const { page, limit } = req.query as any;
      const result = await getEmails(req.user!.id, ['SENT', 'FAILED'], page, limit);
      res.json(result);
    } catch (error) {
      logger.error('Fetch sent emails error:', error);
      res.status(500).json({ error: 'Failed to fetch sent emails' });
    }
  }
);

// GET /api/emails/counts — Get email counts for sidebar badges
router.get('/counts', async (req: Request, res: Response) => {
  try {
    const counts = await getEmailCounts(req.user!.id);
    res.json(counts);
  } catch (error) {
    logger.error('Fetch counts error:', error);
    res.status(500).json({ error: 'Failed to fetch counts' });
  }
});

// GET /api/emails/search — Full-text search via Elasticsearch
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, status, page, limit } = req.query;
    const result = await searchEmails(
      req.user!.id,
      (q as string) || '',
      status as string,
      parseInt((page as string) || '1', 10),
      parseInt((limit as string) || '20', 10)
    );
    res.json(result);
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/emails/:id — Get single email details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { prisma } = await import('../config/db');
    const email = await prisma.email.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
      include: { sender: { select: { email: true, name: true } } },
    });

    if (!email) {
      res.status(404).json({ error: 'Email not found' });
      return;
    }

    res.json(email);
  } catch (error) {
    logger.error('Fetch email error:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

// DELETE /api/emails/:id — Cancel a scheduled email
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await cancelEmail(req.user!.id, req.params.id);
    res.json({ message: 'Email cancelled successfully' });
  } catch (error: any) {
    logger.error('Cancel email error:', error);
    res.status(error.statusCode || 500).json({ error: error.message });
  }
});

export default router;

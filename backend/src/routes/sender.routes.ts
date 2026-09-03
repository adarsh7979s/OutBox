import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../config/db';
import { createEtherealAccount } from '../services/smtp.service';
import { logger } from '../utils/logger';

const router = Router();
router.use(authMiddleware);

const createSenderSchema = z.object({
  email: z.string().email().optional(), // If not provided, use Ethereal-generated email
  name: z.string().optional(),
  maxEmailsPerHour: z.number().min(1).max(1000).default(50),
});

// POST /api/senders — Create a new sender with auto-generated Ethereal credentials
router.post('/', validate(createSenderSchema), async (req: Request, res: Response) => {
  try {
    const { name, maxEmailsPerHour } = req.body;

    // Create Ethereal test account
    const ethereal = await createEtherealAccount();

    const sender = await prisma.sender.create({
      data: {
        userId: req.user!.id,
        email: req.body.email || ethereal.email,
        name: name || 'Email Sender',
        etherealUser: ethereal.user,
        etherealPass: ethereal.pass,
        maxEmailsPerHour,
      },
    });

    res.status(201).json({
      id: sender.id,
      email: sender.email,
      name: sender.name,
      maxEmailsPerHour: sender.maxEmailsPerHour,
      createdAt: sender.createdAt,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'A sender with this email already exists' });
      return;
    }
    logger.error('Create sender error:', error);
    res.status(500).json({ error: 'Failed to create sender' });
  }
});

// GET /api/senders — List user's senders
router.get('/', async (req: Request, res: Response) => {
  try {
    const senders = await prisma.sender.findMany({
      where: { userId: req.user!.id, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        maxEmailsPerHour: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(senders);
  } catch (error) {
    logger.error('List senders error:', error);
    res.status(500).json({ error: 'Failed to list senders' });
  }
});

// DELETE /api/senders/:id — Deactivate a sender
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const sender = await prisma.sender.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });

    if (!sender) {
      res.status(404).json({ error: 'Sender not found' });
      return;
    }

    await prisma.sender.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    res.json({ message: 'Sender removed successfully' });
  } catch (error) {
    logger.error('Delete sender error:', error);
    res.status(500).json({ error: 'Failed to delete sender' });
  }
});

export default router;

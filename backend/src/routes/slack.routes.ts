import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { env } from '../config/env';
import { handleSlackOAuthCallback, disconnectSlack } from '../services/slack.service';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/slack/connect — Redirect to Slack OAuth consent
router.get('/connect', authMiddleware, (req: Request, res: Response) => {
  const state = req.user!.id; // Pass userId in state for the callback

  const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize');
  slackAuthUrl.searchParams.set('client_id', env.slack.clientId);
  slackAuthUrl.searchParams.set('scope', 'chat:write,incoming-webhook');
  slackAuthUrl.searchParams.set('redirect_uri', env.slack.redirectUri);
  slackAuthUrl.searchParams.set('state', state);

  res.redirect(slackAuthUrl.toString());
});

// GET /api/slack/callback — Slack OAuth callback
router.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || !userId) {
      res.redirect(`${env.frontendUrl}/dashboard?slack=error&reason=missing_params`);
      return;
    }

    const result = await handleSlackOAuthCallback(userId as string, code as string);

    res.redirect(
      `${env.frontendUrl}/dashboard?slack=connected&team=${encodeURIComponent(result.teamName)}`
    );
  } catch (error) {
    logger.error('Slack OAuth callback error:', error);
    res.redirect(`${env.frontendUrl}/dashboard?slack=error`);
  }
});

// POST /api/slack/disconnect — Remove Slack integration
router.post('/disconnect', authMiddleware, async (req: Request, res: Response) => {
  try {
    await disconnectSlack(req.user!.id);
    res.json({ message: 'Slack disconnected' });
  } catch (error) {
    logger.error('Slack disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Slack' });
  }
});

// GET /api/slack/status — Check Slack connection status
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { slackTeamName: true, slackWebhook: true },
    });

    res.json({
      connected: !!(user?.slackTeamName),
      teamName: user?.slackTeamName || null,
    });
  } catch (error) {
    logger.error('Slack status error:', error);
    res.status(500).json({ error: 'Failed to check Slack status' });
  }
});

export default router;

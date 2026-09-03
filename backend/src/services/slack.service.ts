import { WebClient } from '@slack/web-api';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Send a rate-limit notification to the user's connected Slack workspace.
 * If Slack is not connected, this is a no-op (no crash).
 */
export async function notifyRateLimitHit(
  userId: string,
  senderId: string,
  senderEmail: string,
  current: number,
  limit: number,
  resetAt: Date
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { slackToken: true, slackChannel: true, slackWebhook: true, name: true },
    });

    if (!user?.slackToken) {
      logger.debug(`Slack not connected for user ${userId}, skipping notification`);
      return;
    }

    const slackClient = new WebClient(user.slackToken);

    const channel = user.slackChannel || '#general';

    await slackClient.chat.postMessage({
      channel,
      text: `⚠️ *Rate Limit Hit* — Sender \`${senderEmail}\``,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚠️ Email Rate Limit Reached',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Sender:*\n${senderEmail}`,
            },
            {
              type: 'mrkdwn',
              text: `*Emails Sent:*\n${current}/${limit} per hour`,
            },
          ],
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Reset At:*\n${resetAt.toISOString()}`,
            },
            {
              type: 'mrkdwn',
              text: `*Action:*\nEmails have been delayed to the next hour window. No emails were dropped.`,
            },
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `ReachInbox Scheduler • ${new Date().toISOString()}`,
            },
          ],
        },
      ],
    });

    logger.info(`Slack notification sent for rate limit on sender ${senderEmail}`);
  } catch (error) {
    // Don't crash the worker if Slack notification fails
    logger.error('Failed to send Slack notification:', error);
  }
}

/**
 * Exchange the Slack OAuth code for a token and store it.
 */
export async function handleSlackOAuthCallback(
  userId: string,
  code: string
): Promise<{ teamName: string }> {
  const slackClient = new WebClient();

  const result = await slackClient.oauth.v2.access({
    client_id: env.slack.clientId,
    client_secret: env.slack.clientSecret,
    code,
    redirect_uri: env.slack.redirectUri,
  });

  if (!result.ok || !result.access_token) {
    throw new Error(`Slack OAuth failed: ${result.error}`);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      slackToken: result.access_token,
      slackTeamName: (result.team as { name?: string })?.name || 'Unknown',
      slackChannel: (result.incoming_webhook as { channel_id?: string })?.channel_id || undefined,
      slackWebhook: (result.incoming_webhook as { url?: string })?.url || undefined,
    },
  });

  const teamName = (result.team as { name?: string })?.name || 'Connected';
  logger.info(`Slack connected for user ${userId}: team "${teamName}"`);
  return { teamName };
}

/**
 * Disconnect Slack for a user.
 */
export async function disconnectSlack(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      slackToken: null,
      slackWebhook: null,
      slackChannel: null,
      slackTeamName: null,
    },
  });
  logger.info(`Slack disconnected for user ${userId}`);
}

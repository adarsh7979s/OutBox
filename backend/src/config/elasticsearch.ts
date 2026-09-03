import { Client } from '@elastic/elasticsearch';
import { env } from './env';
import { logger } from '../utils/logger';

export const esClient = new Client({
  node: env.elasticsearchUrl,
});

export const EMAIL_INDEX = 'emails';

export async function initElasticsearch(): Promise<void> {
  try {
    const exists = await esClient.indices.exists({ index: EMAIL_INDEX });
    if (!exists) {
      await esClient.indices.create({
        index: EMAIL_INDEX,
        body: {
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              senderId: { type: 'keyword' },
              senderEmail: { type: 'keyword' },
              recipientEmail: { type: 'keyword' },
              subject: { type: 'text', analyzer: 'standard' },
              body: { type: 'text', analyzer: 'standard' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              batchId: { type: 'keyword' },
              createdAt: { type: 'date' },
            },
          },
        },
      });
      logger.info('✅ Elasticsearch index "emails" created');
    } else {
      logger.info('✅ Elasticsearch index "emails" already exists');
    }
  } catch (error) {
    logger.error('❌ Elasticsearch initialization failed:', error);
    // Don't crash — ES is important but app can start without it
  }
}

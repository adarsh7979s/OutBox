import { esClient, EMAIL_INDEX } from '../config/elasticsearch';
import { logger } from '../utils/logger';

export interface EmailDocument {
  id: string;
  userId: string;
  senderId: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  sentAt?: string | null;
  batchId?: string | null;
  createdAt: string;
}

/**
 * Index an email document in Elasticsearch.
 */
export async function indexEmail(doc: EmailDocument): Promise<void> {
  try {
    await esClient.index({
      index: EMAIL_INDEX,
      id: doc.id,
      document: doc,
    });
    logger.debug(`Indexed email ${doc.id} in Elasticsearch`);
  } catch (error) {
    logger.error(`Failed to index email ${doc.id}:`, error);
    // Don't throw — ES failures shouldn't block email scheduling
  }
}

/**
 * Update an email document in Elasticsearch.
 */
export async function updateEmailDoc(
  id: string,
  updates: Partial<EmailDocument>
): Promise<void> {
  try {
    await esClient.update({
      index: EMAIL_INDEX,
      id,
      doc: updates,
    });
    logger.debug(`Updated email ${id} in Elasticsearch`);
  } catch (error) {
    logger.error(`Failed to update email ${id} in ES:`, error);
  }
}

/**
 * Search emails by query string (searches subject and body).
 */
export async function searchEmails(
  userId: string,
  query: string,
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<{ results: EmailDocument[]; total: number }> {
  try {
    const must: any[] = [
      { term: { userId } },
    ];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['subject^2', 'body', 'recipientEmail'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (status) {
      must.push({ term: { status } });
    }

    const result = await esClient.search({
      index: EMAIL_INDEX,
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: { must },
      },
      sort: [{ scheduledAt: { order: 'desc' } }],
    });

    const total = typeof result.hits.total === 'number'
      ? result.hits.total
      : result.hits.total?.value ?? 0;

    const results = result.hits.hits.map((hit) => ({
      ...(hit._source as EmailDocument),
      id: hit._id!,
    }));

    return { results, total };
  } catch (error) {
    logger.error('Elasticsearch search failed:', error);
    return { results: [], total: 0 };
  }
}

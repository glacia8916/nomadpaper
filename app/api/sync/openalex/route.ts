import { env } from 'cloudflare:workers';

import { getD1 } from '@/db';
import { syncOpenAlexToD1 } from '@/lib/openalex-sync';

type SyncRequest = {
  lookbackDays?: number;
  minimumScore?: number;
  limit?: number;
  perQuery?: number;
};

function boundedNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export async function POST(request: Request) {
  if (!env.SYNC_SECRET) {
    return Response.json(
      { error: 'SYNC_SECRET 尚未配置，OpenAlex 同步接口已保持关闭。' },
      { status: 503 },
    );
  }

  if (request.headers.get('authorization') !== `Bearer ${env.SYNC_SECRET}`) {
    return Response.json({ error: '无权执行同步。' }, { status: 401 });
  }

  let body: SyncRequest = {};
  try {
    body = (await request.json()) as SyncRequest;
  } catch {
    // Empty request bodies use the safe defaults below.
  }

  try {
    const result = await syncOpenAlexToD1(getD1(), {
      apiKey: env.OPENALEX_API_KEY,
      email: env.OPENALEX_EMAIL,
      lookbackDays: boundedNumber(body.lookbackDays, 7, 1, 90),
      minimumScore: boundedNumber(body.minimumScore, 55, 0, 100),
      limit: boundedNumber(body.limit, 10, 1, 50),
      perQuery: boundedNumber(body.perQuery, 35, 1, 100),
      deepSeekApiKey: env.DEEPSEEK_API_KEY,
      deepSeekBaseUrl: env.DEEPSEEK_BASE_URL,
      deepSeekModel: env.DEEPSEEK_MODEL,
    });

    return Response.json({
      source: 'OpenAlex',
      status: 'completed',
      ...result,
    });
  } catch (error) {
    return Response.json(
      {
        source: 'OpenAlex',
        status: 'failed',
        error: error instanceof Error ? error.message : 'OpenAlex 同步失败。',
      },
      { status: 502 },
    );
  }
}

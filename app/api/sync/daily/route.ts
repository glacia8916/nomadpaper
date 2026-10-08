import { env } from 'cloudflare:workers';

import { getD1 } from '@/db';
import { syncOpenAlexToD1 } from '@/lib/openalex-sync';
import { syncSemanticScholarToD1 } from '@/lib/semantic-scholar-sync';

type SyncRequest = {
  lookbackDays?: number;
  minimumScore?: number;
  limitPerSource?: number;
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
      { error: 'SYNC_SECRET 尚未配置，每日同步接口已关闭。' },
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
    // Empty request bodies use defaults.
  }
  const lookbackDays = boundedNumber(body.lookbackDays, 7, 1, 90);
  const minimumScore = boundedNumber(body.minimumScore, 55, 0, 100);
  const limit = boundedNumber(body.limitPerSource, 10, 1, 50);
  const perQuery = boundedNumber(body.perQuery, 35, 1, 100);
  const database = getD1();
  const analysisOptions = {
    deepSeekApiKey: env.DEEPSEEK_API_KEY,
    deepSeekBaseUrl: env.DEEPSEEK_BASE_URL,
    deepSeekModel: env.DEEPSEEK_MODEL,
  };

  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  try {
    results.openAlex = await syncOpenAlexToD1(database, {
      apiKey: env.OPENALEX_API_KEY,
      email: env.OPENALEX_EMAIL,
      lookbackDays,
      minimumScore,
      limit,
      perQuery,
      ...analysisOptions,
    });
  } catch (error) {
    errors.openAlex =
      error instanceof Error ? error.message : 'OpenAlex 同步失败。';
  }

  try {
    results.semanticScholar = await syncSemanticScholarToD1(database, {
      apiKey: env.SEMANTIC_SCHOLAR_API_KEY,
      lookbackDays,
      minimumScore,
      limit,
      perQuery,
      ...analysisOptions,
    });
  } catch (error) {
    errors.semanticScholar =
      error instanceof Error ? error.message : 'Semantic Scholar 同步失败。';
  }

  const hasErrors = Object.keys(errors).length > 0;
  return Response.json(
    {
      frequency: 'daily',
      status: hasErrors ? 'partial' : 'completed',
      results,
      errors,
    },
    { status: Object.keys(results).length === 0 ? 502 : 200 },
  );
}

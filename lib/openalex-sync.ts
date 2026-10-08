import { fetchOpenAlexPapers } from '@/lib/openalex';
import { analyzePendingPapers } from '@/lib/analyze-papers';
import { applyKnownJournalMetrics } from '@/lib/journal-metrics';

export type OpenAlexSyncOptions = {
  apiKey?: string;
  email?: string;
  lookbackDays?: number;
  minimumScore?: number;
  limit?: number;
  perQuery?: number;
  deepSeekApiKey?: string;
  deepSeekBaseUrl?: string;
  deepSeekModel?: string;
};

export type OpenAlexSyncResult = {
  runId: string;
  recommendationDate: string;
  fromDate: string;
  fetchedCount: number;
  uniqueCount: number;
  selectedCount: number;
  estimatedCostUsd: number;
  crossSourceDuplicates: number;
  analyzedCount: number;
};

function shanghaiDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function subtractDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

export async function syncOpenAlexToD1(
  database: D1Database,
  options: OpenAlexSyncOptions = {},
): Promise<OpenAlexSyncResult> {
  const runId = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const recommendationDate = shanghaiDate();
  const lookbackDays = Math.min(90, Math.max(1, options.lookbackDays ?? 7));
  const fromDate = subtractDays(recommendationDate, lookbackDays);
  const minimumScore = Math.min(100, Math.max(0, options.minimumScore ?? 55));
  const limit = Math.min(50, Math.max(1, options.limit ?? 10));

  await database
    .prepare(
      `INSERT INTO sync_runs (
        id, status, started_at, fetched_count, deduplicated_count,
        saved_count, analyzed_count
      ) VALUES (?, 'running', ?, 0, 0, 0, 0)`,
    )
    .bind(runId, startedAt)
    .run();

  try {
    const fetched = await fetchOpenAlexPapers({
      apiKey: options.apiKey,
      email: options.email,
      fromDate,
      toDate: recommendationDate,
      minimumScore,
      limit,
      perQuery: options.perQuery,
    });
    const now = new Date().toISOString();

    const settingsStatement = database
      .prepare(
        `INSERT INTO sync_settings (
          id, interval_days, run_hour, minimum_score, daily_limit,
          positive_keywords_json, negative_keywords_json, topics_json,
          enabled_sources_json, updated_at
        ) VALUES ('default', 1, 8, ?, ?, '[]', '[]', ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          interval_days = 1,
          enabled_sources_json = excluded.enabled_sources_json,
          updated_at = excluded.updated_at`,
      )
      .bind(
        minimumScore,
        limit,
        JSON.stringify([
          '国际关系',
          '地缘政治',
          '全球治理',
          '区域国别',
          '国际政治经济',
          '外交与安全',
          '域外知识体系',
        ]),
        JSON.stringify(['OpenAlex', 'Semantic Scholar']),
        now,
      );
    await database.batch([settingsStatement]);
    const selectedIds: string[] = [];
    let crossSourceDuplicates = 0;

    for (const paper of fetched.papers) {
      const existing = await database
        .prepare(
          `SELECT id, content_hash, analysis_status FROM papers
          WHERE fingerprint = ? OR (? IS NOT NULL AND doi = ?)
          LIMIT 1`,
        )
        .bind(paper.fingerprint, paper.doi, paper.doi)
        .first<{
          id: string;
          content_hash: string | null;
          analysis_status: string;
        }>();
      const paperId = existing?.id ?? paper.id;

      if (existing) {
        if (existing.id !== paper.id) crossSourceDuplicates += 1;
        await database
          .prepare(
            `UPDATE papers SET
              cited_by_count = MAX(cited_by_count, ?),
              official_url = COALESCE(official_url, ?),
              abstract_original = COALESCE(abstract_original, ?),
              analysis_status = CASE
                WHEN content_hash = ? THEN analysis_status ELSE 'pending'
              END,
              content_hash = ?, updated_at = ?
            WHERE id = ?`,
          )
          .bind(
            paper.citedByCount,
            paper.officialUrl,
            paper.abstractOriginal,
            paper.contentHash,
            paper.contentHash,
            now,
            paperId,
          )
          .run();
      } else {
        await database
          .prepare(
            `INSERT INTO papers (
              id, fingerprint, doi, source, source_id, title, authors_json,
              journal, publication_date, official_url, abstract_original,
              paper_type, topic, keyword_score, score_reasons_json,
              journal_indexes_json, cited_by_count, analysis_status,
              content_hash, reading_minutes, first_seen_at, created_at, updated_at
            ) VALUES (
              ?, ?, ?, 'OpenAlex', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]',
              ?, 'pending', ?, ?, ?, ?, ?
            )`,
          )
          .bind(
            paper.id,
            paper.fingerprint,
            paper.doi,
            paper.sourceId,
            paper.title,
            JSON.stringify(paper.authors),
            paper.journal,
            paper.publicationDate,
            paper.officialUrl,
            paper.abstractOriginal,
            paper.paperType,
            paper.topic,
            paper.keywordScore,
            JSON.stringify(paper.scoreReasons),
            paper.citedByCount,
            paper.contentHash,
            paper.readingMinutes,
            now,
            now,
            now,
          )
          .run();
      }

      await applyKnownJournalMetrics(database, paperId, paper.journal);

      selectedIds.push(paperId);
      await database
        .prepare(
          `INSERT INTO recommendations (
            id, paper_id, recommendation_date, score, reasons_json, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(recommendation_date, paper_id) DO UPDATE SET
            score = MAX(recommendations.score, excluded.score),
            reasons_json = CASE
              WHEN excluded.score >= recommendations.score
                THEN excluded.reasons_json
              ELSE recommendations.reasons_json
            END`,
        )
        .bind(
          `${recommendationDate}:${paperId}`,
          paperId,
          recommendationDate,
          paper.keywordScore,
          JSON.stringify(paper.scoreReasons),
          now,
        )
        .run();
    }

    const analysis = await analyzePendingPapers(database, selectedIds, {
      apiKey: options.deepSeekApiKey,
      baseUrl: options.deepSeekBaseUrl,
      model: options.deepSeekModel,
    });

    await database
      .prepare(
        `UPDATE sync_runs SET
          status = ?,
          finished_at = ?,
          fetched_count = ?,
          deduplicated_count = ?,
          saved_count = ?,
          analyzed_count = ?, error_message = ?
        WHERE id = ?`,
      )
      .bind(
        analysis.failedCount > 0 ? 'partial' : 'completed',
        new Date().toISOString(),
        fetched.fetchedCount,
        fetched.fetchedCount - fetched.uniqueCount + crossSourceDuplicates,
        fetched.papers.length,
        analysis.analyzedCount,
        analysis.errors.join('\n').slice(0, 4000) || null,
        runId,
      )
      .run();

    return {
      runId,
      recommendationDate,
      fromDate,
      fetchedCount: fetched.fetchedCount,
      uniqueCount: fetched.uniqueCount,
      selectedCount: fetched.papers.length,
      estimatedCostUsd: fetched.estimatedCostUsd,
      crossSourceDuplicates,
      analyzedCount: analysis.analyzedCount,
    };
  } catch (error) {
    await database
      .prepare(
        `UPDATE sync_runs SET status = 'failed', finished_at = ?, error_message = ?
        WHERE id = ?`,
      )
      .bind(
        new Date().toISOString(),
        error instanceof Error ? error.message.slice(0, 1000) : String(error),
        runId,
      )
      .run();
    throw error;
  }
}

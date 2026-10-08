import { analyzePaperWithDeepSeek } from '@/lib/deepseek-analysis';

type AnalysisRow = {
  id: string;
  title: string;
  authors_json: string;
  journal: string | null;
  publication_date: string | null;
  abstract_original: string | null;
  analysis_status: string;
};

function parseAuthors(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function analyzePendingPapers(
  database: D1Database,
  paperIds: string[],
  options: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  },
) {
  if (!options.apiKey) {
    return {
      analyzedCount: 0,
      failedCount: paperIds.length,
      errors: ['DEEPSEEK_API_KEY 未配置。'],
    };
  }
  let analyzedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const id of new Set(paperIds)) {
    const row = await database
      .prepare(
        `SELECT id, title, authors_json, journal, publication_date,
          abstract_original, analysis_status
        FROM papers WHERE id = ? LIMIT 1`,
      )
      .bind(id)
      .first<AnalysisRow>();

    if (!row || row.analysis_status === 'completed' || !row.abstract_original) {
      continue;
    }

    await database
      .prepare(`UPDATE papers SET analysis_status = 'analyzing' WHERE id = ?`)
      .bind(id)
      .run();

    try {
      const analysis = await analyzePaperWithDeepSeek(
        {
          title: row.title,
          authors: parseAuthors(row.authors_json),
          journal: row.journal,
          publicationDate: row.publication_date,
          abstractOriginal: row.abstract_original,
        },
        {
          apiKey: options.apiKey,
          baseUrl: options.baseUrl,
          model: options.model,
        },
      );
      const now = new Date().toISOString();
      await database
        .prepare(
          `UPDATE papers SET
            title_zh = ?, abstract_zh = ?, research_method = ?,
            data_sources = ?, core_conclusion = ?,
            extensible_questions_json = ?, innovations = ?, limitations = ?,
            future_directions = ?, analysis_status = 'completed',
            analysis_error = NULL, updated_at = ?
          WHERE id = ?`,
        )
        .bind(
          analysis.titleZh,
          analysis.abstractZh,
          analysis.researchMethod,
          analysis.dataSources,
          analysis.coreConclusion,
          JSON.stringify(analysis.extensibleQuestions),
          analysis.innovations,
          analysis.limitations,
          analysis.futureDirections,
          now,
          id,
        )
        .run();
      analyzedCount += 1;
    } catch (error) {
      const message =
        error instanceof Error ? error.message.slice(0, 1000) : String(error);
      await database
        .prepare(
          `UPDATE papers SET analysis_status = 'failed', analysis_error = ?
          WHERE id = ?`,
        )
        .bind(message, id)
        .run();
      failedCount += 1;
      errors.push(`${id}: ${message}`);
    }
  }

  return { analyzedCount, failedCount, errors };
}

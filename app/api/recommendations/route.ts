import { getD1 } from '@/db';
import type { Paper } from '@/lib/literature-data';

type RecommendationRow = {
  id: string;
  doi: string | null;
  source: string;
  title: string;
  title_zh: string | null;
  authors_json: string;
  journal: string | null;
  impact_factor: number | null;
  impact_factor_year: number | null;
  impact_metric_source: string | null;
  impact_metric_source_url: string | null;
  impact_metric_checked_at: string | null;
  journal_quartile: string | null;
  journal_quartile_year: number | null;
  journal_quartile_source: string | null;
  journal_quartile_source_url: string | null;
  journal_quartile_checked_at: string | null;
  publication_date: string | null;
  official_url: string | null;
  abstract_original: string | null;
  abstract_zh: string | null;
  paper_type: string;
  topic: string | null;
  recommendation_score: number;
  recommendation_reasons_json: string;
  journal_indexes_json: string;
  research_method: string | null;
  data_sources: string | null;
  core_conclusion: string | null;
  extensible_questions_json: string;
  reading_minutes: number;
  recommendation_date: string;
};

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function normalizePaperType(value: string): Paper['kind'] {
  if (value === 'review' || value === '综述') return '综述';
  if (value === 'theory' || value === '理论论文') return '理论论文';
  return '研究论文';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedDate = url.searchParams.get('date');
  const date = requestedDate?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? requestedDate
    : null;
  const minimumScore = Math.min(
    100,
    Math.max(0, Number(url.searchParams.get('minimumScore') ?? 0) || 0),
  );
  const topicValue = url.searchParams.get('topic')?.trim();
  const topic = topicValue && topicValue !== '全部主题' ? topicValue : null;
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20),
  );

  try {
    const result = await getD1()
      .prepare(
        `SELECT
          p.id,
          p.doi,
          p.source,
          p.title,
          p.title_zh,
          p.authors_json,
          p.journal,
          p.impact_factor,
          p.impact_factor_year,
          p.impact_metric_source,
          p.impact_metric_source_url,
          p.impact_metric_checked_at,
          p.journal_quartile,
          p.journal_quartile_year,
          p.journal_quartile_source,
          p.journal_quartile_source_url,
          p.journal_quartile_checked_at,
          p.publication_date,
          p.official_url,
          p.abstract_original,
          p.abstract_zh,
          p.paper_type,
          p.topic,
          p.journal_indexes_json,
          p.research_method,
          p.data_sources,
          p.core_conclusion,
          p.extensible_questions_json,
          p.reading_minutes,
          r.recommendation_date,
          r.score AS recommendation_score,
          r.reasons_json AS recommendation_reasons_json
        FROM recommendations r
        INNER JOIN papers p ON p.id = r.paper_id
        WHERE r.recommendation_date = COALESCE(
          ?,
          (SELECT MAX(recommendation_date) FROM recommendations)
        )
          AND r.score >= ?
          AND (? IS NULL OR p.topic = ?)
        ORDER BY r.score DESC, p.publication_date DESC
        LIMIT ?`,
      )
      .bind(date, minimumScore, topic, topic, limit)
      .all<RecommendationRow>();

    const papers: Paper[] = result.results.map((row) => ({
      id: row.id,
      title: row.title,
      titleZh: row.title_zh ?? row.title,
      authors: parseStringArray(row.authors_json),
      journal: row.journal ?? '期刊待确认',
      impactFactor: row.impact_factor ?? undefined,
      impactFactorYear: row.impact_factor_year ?? undefined,
      impactMetricSource: row.impact_metric_source ?? undefined,
      impactMetricSourceUrl: row.impact_metric_source_url ?? undefined,
      impactMetricCheckedAt: row.impact_metric_checked_at ?? undefined,
      journalQuartile: row.journal_quartile ?? undefined,
      journalQuartileYear: row.journal_quartile_year ?? undefined,
      journalQuartileSource: row.journal_quartile_source ?? undefined,
      journalQuartileSourceUrl: row.journal_quartile_source_url ?? undefined,
      journalQuartileCheckedAt: row.journal_quartile_checked_at ?? undefined,
      date: row.publication_date ?? '日期待确认',
      score: row.recommendation_score,
      source: row.source,
      indexes: parseStringArray(row.journal_indexes_json),
      kind: normalizePaperType(row.paper_type),
      topic: row.topic ?? '未分类',
      abstractOriginal: row.abstract_original ?? '原始摘要暂未获取。',
      abstractZh: row.abstract_zh ?? '中文摘要暂未生成。',
      researchMethod: row.research_method ?? '研究方法暂未完成分析。',
      dataSources: row.data_sources ?? '数据来源暂未完成分析。',
      coreConclusion: row.core_conclusion ?? '核心结论暂未完成分析。',
      extensibleQuestions: parseStringArray(row.extensible_questions_json),
      doi: row.doi ?? undefined,
      officialUrl: row.official_url ?? undefined,
      readingMinutes: row.reading_minutes,
      recommendationReasons: parseStringArray(row.recommendation_reasons_json),
      indicators: [],
      isNew: true,
    }));

    return Response.json({
      source: 'd1',
      recommendationDate: result.results[0]?.recommendation_date ?? null,
      papers,
    });
  } catch {
    return Response.json(
      {
        source: 'demo',
        code: 'D1_UNAVAILABLE',
        error: 'Cloudflare D1 尚未绑定或迁移尚未执行。',
      },
      { status: 503 },
    );
  }
}

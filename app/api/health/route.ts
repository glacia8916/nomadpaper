import { env } from 'cloudflare:workers';

function shanghaiDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

export async function GET() {
  const today = shanghaiDate();
  const recommendations = await env.DB.prepare(
    `SELECT MAX(recommendation_date) AS latest_date,
      SUM(CASE WHEN recommendation_date = ? THEN 1 ELSE 0 END) AS today_count
    FROM recommendations`,
  )
    .bind(today)
    .first<{ latest_date: string | null; today_count: number }>();
  const runs = await env.DB.prepare(
    `SELECT
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('partial', 'failed') THEN 1 ELSE 0 END) AS failed
    FROM sync_runs WHERE started_at >= datetime('now', '-36 hours')`,
  ).first<{ completed: number; failed: number }>();
  const analysisFailures = await env.DB.prepare(
    `SELECT COUNT(*) AS count FROM papers p
    JOIN recommendations r ON r.paper_id = p.id
    WHERE r.recommendation_date = ? AND p.analysis_status = 'failed'`,
  )
    .bind(today)
    .first<{ count: number }>();
  const backup = await env.BACKUP_DB.prepare(
    `SELECT status, finished_at, row_count FROM backup_runs
    ORDER BY started_at DESC LIMIT 1`,
  ).first<{
    status: string;
    finished_at: string | null;
    row_count: number;
  }>();

  const healthy =
    recommendations?.latest_date === today &&
    Number(recommendations?.today_count ?? 0) > 0 &&
    Number(runs?.failed ?? 0) === 0 &&
    Number(analysisFailures?.count ?? 0) === 0;

  return Response.json(
    {
      status: healthy ? 'healthy' : 'attention',
      today,
      latestRecommendationDate: recommendations?.latest_date ?? null,
      recommendationCount: Number(recommendations?.today_count ?? 0),
      recentCompletedRuns: Number(runs?.completed ?? 0),
      recentFailedOrPartialRuns: Number(runs?.failed ?? 0),
      analysisFailures: Number(analysisFailures?.count ?? 0),
      latestBackup: backup ?? null,
    },
    { status: healthy ? 200 : 503 },
  );
}

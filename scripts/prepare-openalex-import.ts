import { writeFile } from 'node:fs/promises';

import { fetchOpenAlexPapers } from '../lib/openalex.ts';

function argument(name: string, fallback?: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function numberArgument(name: string, fallback: number) {
  const value = Number(argument(name, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function sqlValue(value: string | number | null) {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replaceAll("'", "''")}'`;
}

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

function subtractDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

const output = argument('--output');
if (!output) {
  throw new Error('Missing required --output path.');
}

const toDate = argument('--to-date', shanghaiDate())!;
const fromDate = argument(
  '--from-date',
  subtractDays(toDate, numberArgument('--lookback-days', 30)),
)!;
const minimumScore = numberArgument('--minimum-score', 55);
const limit = numberArgument('--limit', 10);
const perQuery = numberArgument('--per-query', 35);

const result = await fetchOpenAlexPapers({
  apiKey: process.env.OPENALEX_API_KEY,
  email: process.env.OPENALEX_EMAIL,
  fromDate,
  toDate,
  minimumScore,
  limit,
  perQuery,
});

if (result.papers.length === 0) {
  throw new Error('OpenAlex returned no papers above the configured score.');
}

const now = new Date().toISOString();
const runId = crypto.randomUUID();
const statements = [
  `INSERT INTO sync_settings (
    id, interval_days, run_hour, minimum_score, daily_limit,
    positive_keywords_json, negative_keywords_json, topics_json,
    enabled_sources_json, updated_at
  ) VALUES (
    'default', 1, 8, ${sqlValue(minimumScore)}, ${sqlValue(limit)}, '[]', '[]',
    '["国际关系","地缘政治","全球治理","区域国别","国际政治经济","外交与安全","域外知识体系"]',
    '["OpenAlex"]', ${sqlValue(now)}
  ) ON CONFLICT(id) DO NOTHING;`,
];

for (const paper of result.papers) {
  statements.push(`INSERT INTO papers (
    id, fingerprint, doi, source, source_id, title, authors_json,
    journal, publication_date, official_url, abstract_original,
    paper_type, topic, keyword_score, score_reasons_json,
    journal_indexes_json, cited_by_count, analysis_status,
    content_hash, reading_minutes, first_seen_at, created_at, updated_at
  ) VALUES (
    ${sqlValue(paper.id)}, ${sqlValue(paper.fingerprint)}, ${sqlValue(paper.doi)},
    'OpenAlex', ${sqlValue(paper.sourceId)}, ${sqlValue(paper.title)},
    ${sqlValue(JSON.stringify(paper.authors))}, ${sqlValue(paper.journal)},
    ${sqlValue(paper.publicationDate)}, ${sqlValue(paper.officialUrl)},
    ${sqlValue(paper.abstractOriginal)}, ${sqlValue(paper.paperType)},
    ${sqlValue(paper.topic)}, ${sqlValue(paper.keywordScore)},
    ${sqlValue(JSON.stringify(paper.scoreReasons))}, '[]',
    ${sqlValue(paper.citedByCount)}, 'pending', ${sqlValue(paper.contentHash)},
    ${sqlValue(paper.readingMinutes)}, ${sqlValue(now)}, ${sqlValue(now)},
    ${sqlValue(now)}
  ) ON CONFLICT(id) DO UPDATE SET
    doi = excluded.doi,
    title = excluded.title,
    authors_json = excluded.authors_json,
    journal = excluded.journal,
    publication_date = excluded.publication_date,
    official_url = excluded.official_url,
    abstract_original = excluded.abstract_original,
    paper_type = excluded.paper_type,
    topic = excluded.topic,
    keyword_score = excluded.keyword_score,
    score_reasons_json = excluded.score_reasons_json,
    cited_by_count = excluded.cited_by_count,
    content_hash = excluded.content_hash,
    reading_minutes = excluded.reading_minutes,
    updated_at = excluded.updated_at;`);

  statements.push(`INSERT INTO recommendations (
    id, paper_id, recommendation_date, score, reasons_json, created_at
  ) VALUES (
    ${sqlValue(`${toDate}:${paper.id}`)}, ${sqlValue(paper.id)},
    ${sqlValue(toDate)}, ${sqlValue(paper.keywordScore)},
    ${sqlValue(JSON.stringify(paper.scoreReasons))}, ${sqlValue(now)}
  ) ON CONFLICT(recommendation_date, paper_id) DO UPDATE SET
    score = excluded.score,
    reasons_json = excluded.reasons_json;`);
}

statements.push(`INSERT INTO sync_runs (
  id, status, started_at, finished_at, fetched_count, deduplicated_count,
  saved_count, analyzed_count
) VALUES (
  ${sqlValue(runId)}, 'completed', ${sqlValue(now)}, ${sqlValue(now)},
  ${sqlValue(result.fetchedCount)},
  ${sqlValue(result.fetchedCount - result.uniqueCount)},
  ${sqlValue(result.papers.length)}, 0
);`);

await writeFile(output, `${statements.join('\n\n')}\n`, { encoding: 'utf8' });

console.log(
  JSON.stringify(
    {
      output,
      runId,
      recommendationDate: toDate,
      fromDate,
      fetchedCount: result.fetchedCount,
      uniqueCount: result.uniqueCount,
      selectedCount: result.papers.length,
      estimatedCostUsd: result.estimatedCostUsd,
      papers: result.papers.map((paper) => ({
        title: paper.title,
        score: paper.keywordScore,
        topic: paper.topic,
        publicationDate: paper.publicationDate,
      })),
    },
    null,
    2,
  ),
);

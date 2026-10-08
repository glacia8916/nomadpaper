import { readFile, writeFile } from 'node:fs/promises';

import { analyzePaperWithDeepSeek } from '../lib/deepseek-analysis.ts';

type PaperRow = {
  id: string;
  title: string;
  authors_json: string;
  journal: string | null;
  publication_date: string | null;
  abstract_original: string;
};

type WranglerResult = Array<{ results?: PaperRow[] }>;

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function sqlValue(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

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

const input = argument('--input');
const output = argument('--output');
if (!input || !output) {
  throw new Error('Usage: --input <wrangler-json> --output <updates.sql>');
}
if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is not configured.');
}

const payload = JSON.parse(await readFile(input, 'utf8')) as WranglerResult;
const papers = payload.flatMap((result) => result.results ?? []);
const statements: string[] = [];
const failures: Array<{ id: string; error: string }> = [];

for (const [index, paper] of papers.entries()) {
  try {
    const analysis = await analyzePaperWithDeepSeek(
      {
        title: paper.title,
        authors: parseAuthors(paper.authors_json),
        journal: paper.journal,
        publicationDate: paper.publication_date,
        abstractOriginal: paper.abstract_original,
      },
      {
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL,
        model: process.env.DEEPSEEK_MODEL,
      },
    );
    const now = new Date().toISOString();
    statements.push(`UPDATE papers SET
  title_zh = ${sqlValue(analysis.titleZh)},
  abstract_zh = ${sqlValue(analysis.abstractZh)},
  research_method = ${sqlValue(analysis.researchMethod)},
  data_sources = ${sqlValue(analysis.dataSources)},
  core_conclusion = ${sqlValue(analysis.coreConclusion)},
  extensible_questions_json = ${sqlValue(JSON.stringify(analysis.extensibleQuestions))},
  innovations = ${sqlValue(analysis.innovations)},
  limitations = ${sqlValue(analysis.limitations)},
  future_directions = ${sqlValue(analysis.futureDirections)},
  analysis_status = 'completed',
  updated_at = ${sqlValue(now)}
WHERE id = ${sqlValue(paper.id)};`);
    await writeFile(output, `${statements.join('\n\n')}\n`, 'utf8');
    console.log(`[${index + 1}/${papers.length}] completed: ${paper.title}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ id: paper.id, error: message });
    console.error(`[${index + 1}/${papers.length}] failed: ${paper.title}`);
  }
}

console.log(
  JSON.stringify({
    selected: papers.length,
    completed: statements.length,
    failed: failures.length,
    failedIds: failures.map((failure) => failure.id),
    output,
  }),
);

if (statements.length === 0) process.exitCode = 1;

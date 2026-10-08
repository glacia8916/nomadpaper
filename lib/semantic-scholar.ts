const SEMANTIC_SCHOLAR_API_URL =
  'https://api.semanticscholar.org/graph/v1/paper/search';

export const DEFAULT_SEMANTIC_SCHOLAR_QUERIES = [
  'international relations',
  'geopolitics',
  'global governance',
  'area studies',
  'international political economy',
  'foreign policy',
] as const;

type SemanticScholarAuthor = { name?: string | null };

type SemanticScholarWork = {
  paperId?: string | null;
  externalIds?: { DOI?: string | null } | null;
  title?: string | null;
  abstract?: string | null;
  venue?: string | null;
  publicationDate?: string | null;
  year?: number | null;
  authors?: SemanticScholarAuthor[] | null;
  url?: string | null;
  citationCount?: number | null;
  publicationTypes?: string[] | null;
};

type SemanticScholarResponse = { data?: SemanticScholarWork[] };

export type SemanticScholarPaper = {
  id: string;
  fingerprint: string;
  doi: string | null;
  sourceId: string;
  title: string;
  authors: string[];
  journal: string | null;
  publicationDate: string | null;
  officialUrl: string;
  abstractOriginal: string;
  paperType: 'research' | 'review' | 'theory';
  topic: string;
  keywordScore: number;
  scoreReasons: string[];
  citedByCount: number;
  contentHash: string;
  readingMinutes: number;
};

export type FetchSemanticScholarOptions = {
  apiKey?: string;
  fromDate: string;
  toDate: string;
  minimumScore?: number;
  limit?: number;
  perQuery?: number;
  queries?: readonly string[];
};

type TopicRule = { topic: string; phrases: readonly string[] };

const TOPIC_RULES: readonly TopicRule[] = [
  {
    topic: '国际关系',
    phrases: [
      'international relations',
      'international order',
      'world order',
      'international system',
      'great power',
      'alliance',
    ],
  },
  {
    topic: '地缘政治',
    phrases: [
      'geopolitic',
      'geoeconomic',
      'strategic competition',
      'indo pacific',
      'eurasia',
      'economic security',
    ],
  },
  {
    topic: '全球治理',
    phrases: [
      'global governance',
      'international institution',
      'multilateral',
      'united nations',
      'climate governance',
    ],
  },
  {
    topic: '区域国别',
    phrases: [
      'area studies',
      'regional order',
      'regional security',
      'regionalism',
      'southeast asia',
      'east asia',
      'middle east',
      'africa',
      'latin america',
    ],
  },
  {
    topic: '国际政治经济',
    phrases: [
      'international political economy',
      'economic statecraft',
      'sanction',
      'trade war',
      'supply chain',
      'development finance',
    ],
  },
  {
    topic: '外交与安全',
    phrases: [
      'foreign policy',
      'international security',
      'strategic autonomy',
      'deterrence',
      'diplomacy',
      'peacebuilding',
    ],
  },
  {
    topic: '域外知识体系',
    phrases: [
      'global international relations',
      'non western international relations',
      'knowledge production',
      'decolonial',
      'postcolonial',
      'academic dependency',
    ],
  },
];

const NEGATIVE_PHRASES = [
  'clinical trial',
  'patient',
  'cancer',
  'protein',
  'gene expression',
  'neural network',
  'deep learning',
  'medical imaging',
  'bibliometric analysis',
  'soil microbial',
] as const;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s–—_-]+/g, ' ')
    .trim();
}

function normalizeDoi(value?: string | null) {
  const normalized = value
    ?.trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
  return normalized || null;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function scoreWork(work: SemanticScholarWork, toDate: string) {
  const title = normalizeText(work.title ?? '');
  const abstract = normalizeText(work.abstract ?? '');
  const all = `${title} ${abstract} ${normalizeText(work.venue ?? '')}`;
  const ranked = TOPIC_RULES.map((rule) => {
    const titleMatches = rule.phrases.filter((phrase) =>
      title.includes(normalizeText(phrase)),
    );
    const abstractMatches = rule.phrases.filter((phrase) =>
      abstract.includes(normalizeText(phrase)),
    );
    return {
      topic: rule.topic,
      matches: [...new Set([...titleMatches, ...abstractMatches])],
      points:
        Math.min(36, titleMatches.length * 18) +
        Math.min(28, abstractMatches.length * 7),
    };
  }).sort((left, right) => right.points - left.points);
  const best = ranked[0];
  let score = 18 + best.points + (work.abstract ? 7 : 0);
  const reasons: string[] = [];

  if (best.matches.length > 0) {
    reasons.push(
      `匹配“${best.topic}”关键词：${best.matches.slice(0, 3).join('、')}`,
    );
  }
  const publicationDate = work.publicationDate
    ? new Date(`${work.publicationDate}T00:00:00Z`)
    : null;
  const ageDays = publicationDate
    ? Math.max(
        0,
        Math.floor(
          (new Date(`${toDate}T00:00:00Z`).getTime() -
            publicationDate.getTime()) /
            86_400_000,
        ),
      )
    : 99;
  if (ageDays <= 3) {
    score += 10;
    reasons.push('近 3 天发表');
  } else if (ageDays <= 7) {
    score += 7;
    reasons.push('近 7 天发表');
  } else if (ageDays <= 30) {
    score += 4;
    reasons.push('近 30 天发表');
  }
  score += Math.min(
    6,
    Math.round(Math.log2(Math.max(0, work.citationCount ?? 0) + 1)),
  );
  const negativeCount = NEGATIVE_PHRASES.filter((phrase) =>
    all.includes(normalizeText(phrase)),
  ).length;
  score -= Math.min(45, negativeCount * 18);

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    topic: best.points > 0 ? best.topic : '国际关系',
    reasons,
  };
}

function mapWork(work: SemanticScholarWork, toDate: string) {
  const sourceId = work.paperId?.trim();
  const title = work.title?.trim();
  const abstractOriginal = work.abstract?.trim();
  if (!sourceId || !title || !abstractOriginal) return null;
  const doi = normalizeDoi(work.externalIds?.DOI);
  const scored = scoreWork(work, toDate);
  const publicationTypes = (work.publicationTypes ?? []).map(normalizeText);
  const normalizedText = normalizeText(`${title} ${abstractOriginal}`);
  const paperType = publicationTypes.some((type) => type.includes('review'))
    ? ('review' as const)
    : normalizedText.includes('theoretical framework') ||
        normalizedText.includes('conceptual framework')
      ? ('theory' as const)
      : ('research' as const);

  return {
    id: `semantic-scholar:${sourceId}`,
    fingerprint: doi
      ? `doi:${doi.toLowerCase()}`
      : `semantic-scholar:${sourceId}`,
    doi,
    sourceId,
    title,
    authors: [
      ...new Set(
        (work.authors ?? [])
          .map((author) => author.name?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    ],
    journal: work.venue?.trim() || null,
    publicationDate:
      work.publicationDate ?? (work.year ? `${work.year}-01-01` : null),
    officialUrl: doi ? `https://doi.org/${doi}` : work.url || '',
    abstractOriginal,
    paperType,
    topic: scored.topic,
    keywordScore: scored.score,
    scoreReasons: scored.reasons,
    citedByCount: Math.max(0, work.citationCount ?? 0),
    contentHash: stableHash(`${title}\n${abstractOriginal}`),
    readingMinutes: paperType === 'review' ? 14 : 10,
  } satisfies SemanticScholarPaper;
}

async function requestSemanticScholar(url: URL, apiKey?: string) {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
    });
    if (response.ok) return (await response.json()) as SemanticScholarResponse;
    lastError = new Error(
      `Semantic Scholar 请求失败 (${response.status}): ${(await response.text()).slice(0, 240)}`,
    );
    if (response.status !== 429 && response.status < 500) break;
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(4000, 700 * 2 ** attempt)),
    );
  }
  throw lastError ?? new Error('Semantic Scholar 请求失败。');
}

export async function fetchSemanticScholarPapers(
  options: FetchSemanticScholarOptions,
) {
  const queries = options.queries ?? DEFAULT_SEMANTIC_SCHOLAR_QUERIES;
  const perQuery = Math.min(100, Math.max(1, options.perQuery ?? 35));
  const minimumScore = Math.min(100, Math.max(0, options.minimumScore ?? 55));
  const works = new Map<string, SemanticScholarWork>();

  for (const [index, query] of queries.entries()) {
    if (index > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1050));
    }
    const url = new URL(SEMANTIC_SCHOLAR_API_URL);
    url.searchParams.set('query', query);
    url.searchParams.set(
      'fields',
      'paperId,externalIds,title,abstract,venue,publicationDate,year,authors,url,citationCount,publicationTypes',
    );
    url.searchParams.set(
      'fieldsOfStudy',
      'Political Science,Economics,Sociology,History,Geography,Law,Philosophy',
    );
    url.searchParams.set(
      'publicationDateOrYear',
      `${options.fromDate}:${options.toDate}`,
    );
    url.searchParams.set('limit', String(perQuery));
    const payload = await requestSemanticScholar(url, options.apiKey);
    for (const work of payload.data ?? []) {
      if (work.paperId) works.set(work.paperId, work);
    }
  }

  const papers = [...works.values()]
    .map((work) => mapWork(work, options.toDate))
    .filter((paper): paper is SemanticScholarPaper => Boolean(paper))
    .filter((paper) => paper.keywordScore >= minimumScore)
    .sort(
      (left, right) =>
        right.keywordScore - left.keywordScore ||
        (right.publicationDate ?? '').localeCompare(left.publicationDate ?? ''),
    );
  const unique = new Map<string, SemanticScholarPaper>();
  for (const paper of papers) {
    const previous = unique.get(paper.fingerprint);
    if (!previous || paper.keywordScore > previous.keywordScore) {
      unique.set(paper.fingerprint, paper);
    }
  }

  return {
    papers: [...unique.values()].slice(0, options.limit ?? 10),
    fetchedCount: works.size,
    uniqueCount: unique.size,
    queryCount: queries.length,
  };
}

const OPENALEX_API_URL = 'https://api.openalex.org/works';

export const DEFAULT_OPENALEX_QUERIES = [
  'international relations',
  'geopolitics',
  'global governance',
  'area studies',
  'international political economy',
  'foreign policy',
] as const;

type OpenAlexAuthor = {
  author?: { display_name?: string | null } | null;
};

type OpenAlexSource = {
  display_name?: string | null;
  type?: string | null;
};

type OpenAlexLocation = {
  landing_page_url?: string | null;
  source?: OpenAlexSource | null;
};

type OpenAlexTopic = {
  display_name?: string | null;
  score?: number | null;
  domain?: { display_name?: string | null } | null;
  field?: { display_name?: string | null } | null;
  subfield?: { display_name?: string | null } | null;
};

type OpenAlexKeyword = {
  display_name?: string | null;
  score?: number | null;
};

export type OpenAlexWork = {
  id: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_date?: string | null;
  type?: string | null;
  cited_by_count?: number | null;
  relevance_score?: number | null;
  authorships?: OpenAlexAuthor[] | null;
  primary_location?: OpenAlexLocation | null;
  best_oa_location?: OpenAlexLocation | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  topics?: OpenAlexTopic[] | null;
  keywords?: OpenAlexKeyword[] | null;
};

type OpenAlexResponse = {
  meta?: { count?: number; cost_usd?: number | null };
  results?: OpenAlexWork[];
};

export type OpenAlexPaper = {
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

export type FetchOpenAlexOptions = {
  apiKey?: string;
  email?: string;
  fromDate: string;
  toDate: string;
  minimumScore?: number;
  limit?: number;
  perQuery?: number;
  queries?: readonly string[];
};

export type FetchOpenAlexResult = {
  papers: OpenAlexPaper[];
  fetchedCount: number;
  uniqueCount: number;
  queryCount: number;
  estimatedCostUsd: number;
};

type TopicRule = {
  topic: string;
  phrases: readonly string[];
};

const TOPIC_RULES: readonly TopicRule[] = [
  {
    topic: '国际关系',
    phrases: [
      'international relations',
      'international order',
      'world order',
      'global order',
      'international system',
      'international society',
      'great power',
      'power transition',
      'multipolar',
      'alliance',
    ],
  },
  {
    topic: '地缘政治',
    phrases: [
      'geopolitic',
      'geostrateg',
      'geoeconomic',
      'geo-economic',
      'strategic competition',
      'great power competition',
      'indo-pacific',
      'eurasia',
      'maritime security',
      'economic security',
    ],
  },
  {
    topic: '全球治理',
    phrases: [
      'global governance',
      'international institution',
      'international organization',
      'multilateral',
      'united nations',
      'global commons',
      'transnational governance',
      'regime complex',
      'climate governance',
    ],
  },
  {
    topic: '区域国别',
    phrases: [
      'area studies',
      'regional studies',
      'regional order',
      'regional security',
      'regionalism',
      'comparative regional',
      'southeast asia',
      'east asia',
      'south asia',
      'middle east',
      'africa',
      'latin america',
      'european union',
    ],
  },
  {
    topic: '国际政治经济',
    phrases: [
      'international political economy',
      'global political economy',
      'economic statecraft',
      'sanction',
      'trade war',
      'supply chain',
      'weaponized interdependence',
      'development finance',
      'foreign aid',
      'debt diplomacy',
    ],
  },
  {
    topic: '外交与安全',
    phrases: [
      'foreign policy',
      'security studies',
      'international security',
      'strategic autonomy',
      'deterrence',
      'diplomacy',
      'conflict mediation',
      'peacebuilding',
      'military strategy',
    ],
  },
  {
    topic: '域外知识体系',
    phrases: [
      'global international relations',
      'non-western international relations',
      'knowledge production',
      'epistemic',
      'decolonizing',
      'decolonial',
      'postcolonial',
      'indigenous knowledge',
      'academic dependency',
    ],
  },
];

const NEGATIVE_PHRASES = [
  'clinical trial',
  'patient',
  'cancer',
  'tumor',
  'protein',
  'gene expression',
  'genome',
  'neural network',
  'deep learning',
  'medical imaging',
  'bibliometric analysis',
  'scientometric',
  'global authorship',
  'authorship network',
  'agri food',
  'food loss',
  'waste prevention',
  'life cycle assessment',
  'crop yield',
  'soil microbial',
  'molecular',
] as const;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[\s–—_-]+/g, ' ')
    .trim();
}

function stripOpenAlexId(value: string) {
  return value.replace(/^https?:\/\/openalex\.org\//, '');
}

function normalizeDoi(value?: string | null) {
  if (!value) return null;
  const normalized = value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '');
  return normalized || null;
}

export function reconstructAbstract(
  invertedIndex?: Record<string, number[]> | null,
) {
  if (!invertedIndex) return '';

  const tokens: Array<[number, string]> = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const position of positions) tokens.push([position, word]);
  }

  return tokens
    .sort((left, right) => left[0] - right[0])
    .map(([, word]) => word)
    .join(' ');
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function includesPhrase(text: string, phrase: string) {
  return text.includes(normalizeText(phrase));
}

function classifyPaperType(work: OpenAlexWork, normalizedText: string) {
  if (
    work.type === 'review' ||
    includesPhrase(normalizedText, 'systematic review') ||
    includesPhrase(normalizedText, 'literature review') ||
    includesPhrase(normalizedText, 'scoping review')
  ) {
    return 'review' as const;
  }

  if (
    includesPhrase(normalizedText, 'theoretical framework') ||
    includesPhrase(normalizedText, 'conceptual framework') ||
    includesPhrase(normalizedText, 'theory of')
  ) {
    return 'theory' as const;
  }

  return 'research' as const;
}

function scoreWork(work: OpenAlexWork, abstract: string, toDate: string) {
  const title = work.title ?? work.display_name ?? '';
  const topicText = (work.topics ?? [])
    .flatMap((topic) => [
      topic.display_name,
      topic.domain?.display_name,
      topic.field?.display_name,
      topic.subfield?.display_name,
    ])
    .filter(Boolean)
    .join(' ');
  const keywordText = (work.keywords ?? [])
    .map((keyword) => keyword.display_name)
    .filter(Boolean)
    .join(' ');
  const journal = work.primary_location?.source?.display_name ?? '';
  const normalizedTitle = normalizeText(title);
  const normalizedAbstract = normalizeText(abstract);
  const normalizedMetadata = normalizeText(
    `${topicText} ${keywordText} ${journal}`,
  );
  const normalizedAll = `${normalizedTitle} ${normalizedAbstract} ${normalizedMetadata}`;

  const rankedTopics = TOPIC_RULES.map((rule) => {
    const titleMatches = rule.phrases.filter((phrase) =>
      includesPhrase(normalizedTitle, phrase),
    );
    const abstractMatches = rule.phrases.filter((phrase) =>
      includesPhrase(normalizedAbstract, phrase),
    );
    const metadataMatches = rule.phrases.filter((phrase) =>
      includesPhrase(normalizedMetadata, phrase),
    );
    const points =
      Math.min(30, titleMatches.length * 15) +
      Math.min(22, abstractMatches.length * 7) +
      Math.min(18, metadataMatches.length * 9);

    return {
      ...rule,
      points,
      matches: [
        ...new Set([...titleMatches, ...metadataMatches, ...abstractMatches]),
      ],
    };
  }).sort((left, right) => right.points - left.points);

  const bestTopic = rankedTopics[0];
  let score = 18 + bestTopic.points;
  const reasons: string[] = [];

  if (bestTopic.matches.length > 0) {
    reasons.push(
      `匹配“${bestTopic.topic}”关键词：${bestTopic.matches.slice(0, 3).join('、')}`,
    );
  }

  const otherTopic = rankedTopics.find(
    (candidate, index) => index > 0 && candidate.points >= 14,
  );
  if (otherTopic) {
    score += Math.min(10, Math.round(otherTopic.points / 3));
    reasons.push(`同时关联“${otherTopic.topic}”`);
  }

  if (abstract) score += 7;
  if (work.type === 'review') score += 4;

  const publicationDate = work.publication_date
    ? new Date(`${work.publication_date}T00:00:00Z`)
    : null;
  const endDate = new Date(`${toDate}T00:00:00Z`);
  const ageDays = publicationDate
    ? Math.max(
        0,
        Math.floor(
          (endDate.getTime() - publicationDate.getTime()) / 86_400_000,
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

  const citations = Math.max(0, work.cited_by_count ?? 0);
  if (citations > 0) {
    score += Math.min(6, Math.round(Math.log2(citations + 1)));
  }

  const negativeMatches = NEGATIVE_PHRASES.filter((phrase) =>
    includesPhrase(normalizedAll, phrase),
  );
  if (negativeMatches.length > 0) {
    score -= Math.min(45, negativeMatches.length * 18);
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    topic: bestTopic.points > 0 ? bestTopic.topic : '国际关系',
    reasons,
  };
}

export function mapOpenAlexWork(work: OpenAlexWork, toDate: string) {
  const sourceId = stripOpenAlexId(work.id);
  const title = (work.title ?? work.display_name ?? '').trim();
  const abstractOriginal = reconstructAbstract(work.abstract_inverted_index);
  if (!sourceId || !title || !abstractOriginal) return null;

  const doi = normalizeDoi(work.doi);
  const scored = scoreWork(work, abstractOriginal, toDate);
  const officialUrl =
    (doi ? `https://doi.org/${doi}` : null) ??
    work.primary_location?.landing_page_url ??
    work.best_oa_location?.landing_page_url ??
    work.id;
  const authors = (work.authorships ?? [])
    .map((authorship) => authorship.author?.display_name?.trim())
    .filter((name): name is string => Boolean(name));
  const normalizedForType = normalizeText(`${title} ${abstractOriginal}`);

  return {
    id: `openalex:${sourceId}`,
    fingerprint: doi ? `doi:${doi.toLowerCase()}` : `openalex:${sourceId}`,
    doi,
    sourceId,
    title,
    authors: [...new Set(authors)],
    journal: work.primary_location?.source?.display_name?.trim() || null,
    publicationDate: work.publication_date ?? null,
    officialUrl,
    abstractOriginal,
    paperType: classifyPaperType(work, normalizedForType),
    topic: scored.topic,
    keywordScore: scored.score,
    scoreReasons: scored.reasons,
    citedByCount: Math.max(0, work.cited_by_count ?? 0),
    contentHash: stableHash(`${title}\n${abstractOriginal}`),
    readingMinutes: work.type === 'review' ? 14 : 10,
  } satisfies OpenAlexPaper;
}

async function requestOpenAlex(url: URL, apiKey?: string) {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let retryDelayMs = 500 * 2 ** attempt;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
      });

      if (response.ok) return (await response.json()) as OpenAlexResponse;
      const message = await response.text();
      lastError = new Error(
        `OpenAlex request failed (${response.status}): ${message.slice(0, 240)}`,
      );
      if (response.status !== 429 && response.status < 500) break;
      const retryAfterSeconds = Number(response.headers.get('retry-after'));
      if (
        response.status === 429 &&
        attempt === 0 &&
        Number.isFinite(retryAfterSeconds)
      ) {
        retryDelayMs = clamp(retryAfterSeconds * 1000, 1_000, 45_000);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }

  throw lastError ?? new Error('OpenAlex request failed.');
}

export async function fetchOpenAlexPapers(
  options: FetchOpenAlexOptions,
): Promise<FetchOpenAlexResult> {
  const queries = options.queries ?? DEFAULT_OPENALEX_QUERIES;
  const perQuery = clamp(options.perQuery ?? 35, 1, 100);
  const minimumScore = clamp(options.minimumScore ?? 55, 0, 100);
  const limit = clamp(options.limit ?? 10, 1, 50);
  const works = new Map<string, OpenAlexWork>();
  let fetchedCount = 0;
  let estimatedCostUsd = 0;

  for (const query of queries) {
    const url = new URL(OPENALEX_API_URL);
    url.searchParams.set('search', query);
    url.searchParams.set(
      'filter',
      `from_publication_date:${options.fromDate},to_publication_date:${options.toDate},has_abstract:true,type:article|review`,
    );
    url.searchParams.set('sort', 'publication_date:desc');
    url.searchParams.set('per_page', String(perQuery));
    url.searchParams.set(
      'select',
      [
        'id',
        'doi',
        'title',
        'publication_date',
        'type',
        'cited_by_count',
        'relevance_score',
        'authorships',
        'primary_location',
        'best_oa_location',
        'abstract_inverted_index',
        'topics',
        'keywords',
      ].join(','),
    );
    if (options.email) url.searchParams.set('mailto', options.email);

    const payload = await requestOpenAlex(url, options.apiKey);
    const results = payload.results ?? [];
    fetchedCount += results.length;
    estimatedCostUsd += payload.meta?.cost_usd ?? 0;
    for (const work of results) works.set(work.id, work);
    if (!options.apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 1_100));
    }
  }

  const mappedPapers = [...works.values()]
    .map((work) => mapOpenAlexWork(work, options.toDate))
    .filter((paper): paper is OpenAlexPaper => Boolean(paper));
  const deduplicatedPapers = new Map<string, OpenAlexPaper>();
  for (const paper of mappedPapers) {
    const normalizedTitle = normalizeText(paper.title).replace(
      /[^\p{L}\p{N} ]/gu,
      '',
    );
    const titleKey = `${normalizedTitle}:${paper.publicationDate?.slice(0, 4) ?? ''}`;
    const key =
      normalizedTitle.length >= 24 ? `title:${titleKey}` : paper.fingerprint;
    const existing = deduplicatedPapers.get(key);
    if (
      !existing ||
      paper.keywordScore > existing.keywordScore ||
      (paper.keywordScore === existing.keywordScore &&
        paper.citedByCount > existing.citedByCount)
    ) {
      deduplicatedPapers.set(key, paper);
    }
  }

  const papers = [...deduplicatedPapers.values()]
    .filter((paper) => paper.keywordScore >= minimumScore)
    .sort((left, right) => {
      if (right.keywordScore !== left.keywordScore) {
        return right.keywordScore - left.keywordScore;
      }
      return (right.publicationDate ?? '').localeCompare(
        left.publicationDate ?? '',
      );
    })
    .slice(0, limit);

  return {
    papers,
    fetchedCount,
    uniqueCount: deduplicatedPapers.size,
    queryCount: queries.length,
    estimatedCostUsd,
  };
}

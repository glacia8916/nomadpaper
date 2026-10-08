import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const papers = sqliteTable(
  'papers',
  {
    id: text('id').primaryKey(),
    fingerprint: text('fingerprint').notNull(),
    doi: text('doi'),
    source: text('source').notNull(),
    sourceId: text('source_id'),
    title: text('title').notNull(),
    titleZh: text('title_zh'),
    authorsJson: text('authors_json').notNull().default('[]'),
    journal: text('journal'),
    publicationDate: text('publication_date'),
    officialUrl: text('official_url'),
    abstractOriginal: text('abstract_original'),
    abstractZh: text('abstract_zh'),
    paperType: text('paper_type').notNull().default('research'),
    topic: text('topic'),
    keywordScore: integer('keyword_score').notNull().default(0),
    scoreReasonsJson: text('score_reasons_json').notNull().default('[]'),
    journalIndexesJson: text('journal_indexes_json').notNull().default('[]'),
    impactFactor: real('impact_factor'),
    impactFactorYear: integer('impact_factor_year'),
    impactMetricSource: text('impact_metric_source'),
    impactMetricSourceUrl: text('impact_metric_source_url'),
    impactMetricCheckedAt: text('impact_metric_checked_at'),
    journalQuartile: text('journal_quartile'),
    journalQuartileYear: integer('journal_quartile_year'),
    journalQuartileSource: text('journal_quartile_source'),
    journalQuartileSourceUrl: text('journal_quartile_source_url'),
    journalQuartileCheckedAt: text('journal_quartile_checked_at'),
    citedByCount: integer('cited_by_count').notNull().default(0),
    researchMethod: text('research_method'),
    dataSources: text('data_sources'),
    coreConclusion: text('core_conclusion'),
    extensibleQuestionsJson: text('extensible_questions_json')
      .notNull()
      .default('[]'),
    innovations: text('innovations'),
    limitations: text('limitations'),
    futureDirections: text('future_directions'),
    analysisStatus: text('analysis_status').notNull().default('pending'),
    analysisError: text('analysis_error'),
    contentHash: text('content_hash'),
    readingMinutes: integer('reading_minutes').notNull().default(0),
    firstSeenAt: text('first_seen_at').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_papers_fingerprint').on(table.fingerprint),
    uniqueIndex('idx_papers_doi').on(table.doi),
    index('idx_papers_date_score').on(
      table.publicationDate,
      table.keywordScore,
    ),
    index('idx_papers_topic').on(table.topic),
    index('idx_papers_journal').on(table.journal),
  ],
);

export const recommendations = sqliteTable(
  'recommendations',
  {
    id: text('id').primaryKey(),
    paperId: text('paper_id')
      .notNull()
      .references(() => papers.id, { onDelete: 'cascade' }),
    recommendationDate: text('recommendation_date').notNull(),
    score: integer('score').notNull(),
    reasonsJson: text('reasons_json').notNull().default('[]'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    uniqueIndex('idx_recommendations_day_paper').on(
      table.recommendationDate,
      table.paperId,
    ),
    index('idx_recommendations_day_score').on(
      table.recommendationDate,
      table.score,
    ),
  ],
);

export const syncSettings = sqliteTable('sync_settings', {
  id: text('id').primaryKey().default('default'),
  intervalDays: integer('interval_days').notNull().default(1),
  runHour: integer('run_hour').notNull().default(8),
  minimumScore: integer('minimum_score').notNull().default(70),
  dailyLimit: integer('daily_limit').notNull().default(10),
  positiveKeywordsJson: text('positive_keywords_json').notNull().default('[]'),
  negativeKeywordsJson: text('negative_keywords_json').notNull().default('[]'),
  topicsJson: text('topics_json').notNull().default('[]'),
  enabledSourcesJson: text('enabled_sources_json').notNull().default('[]'),
  updatedAt: text('updated_at').notNull(),
});

export const syncRuns = sqliteTable(
  'sync_runs',
  {
    id: text('id').primaryKey(),
    status: text('status').notNull(),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
    fetchedCount: integer('fetched_count').notNull().default(0),
    deduplicatedCount: integer('deduplicated_count').notNull().default(0),
    savedCount: integer('saved_count').notNull().default(0),
    analyzedCount: integer('analyzed_count').notNull().default(0),
    errorMessage: text('error_message'),
  },
  (table) => [index('idx_sync_runs_started').on(table.startedAt)],
);

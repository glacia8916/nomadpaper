CREATE TABLE `papers` (
	`id` text PRIMARY KEY NOT NULL,
	`fingerprint` text NOT NULL,
	`doi` text,
	`source` text NOT NULL,
	`source_id` text,
	`title` text NOT NULL,
	`title_zh` text,
	`authors_json` text DEFAULT '[]' NOT NULL,
	`journal` text,
	`publication_date` text,
	`official_url` text,
	`abstract_original` text,
	`abstract_zh` text,
	`paper_type` text DEFAULT 'research' NOT NULL,
	`topic` text,
	`keyword_score` integer DEFAULT 0 NOT NULL,
	`score_reasons_json` text DEFAULT '[]' NOT NULL,
	`journal_indexes_json` text DEFAULT '[]' NOT NULL,
	`impact_factor` real,
	`impact_factor_year` integer,
	`impact_metric_source` text,
	`cited_by_count` integer DEFAULT 0 NOT NULL,
	`research_method` text,
	`data_sources` text,
	`core_conclusion` text,
	`extensible_questions_json` text DEFAULT '[]' NOT NULL,
	`innovations` text,
	`limitations` text,
	`future_directions` text,
	`analysis_status` text DEFAULT 'pending' NOT NULL,
	`content_hash` text,
	`reading_minutes` integer DEFAULT 0 NOT NULL,
	`first_seen_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_papers_fingerprint` ON `papers` (`fingerprint`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_papers_doi` ON `papers` (`doi`);--> statement-breakpoint
CREATE INDEX `idx_papers_date_score` ON `papers` (`publication_date`,`keyword_score`);--> statement-breakpoint
CREATE INDEX `idx_papers_topic` ON `papers` (`topic`);--> statement-breakpoint
CREATE INDEX `idx_papers_journal` ON `papers` (`journal`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`paper_id` text NOT NULL,
	`recommendation_date` text NOT NULL,
	`score` integer NOT NULL,
	`reasons_json` text DEFAULT '[]' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`paper_id`) REFERENCES `papers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_recommendations_day_paper` ON `recommendations` (`recommendation_date`,`paper_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_day_score` ON `recommendations` (`recommendation_date`,`score`);--> statement-breakpoint
CREATE TABLE `sync_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`fetched_count` integer DEFAULT 0 NOT NULL,
	`deduplicated_count` integer DEFAULT 0 NOT NULL,
	`saved_count` integer DEFAULT 0 NOT NULL,
	`analyzed_count` integer DEFAULT 0 NOT NULL,
	`error_message` text
);
--> statement-breakpoint
CREATE INDEX `idx_sync_runs_started` ON `sync_runs` (`started_at`);--> statement-breakpoint
CREATE TABLE `sync_settings` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`interval_days` integer DEFAULT 1 NOT NULL,
	`run_hour` integer DEFAULT 8 NOT NULL,
	`minimum_score` integer DEFAULT 70 NOT NULL,
	`daily_limit` integer DEFAULT 10 NOT NULL,
	`positive_keywords_json` text DEFAULT '[]' NOT NULL,
	`negative_keywords_json` text DEFAULT '[]' NOT NULL,
	`topics_json` text DEFAULT '[]' NOT NULL,
	`enabled_sources_json` text DEFAULT '[]' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;

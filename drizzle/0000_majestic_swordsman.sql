CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dedupe_key` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`canonical_url` text NOT NULL,
	`source_name` text NOT NULL,
	`source_feed_id` text NOT NULL,
	`source_type` text DEFAULT 'startup' NOT NULL,
	`region` text DEFAULT 'Global' NOT NULL,
	`category` text DEFAULT 'Startup' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`image_url` text,
	`published_at` text NOT NULL,
	`published_day` text NOT NULL,
	`published_month` text NOT NULL,
	`ingested_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`is_ksum` integer DEFAULT false NOT NULL,
	`is_traditional` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_dedupe_key_unique` ON `articles` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `articles_published_day_idx` ON `articles` (`published_day`);--> statement-breakpoint
CREATE INDEX `articles_published_month_idx` ON `articles` (`published_month`);--> statement-breakpoint
CREATE INDEX `articles_ksum_idx` ON `articles` (`is_ksum`,`published_at`);--> statement-breakpoint
CREATE INDEX `articles_source_idx` ON `articles` (`source_feed_id`);--> statement-breakpoint
CREATE INDEX `articles_category_idx` ON `articles` (`category`);--> statement-breakpoint
CREATE TABLE `ingestion_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trigger` text NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`finished_at` text,
	`inserted_count` integer DEFAULT 0 NOT NULL,
	`updated_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`feed_count` integer DEFAULT 0 NOT NULL,
	`message` text DEFAULT '' NOT NULL
);

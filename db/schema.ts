import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dedupeKey: text("dedupe_key").notNull().unique(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    sourceName: text("source_name").notNull(),
    sourceFeedId: text("source_feed_id").notNull(),
    sourceType: text("source_type").notNull().default("startup"),
    region: text("region").notNull().default("Global"),
    category: text("category").notNull().default("Startup"),
    summary: text("summary").notNull().default(""),
    imageUrl: text("image_url"),
    publishedAt: text("published_at").notNull(),
    publishedDay: text("published_day").notNull(),
    publishedMonth: text("published_month").notNull(),
    ingestedAt: text("ingested_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    language: text("language").notNull().default("en"),
    isKsum: integer("is_ksum", { mode: "boolean" }).notNull().default(false),
    isTraditional: integer("is_traditional", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (table) => [
    index("articles_published_day_idx").on(table.publishedDay),
    index("articles_published_month_idx").on(table.publishedMonth),
    index("articles_ksum_idx").on(table.isKsum, table.publishedAt),
    index("articles_source_idx").on(table.sourceFeedId),
    index("articles_category_idx").on(table.category),
  ]
);

export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trigger: text("trigger").notNull(),
  status: text("status").notNull().default("running"),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  finishedAt: text("finished_at"),
  insertedCount: integer("inserted_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  feedCount: integer("feed_count").notNull().default(0),
  message: text("message").notNull().default(""),
});

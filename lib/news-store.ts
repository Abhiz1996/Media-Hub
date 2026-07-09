import { dayInIndia, lastNDaysInIndia, monthInIndia } from "./date";
import type { ParsedArticle } from "./rss";

export type DashboardArticle = {
  id: number;
  title: string;
  url: string;
  canonicalUrl: string;
  sourceName: string;
  sourceType: string;
  region: string;
  category: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string;
  publishedDay: string;
  publishedMonth: string;
  ingestedAt: string;
  language: string;
  isKsum: boolean;
  isTraditional: boolean;
};

export type DashboardSnapshot = {
  stats: {
    todayCount: number;
    monthCount: number;
    ksumCount: number;
    sourceCount: number;
    traditionalCount: number;
    totalCount: number;
  };
  recentArticles: DashboardArticle[];
  ksumArticles: DashboardArticle[];
  categoryCounts: Array<{ category: string; count: number }>;
  regionCounts: Array<{ region: string; count: number }>;
  dailyCounts: Array<{ day: string; count: number }>;
  lastRun: IngestionRun | null;
};

export type IngestionRun = {
  id: number;
  trigger: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  insertedCount: number;
  updatedCount: number;
  failedCount: number;
  feedCount: number;
  message: string;
};

type ArticleRow = {
  id: number;
  title: string;
  url: string;
  canonical_url: string;
  source_name: string;
  source_type: string;
  region: string;
  category: string;
  summary: string;
  image_url: string | null;
  published_at: string;
  published_day: string;
  published_month: string;
  ingested_at: string;
  language: string;
  is_ksum: number;
  is_traditional: number;
};

type RunRow = {
  id: number;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  inserted_count: number;
  updated_count: number;
  failed_count: number;
  feed_count: number;
  message: string;
};

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dedupe_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_feed_id TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'startup',
    region TEXT NOT NULL DEFAULT 'Global',
    category TEXT NOT NULL DEFAULT 'Startup',
    summary TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    published_at TEXT NOT NULL,
    published_day TEXT NOT NULL,
    published_month TEXT NOT NULL,
    ingested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    language TEXT NOT NULL DEFAULT 'en',
    is_ksum INTEGER NOT NULL DEFAULT 0,
    is_traditional INTEGER NOT NULL DEFAULT 0
  )`,
  "CREATE INDEX IF NOT EXISTS articles_published_day_idx ON articles (published_day)",
  "CREATE INDEX IF NOT EXISTS articles_published_month_idx ON articles (published_month)",
  "CREATE INDEX IF NOT EXISTS articles_ksum_idx ON articles (is_ksum, published_at)",
  "CREATE INDEX IF NOT EXISTS articles_source_idx ON articles (source_feed_id)",
  "CREATE INDEX IF NOT EXISTS articles_category_idx ON articles (category)",
  `CREATE TABLE IF NOT EXISTS ingestion_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trigger TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running',
    started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    inserted_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    feed_count INTEGER NOT NULL DEFAULT 0,
    message TEXT NOT NULL DEFAULT ''
  )`,
  "CREATE INDEX IF NOT EXISTS ingestion_runs_started_at_idx ON ingestion_runs (started_at)",
];

function countValue(row: { count: number } | null) {
  return Number(row?.count ?? 0);
}

function truncate(value: string, length: number) {
  return value.length > length ? `${value.slice(0, length - 1).trim()}...` : value;
}

function toDashboardArticle(row: ArticleRow): DashboardArticle {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    canonicalUrl: row.canonical_url,
    sourceName: row.source_name,
    sourceType: row.source_type,
    region: row.region,
    category: row.category,
    summary: row.summary,
    imageUrl: row.image_url,
    publishedAt: row.published_at,
    publishedDay: row.published_day,
    publishedMonth: row.published_month,
    ingestedAt: row.ingested_at,
    language: row.language,
    isKsum: Boolean(row.is_ksum),
    isTraditional: Boolean(row.is_traditional),
  };
}

function toIngestionRun(row: RunRow | null): IngestionRun | null {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    insertedCount: row.inserted_count,
    updatedCount: row.updated_count,
    failedCount: row.failed_count,
    feedCount: row.feed_count,
    message: row.message,
  };
}

export async function ensureNewsSchema(db: D1Database) {
  await db.batch(SCHEMA_STATEMENTS.map((statement) => db.prepare(statement)));
}

export async function createIngestionRun(db: D1Database, trigger: string) {
  const result = await db
    .prepare(
      "INSERT INTO ingestion_runs (trigger, status, started_at) VALUES (?, 'running', ?)"
    )
    .bind(trigger, new Date().toISOString())
    .run();
  const meta = result.meta as { last_row_id?: number };
  return meta.last_row_id ?? 0;
}

export async function finishIngestionRun(
  db: D1Database,
  id: number,
  values: {
    insertedCount: number;
    updatedCount: number;
    failedCount: number;
    feedCount: number;
    message: string;
    status: "success" | "partial" | "failed";
  }
) {
  if (!id) {
    return;
  }

  await db
    .prepare(
      `UPDATE ingestion_runs
       SET status = ?, finished_at = ?, inserted_count = ?, updated_count = ?,
           failed_count = ?, feed_count = ?, message = ?
       WHERE id = ?`
    )
    .bind(
      values.status,
      new Date().toISOString(),
      values.insertedCount,
      values.updatedCount,
      values.failedCount,
      values.feedCount,
      truncate(values.message, 1000),
      id
    )
    .run();
}

export async function upsertArticle(db: D1Database, article: ParsedArticle) {
  const publishedDate = new Date(article.publishedAt);
  const publishedDay = dayInIndia(publishedDate);
  const publishedMonth = monthInIndia(publishedDate);
  const ingestedAt = new Date().toISOString();
  const existing = await db
    .prepare("SELECT id FROM articles WHERE dedupe_key = ?")
    .bind(article.dedupeKey)
    .first<{ id: number }>();

  const values = [
    article.title,
    article.url,
    article.canonicalUrl,
    article.sourceName,
    article.sourceFeedId,
    article.sourceType,
    article.region,
    article.category,
    truncate(article.summary, 1200),
    article.imageUrl,
    article.publishedAt,
    publishedDay,
    publishedMonth,
    ingestedAt,
    article.language,
    article.isKsum ? 1 : 0,
    article.isTraditional ? 1 : 0,
  ];

  if (existing) {
    await db
      .prepare(
        `UPDATE articles
         SET title = ?, url = ?, canonical_url = ?, source_name = ?,
             source_feed_id = ?, source_type = ?, region = ?, category = ?,
             summary = ?, image_url = ?, published_at = ?, published_day = ?,
             published_month = ?, ingested_at = ?, language = ?, is_ksum = ?,
             is_traditional = ?
         WHERE dedupe_key = ?`
      )
      .bind(...values, article.dedupeKey)
      .run();
    return "updated" as const;
  }

  await db
    .prepare(
      `INSERT INTO articles (
        title, url, canonical_url, source_name, source_feed_id, source_type,
        region, category, summary, image_url, published_at, published_day,
        published_month, ingested_at, language, is_ksum, is_traditional,
        dedupe_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(...values, article.dedupeKey)
    .run();
  return "inserted" as const;
}

async function count(db: D1Database, sql: string, ...bindings: unknown[]) {
  const row = await db
    .prepare(sql)
    .bind(...bindings)
    .first<{ count: number }>();
  return countValue(row);
}

export async function getDashboardSnapshot(
  db: D1Database
): Promise<DashboardSnapshot> {
  await ensureNewsSchema(db);

  const today = dayInIndia();
  const month = monthInIndia();
  const days = lastNDaysInIndia(14);

  const [
    todayCount,
    monthCount,
    ksumCount,
    sourceCount,
    traditionalCount,
    totalCount,
    recentResult,
    ksumResult,
    categoryResult,
    regionResult,
    dailyResult,
    lastRunRow,
  ] = await Promise.all([
    count(db, "SELECT COUNT(*) AS count FROM articles WHERE published_day = ?", today),
    count(
      db,
      "SELECT COUNT(*) AS count FROM articles WHERE published_month = ?",
      month
    ),
    count(db, "SELECT COUNT(*) AS count FROM articles WHERE is_ksum = 1"),
    count(db, "SELECT COUNT(DISTINCT source_name) AS count FROM articles"),
    count(db, "SELECT COUNT(*) AS count FROM articles WHERE is_traditional = 1"),
    count(db, "SELECT COUNT(*) AS count FROM articles"),
    db
      .prepare(
        `SELECT id, title, url, canonical_url, source_name, source_type, region,
                category, summary, image_url, published_at, published_day,
                published_month, ingested_at, language, is_ksum, is_traditional
         FROM articles
         ORDER BY published_at DESC, id DESC
         LIMIT 80`
      )
      .all<ArticleRow>(),
    db
      .prepare(
        `SELECT id, title, url, canonical_url, source_name, source_type, region,
                category, summary, image_url, published_at, published_day,
                published_month, ingested_at, language, is_ksum, is_traditional
         FROM articles
         WHERE is_ksum = 1
         ORDER BY published_at DESC, id DESC
         LIMIT 60`
      )
      .all<ArticleRow>(),
    db
      .prepare(
        `SELECT category, COUNT(*) AS count
         FROM articles
         WHERE published_month = ?
         GROUP BY category
         ORDER BY count DESC, category ASC`
      )
      .bind(month)
      .all<{ category: string; count: number }>(),
    db
      .prepare(
        `SELECT region, COUNT(*) AS count
         FROM articles
         WHERE published_month = ?
         GROUP BY region
         ORDER BY count DESC, region ASC`
      )
      .bind(month)
      .all<{ region: string; count: number }>(),
    db
      .prepare(
        `SELECT published_day AS day, COUNT(*) AS count
         FROM articles
         WHERE published_day >= ?
         GROUP BY published_day
         ORDER BY published_day ASC`
      )
      .bind(days[0])
      .all<{ day: string; count: number }>(),
    db
      .prepare(
        `SELECT id, trigger, status, started_at, finished_at, inserted_count,
                updated_count, failed_count, feed_count, message
         FROM ingestion_runs
         ORDER BY started_at DESC, id DESC
         LIMIT 1`
      )
      .first<RunRow>(),
  ]);

  const dailyMap = new Map(
    (dailyResult.results ?? []).map((row) => [row.day, Number(row.count)])
  );

  return {
    stats: {
      todayCount,
      monthCount,
      ksumCount,
      sourceCount,
      traditionalCount,
      totalCount,
    },
    recentArticles: (recentResult.results ?? []).map(toDashboardArticle),
    ksumArticles: (ksumResult.results ?? []).map(toDashboardArticle),
    categoryCounts: (categoryResult.results ?? []).map((row) => ({
      category: row.category,
      count: Number(row.count),
    })),
    regionCounts: (regionResult.results ?? []).map((row) => ({
      region: row.region,
      count: Number(row.count),
    })),
    dailyCounts: days.map((day) => ({ day, count: dailyMap.get(day) ?? 0 })),
    lastRun: toIngestionRun(lastRunRow),
  };
}

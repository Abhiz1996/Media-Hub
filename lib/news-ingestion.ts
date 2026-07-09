import { NEWS_SOURCES, type NewsSource } from "./news-sources";
import {
  createIngestionRun,
  ensureNewsSchema,
  finishIngestionRun,
  upsertArticle,
} from "./news-store";
import { parseFeed } from "./rss";

export type IngestionSummary = {
  status: "success" | "partial" | "failed";
  insertedCount: number;
  updatedCount: number;
  failedCount: number;
  feedCount: number;
  messages: string[];
};

async function fetchFeed(source: NewsSource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(source.feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8",
        "User-Agent":
          "StartupNewsTracker/1.0 (+https://example.local; RSS aggregation)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function runNewsIngestion(
  db: D1Database,
  options: { trigger?: string; sources?: NewsSource[] } = {}
): Promise<IngestionSummary> {
  const trigger = options.trigger ?? "manual";
  const sources = options.sources ?? NEWS_SOURCES;

  await ensureNewsSchema(db);
  const runId = await createIngestionRun(db, trigger);

  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;
  const messages: string[] = [];
  const seenKeys = new Set<string>();

  for (const source of sources) {
    try {
      const xml = await fetchFeed(source);
      const limit = source.isKsum ? 100 : 45;
      const articles = parseFeed(xml, source).slice(0, limit);

      for (const article of articles) {
        if (seenKeys.has(article.dedupeKey)) {
          continue;
        }
        seenKeys.add(article.dedupeKey);
        const action = await upsertArticle(db, article);
        if (action === "inserted") {
          insertedCount += 1;
        } else {
          updatedCount += 1;
        }
      }
    } catch (error) {
      failedCount += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      messages.push(`${source.name}: ${message}`);
    }
  }

  const status =
    failedCount === 0 ? "success" : failedCount === sources.length ? "failed" : "partial";

  await finishIngestionRun(db, runId, {
    failedCount,
    feedCount: sources.length,
    insertedCount,
    message:
      messages.length > 0
        ? messages.join(" | ")
        : `Fetched ${sources.length} sources`,
    status,
    updatedCount,
  });

  return {
    failedCount,
    feedCount: sources.length,
    insertedCount,
    messages,
    status,
    updatedCount,
  };
}

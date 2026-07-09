import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outputPath = resolve(root, "docs/data/news.json");
const timeZone = "Asia/Kolkata";

function googleNewsSearch(query, options) {
  const params = new URLSearchParams({
    ceid: options.ceid,
    gl: options.gl,
    hl: options.hl,
    q: query,
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

const sources = [
  {
    id: "google-global-startups",
    name: "Google News Global Startups",
    feedUrl: googleNewsSearch("startup OR startups venture funding when:2d", {
      ceid: "US:en",
      gl: "US",
      hl: "en-US",
    }),
    region: "Global",
    category: "Funding",
    sourceType: "search",
  },
  {
    id: "google-startup-ecosystem",
    name: "Google News Startup Ecosystem",
    feedUrl: googleNewsSearch(
      "startup ecosystem OR incubator OR accelerator when:2d",
      { ceid: "US:en", gl: "US", hl: "en-US" }
    ),
    region: "Global",
    category: "Ecosystem",
    sourceType: "search",
  },
  {
    id: "google-india-startups",
    name: "Google News India Startups",
    feedUrl: googleNewsSearch("India startup OR startups funding when:2d", {
      ceid: "IN:en",
      gl: "IN",
      hl: "en-IN",
    }),
    region: "India",
    category: "Ecosystem",
    sourceType: "search",
  },
  {
    id: "google-ksum",
    name: "Kerala Startup Mission Search",
    feedUrl: googleNewsSearch('"Kerala Startup Mission" OR KSUM when:30d', {
      ceid: "IN:en",
      gl: "IN",
      hl: "en-IN",
    }),
    region: "Kerala",
    category: "KSUM",
    sourceType: "search",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-ksum-regional",
    name: "KSUM Regional Media Search",
    feedUrl: googleNewsSearch(
      '"Kerala Startup Mission" Kerala Malayalam when:30d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "KSUM",
    sourceType: "traditional",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "techcrunch-startups",
    name: "TechCrunch Startups",
    feedUrl: "https://techcrunch.com/category/startups/feed/",
    region: "Global",
    category: "Startup",
    sourceType: "startup",
  },
  {
    id: "inc42",
    name: "Inc42",
    feedUrl: "https://inc42.com/feed/",
    region: "India",
    category: "Ecosystem",
    sourceType: "startup",
  },
  {
    id: "yourstory",
    name: "YourStory",
    feedUrl: "https://yourstory.com/feed",
    region: "India",
    category: "Ecosystem",
    sourceType: "startup",
  },
  {
    id: "entrackr",
    name: "Entrackr",
    feedUrl: "https://entrackr.com/rss",
    region: "India",
    category: "Funding",
    sourceType: "startup",
  },
  {
    id: "eu-startups",
    name: "EU-Startups",
    feedUrl: "https://www.eu-startups.com/feed/",
    region: "Europe",
    category: "Ecosystem",
    sourceType: "startup",
  },
  {
    id: "sifted",
    name: "Sifted",
    feedUrl: "https://sifted.eu/feed",
    region: "Europe",
    category: "Industry",
    sourceType: "industry",
  },
];

const traditionalPublishers = [
  "the hindu",
  "businessline",
  "indian express",
  "times of india",
  "economic times",
  "mint",
  "business standard",
  "mathrubhumi",
  "manorama",
  "onmanorama",
  "new indian express",
  "ani",
  "reuters",
  "bbc",
];

const parser = new XMLParser({
  attributeNamePrefix: "",
  cdataPropName: "cdata",
  ignoreAttributes: false,
  processEntities: true,
  textNodeName: "text",
  trimValues: true,
});

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function readText(value) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    return readText(value.cdata ?? value.text ?? value.href ?? value.url);
  }
  return "";
}

function stripTags(value) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    for (const key of Array.from(url.searchParams.keys())) {
      if (
        key.startsWith("utm_") ||
        key === "fbclid" ||
        key === "gclid" ||
        key === "mc_cid" ||
        key === "mc_eid"
      ) {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    return url.toString();
  } catch {
    return rawUrl.trim();
  }
}

function itemLink(item) {
  const link = item.link;
  if (Array.isArray(link)) {
    const alternate =
      link.find((entry) => entry && typeof entry === "object" && entry.rel === "alternate") ??
      link[0];
    return readText(alternate);
  }
  return readText(link);
}

function sourceNameFromItem(item, source) {
  return readText(item.source) || source.name;
}

function publishedIso(rawDate) {
  const parsed = rawDate ? new Date(rawDate) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function dayInIndia(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit",
      month: "2-digit",
      timeZone,
      year: "numeric",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function monthInIndia(date = new Date()) {
  return dayInIndia(date).slice(0, 7);
}

function isKsumArticle(source, title, summary, sourceName) {
  const haystack = `${title} ${summary} ${sourceName}`.toLowerCase();
  return (
    Boolean(source.isKsum) ||
    haystack.includes("kerala startup mission") ||
    /\bksum\b/i.test(haystack)
  );
}

function isTraditionalArticle(source, sourceName, url) {
  if (source.isTraditional || source.sourceType === "traditional") return true;
  const haystack = `${sourceName} ${url}`.toLowerCase();
  return traditionalPublishers.some((publisher) => haystack.includes(publisher));
}

function parseFeed(xml, source) {
  const parsed = parser.parse(xml);
  const rssItems = asArray(parsed?.rss?.channel?.item);
  const atomEntries = asArray(parsed?.feed?.entry);
  const items = rssItems.length > 0 ? rssItems : atomEntries;

  return items
    .map((item) => {
      const title = stripTags(readText(item.title));
      const url = itemLink(item);
      if (!title || !url) return null;

      const summary = stripTags(
        readText(item.description ?? item.summary ?? item.content ?? item["content:encoded"])
      );
      const canonicalUrl = normalizeUrl(url);
      const sourceName = sourceNameFromItem(item, source);
      const publishedAt = publishedIso(
        readText(item.pubDate ?? item.published ?? item.updated ?? item["dc:date"])
      );
      const publishedDate = new Date(publishedAt);

      return {
        id: canonicalUrl.toLowerCase(),
        title,
        url,
        canonicalUrl,
        sourceName,
        sourceFeedId: source.id,
        sourceType: source.sourceType,
        region: source.region,
        category: source.category,
        summary: summary.slice(0, 500),
        publishedAt,
        publishedDay: dayInIndia(publishedDate),
        publishedMonth: monthInIndia(publishedDate),
        isKsum: isKsumArticle(source, title, summary, sourceName),
        isTraditional: isTraditionalArticle(source, sourceName, canonicalUrl),
      };
    })
    .filter(Boolean);
}

async function fetchFeed(source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(source.feedUrl, {
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.8",
        "User-Agent": "MediaHubStartupNewsTracker/1.0",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  }
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
}

function lastNDays(count) {
  const days = [];
  const now = new Date();
  for (let index = count - 1; index >= 0; index -= 1) {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - index);
    days.push(dayInIndia(date));
  }
  return days;
}

async function main() {
  const seen = new Map();
  const failures = [];

  for (const source of sources) {
    try {
      const xml = await fetchFeed(source);
      const limit = source.isKsum ? 100 : 45;
      for (const article of parseFeed(xml, source).slice(0, limit)) {
        if (!seen.has(article.id)) seen.set(article.id, article);
      }
    } catch (error) {
      failures.push({
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const articles = Array.from(seen.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const today = dayInIndia();
  const month = monthInIndia();
  const days = lastNDays(14);
  const dailyMap = new Map(days.map((day) => [day, 0]));
  for (const article of articles) {
    if (dailyMap.has(article.publishedDay)) {
      dailyMap.set(article.publishedDay, dailyMap.get(article.publishedDay) + 1);
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceCount: sources.length,
    failures,
    stats: {
      todayCount: articles.filter((article) => article.publishedDay === today).length,
      monthCount: articles.filter((article) => article.publishedMonth === month).length,
      ksumCount: articles.filter((article) => article.isKsum).length,
      traditionalCount: articles.filter((article) => article.isTraditional).length,
      totalCount: articles.length,
    },
    dailyCounts: days.map((day) => ({ day, count: dailyMap.get(day) ?? 0 })),
    categoryCounts: countBy(articles.filter((article) => article.publishedMonth === month), "category"),
    regionCounts: countBy(articles.filter((article) => article.publishedMonth === month), "region"),
    recentArticles: articles.slice(0, 80),
    ksumArticles: articles.filter((article) => article.isKsum).slice(0, 60),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(
    `Wrote ${payload.stats.totalCount} articles, ${payload.stats.ksumCount} KSUM records to ${outputPath}`
  );
  if (failures.length > 0) {
    console.warn(`Feed failures: ${failures.map((item) => item.source).join(", ")}`);
  }
}

await main();

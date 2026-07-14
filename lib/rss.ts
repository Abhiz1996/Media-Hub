import { XMLParser } from "fast-xml-parser";
import type { NewsSource } from "./news-sources";

export type ParsedArticle = {
  title: string;
  url: string;
  canonicalUrl: string;
  dedupeKey: string;
  sourceName: string;
  sourceFeedId: string;
  sourceType: string;
  region: string;
  category: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: string;
  language: string;
  isKsum: boolean;
  isTraditional: boolean;
};

const parser = new XMLParser({
  attributeNamePrefix: "",
  cdataPropName: "cdata",
  ignoreAttributes: false,
  processEntities: true,
  textNodeName: "text",
  trimValues: true,
});

const TRADITIONAL_PUBLISHERS = [
  "the hindu",
  "businessline",
  "indian express",
  "times of india",
  "economic times",
  "mint",
  "business standard",
  "deccan herald",
  "mathrubhumi",
  "malayala manorama",
  "manorama",
  "onmanorama",
  "new indian express",
  "the news minute",
  "south first",
  "kerala kaumudi",
  "deshabhimani",
  "madhyamam",
  "asianet news",
  "news18 malayalam",
  "mediaone",
  "reporter tv",
  "twentyfour news",
  "kairali",
  "deepika",
  "mangalam",
  "ptc news",
  "ani",
  "reuters",
  "associated press",
  "bbc",
];

const STARTUP_KERALA_KEYWORDS = [
  "kerala startup mission",
  "ksum",
  "startup kerala",
  "kerala startups",
  "startups kerala",
  "startups in kerala",
  "kerala startup ecosystem",
  "kerala startup",
  "kerala-based startup",
  "kerala based startup",
  "kerala-based startups",
  "kerala based startups",
  "kerala entrepreneur",
  "kerala entrepreneurship",
  "kochi startup",
  "kochi startups",
  "kochi-based startup",
  "kochi based startup",
  "thiruvananthapuram startup",
  "trivandrum startup",
  "kozhikode startup",
  "calicut startup",
  "thrissur startup",
  "malappuram startup",
  "technopark startup",
  "infopark startup",
  "cyberpark startup",
  "maker village",
  "iedc kerala",
  "kerala iedc",
  "k-disc startup",
  "kdisc startup",
  "startup mission kerala",
  "malabar startup",
  "kerala innovation grant",
  "kerala startup grant",
  "kerala startup policy",
  "kerala startup scheme",
  "startup incubator kerala",
  "accelerator kerala",
  "student startup kerala",
  "women startup kerala",
  "kerala fintech startup",
  "kerala healthtech startup",
  "kerala agritech startup",
  "kerala ai startup",
  "kerala robotics startup",
  "kerala deeptech startup",
];

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function readText(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return readText(record.cdata ?? record.text ?? record.href ?? record.url);
  }
  return "";
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeUrl(rawUrl: string) {
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

function readImage(item: Record<string, unknown>) {
  const mediaContent = item["media:content"];
  const mediaThumbnail = item["media:thumbnail"];
  const enclosure = item.enclosure;
  const image =
    asArray(mediaContent)[0] ?? asArray(mediaThumbnail)[0] ?? asArray(enclosure)[0];

  if (image && typeof image === "object") {
    const record = image as Record<string, unknown>;
    const url = readText(record.url ?? record.href);
    return url || null;
  }

  return null;
}

function sourceNameFromItem(item: Record<string, unknown>, source: NewsSource) {
  const itemSource = item.source;
  const sourceName = readText(itemSource);
  return sourceName || source.name;
}

function publishedIso(rawDate: string) {
  const parsed = rawDate ? new Date(rawDate) : new Date();
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function isKsumArticle(
  source: NewsSource,
  title: string,
  summary: string,
  sourceName: string
) {
  const haystack = `${title} ${summary} ${sourceName}`.toLowerCase();
  return Boolean(source.isKsum) || STARTUP_KERALA_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function isTraditionalArticle(source: NewsSource, sourceName: string, url: string) {
  if (source.isTraditional || source.sourceType === "traditional") {
    return true;
  }
  const haystack = `${sourceName} ${url}`.toLowerCase();
  return TRADITIONAL_PUBLISHERS.some((publisher) => haystack.includes(publisher));
}

function itemLink(item: Record<string, unknown>) {
  const link = item.link;
  if (Array.isArray(link)) {
    const alternate =
      link.find(
        (entry) =>
          typeof entry === "object" &&
          entry != null &&
          (entry as Record<string, unknown>).rel === "alternate"
      ) ?? link[0];
    return readText(alternate);
  }
  return readText(link);
}

function parseRssItem(item: Record<string, unknown>, source: NewsSource) {
  const title = stripTags(readText(item.title));
  const url = itemLink(item);
  if (!title || !url) {
    return null;
  }

  const summary = stripTags(
    readText(item.description ?? item.summary ?? item.content ?? item["content:encoded"])
  );
  const canonicalUrl = normalizeUrl(url);
  const sourceName = sourceNameFromItem(item, source);
  const publishedAt = publishedIso(
    readText(item.pubDate ?? item.published ?? item.updated ?? item["dc:date"])
  );

  return {
    title,
    url,
    canonicalUrl,
    dedupeKey: canonicalUrl.toLowerCase(),
    sourceName,
    sourceFeedId: source.id,
    sourceType: source.sourceType,
    region: source.region,
    category: source.category,
    summary,
    imageUrl: readImage(item),
    publishedAt,
    language: source.language ?? "en",
    isKsum: isKsumArticle(source, title, summary, sourceName),
    isTraditional: isTraditionalArticle(source, sourceName, canonicalUrl),
  };
}

export function parseFeed(xml: string, source: NewsSource): ParsedArticle[] {
  const parsed = parser.parse(xml) as Record<string, unknown>;
  const rssRoot = parsed.rss as Record<string, unknown> | undefined;
  const channel = rssRoot?.channel as Record<string, unknown> | undefined;
  const rssItems = asArray(channel?.item as Record<string, unknown> | undefined);

  if (rssItems.length > 0) {
    return rssItems
      .map((item) => parseRssItem(item, source))
      .filter((item): item is ParsedArticle => item != null);
  }

  const feed = parsed.feed as Record<string, unknown> | undefined;
  const entries = asArray(feed?.entry as Record<string, unknown> | undefined);
  return entries
    .map((entry) => parseRssItem(entry, source))
    .filter((item): item is ParsedArticle => item != null);
}

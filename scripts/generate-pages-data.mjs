import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outputPath = resolve(root, "docs/data/news.json");
const outputScriptPath = resolve(root, "docs/data/news.js");
const timeZone = "Asia/Kolkata";

const segments = {
  internationalStartup: "international-startup",
  internationalGeneral: "international-general",
  indiaStartup: "india-startup",
  indiaNational: "india-national",
  startupKerala: "startup-kerala",
  socialMentions: "social-mentions",
};

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
    segment: segments.internationalStartup,
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
    segment: segments.internationalStartup,
  },
  {
    id: "google-international-business",
    name: "International Business News",
    feedUrl: googleNewsSearch(
      "global business OR economy OR technology innovation when:2d",
      { ceid: "US:en", gl: "US", hl: "en-US" }
    ),
    region: "Global",
    category: "International",
    sourceType: "search",
    segment: segments.internationalGeneral,
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
    segment: segments.indiaStartup,
  },
  {
    id: "google-india-national",
    name: "India National Business News",
    feedUrl: googleNewsSearch(
      "India business OR economy OR technology OR policy when:2d",
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "India",
    category: "National",
    sourceType: "search",
    segment: segments.indiaNational,
  },
  {
    id: "google-ksum",
    name: "Kerala Startup Mission Search",
    feedUrl: googleNewsSearch(
      '"Kerala Startup Mission" OR KSUM OR "Kerala Startup Mission grant" OR "KSUM funding" when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "KSUM",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-ksum-programs",
    name: "KSUM Programs and Events Search",
    feedUrl: googleNewsSearch(
      'KSUM startup OR "Kerala Startup Mission" incubator OR "Kerala Startup Mission" accelerator OR "Kerala Startup Mission" programme OR "Kerala Startup Mission" event when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "KSUM",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-startup-funding",
    name: "Kerala Startup Funding Search",
    feedUrl: googleNewsSearch(
      '"Kerala startup funding" OR "Kerala startup raises" OR "Kerala-based startup" funding OR "Kochi startup" funding OR "Trivandrum startup" funding when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "Funding",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-startup-cities",
    name: "Kerala Startup City Hubs Search",
    feedUrl: googleNewsSearch(
      '"Kochi startup" OR "Thiruvananthapuram startup" OR "Trivandrum startup" OR "Kozhikode startup" OR "Calicut startup" OR "Thrissur startup" OR "Malappuram startup" when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "Startup Kerala",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-innovation-hubs",
    name: "Kerala Innovation Hubs Search",
    feedUrl: googleNewsSearch(
      '"Technopark startup" OR "Infopark startup" OR "Cyberpark startup" OR "Maker Village" OR "Kerala IEDC" OR "IEDC Kerala" OR "K-DISC" startup when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "Ecosystem",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-startup-policy",
    name: "Kerala Startup Policy and Grants Search",
    feedUrl: googleNewsSearch(
      '"Kerala startup policy" OR "Kerala innovation grant" OR "Kerala entrepreneurship" OR "Kerala startup scheme" OR "Kerala startup grant" when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "Policy",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-regional-press",
    name: "Kerala Regional Startup Press Search",
    feedUrl: googleNewsSearch(
      'Kerala startup Malayalam OR KSUM Malayalam OR "Kerala Startup Mission" Malayalam OR "Kerala startup" Manorama OR "Kerala startup" Mathrubhumi OR "Kerala startup" Asianet when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "Regional Press",
    sourceType: "traditional",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-sector-startups",
    name: "Kerala Sector Startup Search",
    feedUrl: googleNewsSearch(
      '"Kerala fintech startup" OR "Kerala healthtech startup" OR "Kerala agritech startup" OR "Kerala AI startup" OR "Kerala robotics startup" OR "Kerala deeptech startup" when:45d',
      {
        ceid: "IN:en",
        gl: "IN",
        hl: "en-IN",
      }
    ),
    region: "Kerala",
    category: "Startup Kerala",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-ksum-legacy",
    name: "Kerala Startup Mission Exact Search",
    feedUrl: googleNewsSearch('"Kerala Startup Mission" OR KSUM when:45d', {
      ceid: "IN:en",
      gl: "IN",
      hl: "en-IN",
    }),
    region: "Kerala",
    category: "KSUM",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-ksum-regional",
    name: "KSUM Regional Media Search",
    feedUrl: googleNewsSearch(
      '"Kerala Startup Mission" Kerala Malayalam OR KSUM Kerala Malayalam when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "KSUM",
    sourceType: "traditional",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-startup-kerala",
    name: "Startup Kerala Search",
    feedUrl: googleNewsSearch(
      '"Startup Kerala" OR "Kerala startups" OR "startups in Kerala" OR "Kerala startup ecosystem" OR "Kerala Startup Mission" OR "Kerala-based startup" when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Startup Kerala",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kochi-startups",
    name: "Kochi and Kerala Startup Search",
    feedUrl: googleNewsSearch(
      '"Kochi startup" OR "Kerala startup" OR "Technopark startup" OR "Infopark startup" OR "Maker Village" OR "IEDC Kerala" OR "Cyberpark startup" when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Startup Kerala",
    sourceType: "search",
    segment: segments.startupKerala,
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-ksum-social",
    name: "KSUM Social Media Mentions",
    feedUrl: googleNewsSearch(
      '"Kerala Startup Mission" Instagram OR "Kerala Startup Mission" LinkedIn OR KSUM Instagram OR KSUM LinkedIn OR KSUM YouTube OR KSUM Twitter when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Social Media",
    sourceType: "social",
    segment: segments.socialMentions,
    isKsum: true,
    isSocial: true,
    isTraditional: true,
  },
  {
    id: "google-startup-kerala-social",
    name: "Startup Kerala Social Mentions",
    feedUrl: googleNewsSearch(
      '"Startup Kerala" Instagram OR "Kerala startups" LinkedIn OR "Kerala-based startup" LinkedIn OR "Kochi startup" Instagram OR "Kerala Startup Mission" YouTube when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Social Media",
    sourceType: "social",
    segment: segments.socialMentions,
    isKsum: true,
    isSocial: true,
    isTraditional: true,
  },
  {
    id: "google-startup-social-global",
    name: "Global Startup Social Mentions",
    feedUrl: googleNewsSearch(
      "startup Instagram OR LinkedIn OR YouTube OR X funding OR launch announcement when:7d",
      { ceid: "US:en", gl: "US", hl: "en-US" }
    ),
    region: "Global",
    category: "Social Media",
    sourceType: "social",
    segment: segments.socialMentions,
    isSocial: true,
    isTraditional: true,
  },
  {
    id: "reddit-kerala-startup",
    name: "Reddit: Kerala Startup Mission",
    feedUrl:
      "https://www.reddit.com/search.rss?q=%22Kerala+Startup+Mission%22+OR+%22Startup+Kerala%22+OR+KSUM&sort=new&limit=50",
    region: "Kerala",
    category: "Social Media",
    sourceType: "social",
    segment: segments.socialMentions,
    isSocial: true,
    requireStartupKeralaKeyword: true,
  },
  {
    id: "hackernews-startup",
    name: "Hacker News: startup",
    feedUrl: "https://hnrss.org/newest?q=startup+OR+%22venture+funding%22&count=50",
    region: "Global",
    category: "Social Media",
    sourceType: "social",
    segment: segments.socialMentions,
    isSocial: true,
  },
  {
    id: "techcrunch-startups",
    name: "TechCrunch Startups",
    feedUrl: "https://techcrunch.com/category/startups/feed/",
    region: "Global",
    category: "Startup",
    sourceType: "startup",
    segment: segments.internationalStartup,
  },
  {
    id: "inc42",
    name: "Inc42",
    feedUrl: "https://inc42.com/feed/",
    region: "India",
    category: "Ecosystem",
    sourceType: "startup",
    segment: segments.indiaStartup,
  },
  {
    id: "yourstory",
    name: "YourStory",
    feedUrl: "https://yourstory.com/feed",
    region: "India",
    category: "Ecosystem",
    sourceType: "startup",
    segment: segments.indiaStartup,
  },
  {
    id: "entrackr",
    name: "Entrackr",
    feedUrl: "https://entrackr.com/rss",
    region: "India",
    category: "Funding",
    sourceType: "startup",
    segment: segments.indiaStartup,
  },
  {
    id: "eu-startups",
    name: "EU-Startups",
    feedUrl: "https://www.eu-startups.com/feed/",
    region: "Europe",
    category: "Ecosystem",
    sourceType: "startup",
    segment: segments.internationalStartup,
  },
  {
    id: "sifted",
    name: "Sifted",
    feedUrl: "https://sifted.eu/feed",
    region: "Europe",
    category: "Industry",
    sourceType: "industry",
    segment: segments.internationalStartup,
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
  "ani",
  "reuters",
  "bbc",
];

const startupKeralaKeywords = [
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

const socialPlatforms = [
  "instagram",
  "linkedin",
  "facebook",
  "youtube",
  "twitter",
  " x ",
  "threads",
  "reddit",
  "hacker news",
  "ycombinator",
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

function normalizeTitle(value) {
  return value
    .toLowerCase()
    .replace(/&nbsp;/g, " ")
    .replace(/[']/g, "")
    .replace(/\s+[-|]\s+[^-|]{2,80}$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function articleDedupeKeys(article) {
  const titleKey = normalizeTitle(article.title);
  const keys = [article.id];
  if (titleKey.length >= 12) {
    keys.push(`title:${titleKey}`);
  }
  return keys;
}

function articlePriority(article) {
  const publishedAt = new Date(article.publishedAt).getTime();
  return (
    (article.isSocial ? 0 : 1000) +
    (article.segment === segments.startupKerala ? 250 : 0) +
    (article.isTraditional ? 100 : 0) +
    (article.isKsum ? 50 : 0) +
    Math.floor((Number.isNaN(publishedAt) ? 0 : publishedAt) / 100000000)
  );
}

function mergeArticle(primary, duplicate) {
  return {
    ...primary,
    isKsum: primary.isKsum || duplicate.isKsum,
    isTraditional: primary.isTraditional || duplicate.isTraditional,
  };
}

function upsertSeenArticle(seen, article) {
  const keys = articleDedupeKeys(article);
  const duplicate = keys.map((key) => seen.get(key)).find(Boolean);

  if (!duplicate) {
    for (const key of keys) seen.set(key, article);
    return;
  }

  const preferred =
    articlePriority(article) > articlePriority(duplicate)
      ? mergeArticle(article, duplicate)
      : mergeArticle(duplicate, article);
  Object.assign(duplicate, preferred);
  for (const key of keys) seen.set(key, duplicate);
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

function isKsumArticle(source, title, summary) {
  const haystack = `${title} ${summary}`.toLowerCase();
  return Boolean(source.isKsum) || startupKeralaKeywords.some((keyword) => haystack.includes(keyword));
}

function isTraditionalArticle(source, sourceName, url) {
  if (source.isTraditional || source.sourceType === "traditional") return true;
  const haystack = `${sourceName} ${url}`.toLowerCase();
  return traditionalPublishers.some((publisher) => haystack.includes(publisher));
}

function socialPlatformFor(source, title, summary, sourceName, url) {
  const haystack = ` ${title} ${summary} ${sourceName} ${url} `.toLowerCase();
  if (source.isSocial) {
    const platform = socialPlatforms.find((item) => haystack.includes(item));
    return platform ? platform.trim().toUpperCase() : "SOCIAL";
  }
  const platform = socialPlatforms.find((item) => haystack.includes(item));
  return platform ? platform.trim().toUpperCase() : "";
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
      const isKsum = isKsumArticle(source, title, summary);
      const socialPlatform = socialPlatformFor(source, title, summary, sourceName, canonicalUrl);

      return {
        id: canonicalUrl.toLowerCase(),
        title,
        url,
        canonicalUrl,
        sourceName,
        sourceFeedId: source.id,
        sourceType: source.sourceType,
        segment: source.segment,
        region: source.region,
        category: source.category,
        summary: summary.slice(0, 500),
        publishedAt,
        publishedDay: dayInIndia(publishedDate),
        publishedMonth: monthInIndia(publishedDate),
        isKsum,
        isTraditional: isTraditionalArticle(source, sourceName, canonicalUrl),
        isSocial: Boolean(source.isSocial || socialPlatform),
        socialPlatform,
      };
    })
    .filter((article) => {
      if (!article) return false;
      return !source.requireStartupKeralaKeyword || article.isKsum;
    });
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
        upsertSeenArticle(seen, article);
      }
    } catch (error) {
      failures.push({
        source: source.name,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const articles = Array.from(new Set(seen.values())).sort(
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

  const bySegment = {
    internationalStartup: articles.filter(
      (article) => article.segment === segments.internationalStartup
    ),
    internationalGeneral: articles.filter(
      (article) => article.segment === segments.internationalGeneral
    ),
    indiaStartup: articles.filter((article) => article.segment === segments.indiaStartup),
    indiaNational: articles.filter((article) => article.segment === segments.indiaNational),
    startupKerala: articles.filter(
      (article) =>
        !article.isSocial && (article.segment === segments.startupKerala || article.isKsum)
    ),
    socialMentions: articles.filter(
      (article) => article.segment === segments.socialMentions || article.isSocial
    ),
  };

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceCount: sources.length,
    failures,
    segments: bySegment,
    stats: {
      todayCount: articles.filter((article) => article.publishedDay === today).length,
      monthCount: articles.filter((article) => article.publishedMonth === month).length,
      ksumCount: bySegment.startupKerala.length,
      socialCount: bySegment.socialMentions.length,
      traditionalCount: articles.filter((article) => article.isTraditional).length,
      totalCount: articles.length,
    },
    dailyCounts: days.map((day) => ({ day, count: dailyMap.get(day) ?? 0 })),
    categoryCounts: countBy(articles.filter((article) => article.publishedMonth === month), "category"),
    regionCounts: countBy(articles.filter((article) => article.publishedMonth === month), "region"),
    recentArticles: articles.slice(0, 80),
    ksumArticles: bySegment.startupKerala.slice(0, 80),
    socialArticles: bySegment.socialMentions.slice(0, 80),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
  await writeFile(
    outputScriptPath,
    `window.__NEWS_DATA__ = ${JSON.stringify(payload)};\n`
  );
  console.log(
    `Wrote ${payload.stats.totalCount} articles, ${payload.stats.ksumCount} Startup Kerala records, ${payload.stats.socialCount} social records to ${outputPath}`
  );
  if (failures.length > 0) {
    console.warn(`Feed failures: ${failures.map((item) => item.source).join(", ")}`);
  }
}

await main();

export type SourceType = "startup" | "industry" | "traditional" | "search";

export type NewsSource = {
  id: string;
  name: string;
  feedUrl: string;
  region: string;
  category: string;
  language?: string;
  sourceType: SourceType;
  isKsum?: boolean;
  isTraditional?: boolean;
};

function googleNewsSearch(
  query: string,
  options: { ceid: string; gl: string; hl: string }
) {
  const params = new URLSearchParams({
    ceid: options.ceid,
    gl: options.gl,
    hl: options.hl,
    q: query,
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

export const NEWS_SOURCES: NewsSource[] = [
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

export const KSUM_SEARCH_LINKS = [
  {
    label: "Google News: Kerala Startup Mission",
    url: "https://news.google.com/search?q=%22Kerala%20Startup%20Mission%22",
  },
  {
    label: "Google News: KSUM",
    url: "https://news.google.com/search?q=KSUM%20startup",
  },
  {
    label: "Traditional media: KSUM in Kerala press",
    url: "https://news.google.com/search?q=%22Kerala%20Startup%20Mission%22%20Kerala%20Malayalam",
  },
];

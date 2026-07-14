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
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-ksum-programs",
    name: "KSUM Programs and Events Search",
    feedUrl: googleNewsSearch(
      'KSUM startup OR "Kerala Startup Mission" incubator OR "Kerala Startup Mission" accelerator OR "Kerala Startup Mission" programme OR "Kerala Startup Mission" event when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "KSUM",
    sourceType: "search",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-startup-funding",
    name: "Kerala Startup Funding Search",
    feedUrl: googleNewsSearch(
      '"Kerala startup funding" OR "Kerala startup raises" OR "Kerala-based startup" funding OR "Kochi startup" funding OR "Trivandrum startup" funding when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Funding",
    sourceType: "search",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-startup-cities",
    name: "Kerala Startup City Hubs Search",
    feedUrl: googleNewsSearch(
      '"Kochi startup" OR "Thiruvananthapuram startup" OR "Trivandrum startup" OR "Kozhikode startup" OR "Calicut startup" OR "Thrissur startup" OR "Malappuram startup" when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Startup Kerala",
    sourceType: "search",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-innovation-hubs",
    name: "Kerala Innovation Hubs Search",
    feedUrl: googleNewsSearch(
      '"Technopark startup" OR "Infopark startup" OR "Cyberpark startup" OR "Maker Village" OR "Kerala IEDC" OR "IEDC Kerala" OR "K-DISC" startup when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Ecosystem",
    sourceType: "search",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-startup-policy",
    name: "Kerala Startup Policy and Grants Search",
    feedUrl: googleNewsSearch(
      '"Kerala startup policy" OR "Kerala innovation grant" OR "Kerala entrepreneurship" OR "Kerala startup scheme" OR "Kerala startup grant" when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Policy",
    sourceType: "search",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-regional-press",
    name: "Kerala Regional Startup Press Search",
    feedUrl: googleNewsSearch(
      'Kerala startup Malayalam OR KSUM Malayalam OR "Kerala Startup Mission" Malayalam OR "Kerala startup" Manorama OR "Kerala startup" Mathrubhumi OR "Kerala startup" Asianet when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Regional Press",
    sourceType: "traditional",
    isKsum: true,
    isTraditional: true,
  },
  {
    id: "google-kerala-sector-startups",
    name: "Kerala Sector Startup Search",
    feedUrl: googleNewsSearch(
      '"Kerala fintech startup" OR "Kerala healthtech startup" OR "Kerala agritech startup" OR "Kerala AI startup" OR "Kerala robotics startup" OR "Kerala deeptech startup" when:45d',
      { ceid: "IN:en", gl: "IN", hl: "en-IN" }
    ),
    region: "Kerala",
    category: "Startup Kerala",
    sourceType: "search",
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
    url: "https://news.google.com/search?q=KSUM%20startup%20Kerala",
  },
  {
    label: "Google News: Kerala startup funding",
    url: "https://news.google.com/search?q=%22Kerala%20startup%20funding%22%20OR%20%22Kerala-based%20startup%22",
  },
  {
    label: "Google News: Kerala startup hubs",
    url: "https://news.google.com/search?q=%22Kochi%20startup%22%20OR%20%22Technopark%20startup%22%20OR%20%22Infopark%20startup%22%20OR%20%22Maker%20Village%22",
  },
  {
    label: "Traditional media: KSUM in Kerala press",
    url: "https://news.google.com/search?q=%22Kerala%20Startup%20Mission%22%20OR%20KSUM%20Kerala%20Malayalam%20startup",
  },
];

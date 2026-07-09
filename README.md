# Global Startup News Tracker

A Vinext/React dashboard for tracking startup ecosystem news, industry articles,
and Kerala Startup Mission mentions across web and traditional media sources.

## What It Tracks

- Global startup and venture funding coverage
- India startup ecosystem coverage
- Industry startup feeds from TechCrunch, Inc42, YourStory, Entrackr, Sifted,
  and EU-Startups
- Kerala Startup Mission and KSUM mentions from Google News RSS searches
- Traditional-media mentions detected from source names and KSUM searches

## Backend Refresh

The Worker exports a scheduled handler and `vite.config.ts` declares:

```cron
30 4 * * *
```

That is 04:30 UTC, which is 10:00 IST. The same ingestion can be triggered
manually:

```bash
curl -X POST http://localhost:3000/api/refresh
```

Set `NEWS_REFRESH_SECRET` to require `x-refresh-secret` or `?secret=` for
manual refresh calls.

## Local Development

```bash
pnpm install
pnpm dev
pnpm db:generate
pnpm build
```

The dashboard reads from D1 through the `DB` binding declared in
`.openai/hosting.json`. Runtime initialization also creates the tables locally,
while generated Drizzle migrations are packaged for hosting.

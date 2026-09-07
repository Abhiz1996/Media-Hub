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

The GitHub Pages workflow rebuilds the public dashboard data on push, on manual
dispatch, and on an hourly safety-net schedule from 07:55 to 21:55 IST:

```cron
25 2-16 * * *
```

GitHub cron uses UTC, so the schedule above runs at 02:25-16:25 UTC. The extra
morning runs give the dashboard multiple chances to refresh before 10:00 IST.

For the server-backed Worker version, `vite.config.ts` declares the same cron
schedule and the scheduled handler runs the ingestion pipeline. The same
ingestion can be triggered manually:

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

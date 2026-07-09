import { displayInIndia } from "@/lib/date";
import { KSUM_SEARCH_LINKS } from "@/lib/news-sources";
import {
  getDashboardSnapshot,
  type DashboardArticle,
  type DashboardSnapshot,
} from "@/lib/news-store";
import { getRuntimeDb } from "@/lib/runtime";

export const dynamic = "force-dynamic";

const emptySnapshot: DashboardSnapshot = {
  categoryCounts: [],
  dailyCounts: [],
  ksumArticles: [],
  lastRun: null,
  recentArticles: [],
  regionCounts: [],
  stats: {
    ksumCount: 0,
    monthCount: 0,
    sourceCount: 0,
    todayCount: 0,
    totalCount: 0,
    traditionalCount: 0,
  },
};

async function loadSnapshot() {
  try {
    return await getDashboardSnapshot(getRuntimeDb());
  } catch {
    return emptySnapshot;
  }
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "news.google.com";
  }
}

function SourceIcon({ article }: { article: DashboardArticle }) {
  const domain = domainFromUrl(article.canonicalUrl || article.url);
  return (
    <img
      alt={`${article.sourceName} icon`}
      className="h-9 w-9 rounded-md border border-slate-200 bg-white p-1"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
    />
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
        {value.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ArticleRow({ article }: { article: DashboardArticle }) {
  return (
    <a
      className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 sm:grid-cols-[auto_1fr_auto]"
      href={article.url}
      rel="noreferrer"
      target="_blank"
    >
      <SourceIcon article={article} />
      <div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span>{article.sourceName}</span>
          <span>{article.region}</span>
          <span>{article.category}</span>
          {article.isTraditional ? <span>Traditional media</span> : null}
        </div>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">
          {article.title}
        </p>
        {article.summary ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
            {article.summary}
          </p>
        ) : null}
      </div>
      <p className="text-xs text-slate-500 sm:text-right">
        {displayInIndia(article.publishedAt)}
      </p>
    </a>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="px-4 py-10 text-center text-sm text-slate-500">{label}</div>
  );
}

export default async function Home() {
  const snapshot = await loadSnapshot();
  const maxDailyCount = Math.max(
    1,
    ...snapshot.dailyCounts.map((item) => item.count)
  );
  const latestRun = snapshot.lastRun;

  return (
    <main className="min-h-screen bg-[#f7f8f3] text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              Startup ecosystem intelligence
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Global Startup News Tracker
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Daily startup, industry, and Kerala Startup Mission coverage,
              refreshed by the backend every morning at 10:00 IST.
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 lg:min-w-80">
            <p className="font-semibold">Backend refresh</p>
            <p className="mt-1 text-xs leading-5">
              {latestRun
                ? `${latestRun.status} at ${displayInIndia(
                    latestRun.finishedAt ?? latestRun.startedAt
                  )}`
                : "Waiting for the first ingestion run"}
            </p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Metric
            detail="Published today"
            label="Today"
            value={snapshot.stats.todayCount}
          />
          <Metric
            detail="Current month"
            label="This month"
            value={snapshot.stats.monthCount}
          />
          <Metric
            detail="All tracked KSUM links"
            label="KSUM"
            value={snapshot.stats.ksumCount}
          />
          <Metric
            detail="Publisher names"
            label="Sources"
            value={snapshot.stats.sourceCount}
          />
          <Metric
            detail="Detected press links"
            label="Traditional"
            value={snapshot.stats.traditionalCount}
          />
          <Metric
            detail="Stored articles"
            label="Total"
            value={snapshot.stats.totalCount}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.65fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold">Startup ecosystem feed</h2>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                {snapshot.recentArticles.length.toLocaleString("en-IN")} latest
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {snapshot.recentArticles.length > 0 ? (
                snapshot.recentArticles
                  .slice(0, 12)
                  .map((article) => (
                    <ArticleRow article={article} key={article.id} />
                  ))
              ) : (
                <EmptyState label="No articles have been ingested yet." />
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-base font-semibold">Last 14 days</h2>
              </div>
              <div className="space-y-3 p-4">
                {snapshot.dailyCounts.map((item) => (
                  <div
                    className="grid grid-cols-[5.8rem_1fr_2.5rem] items-center gap-3 text-xs"
                    key={item.day}
                  >
                    <span className="font-medium text-slate-500">
                      {item.day.slice(5)}
                    </span>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.max(
                            4,
                            (item.count / maxDailyCount) * 100
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="text-right font-semibold text-slate-700">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-base font-semibold">Category mix</h2>
              </div>
              <div className="space-y-4 p-4">
                {snapshot.categoryCounts.length > 0 ? (
                  snapshot.categoryCounts.map((item) => (
                    <div key={item.category}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {item.category}
                        </span>
                        <span className="text-slate-500">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-violet-500"
                          style={{
                            width: `${Math.min(item.count * 4, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No category data yet.</p>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">
                Kerala Startup Mission coverage
              </h2>
              <p className="text-xs text-slate-500">
                Web, business press, and regional media searches
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {snapshot.ksumArticles.length > 0 ? (
                snapshot.ksumArticles
                  .slice(0, 10)
                  .map((article) => (
                    <ArticleRow article={article} key={article.id} />
                  ))
              ) : (
                <EmptyState label="No KSUM mentions have been stored yet." />
              )}
            </div>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-base font-semibold">KSUM search links</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {KSUM_SEARCH_LINKS.map((link) => (
                <a
                  className="block px-4 py-4 text-sm font-medium leading-6 text-slate-800 transition hover:bg-slate-50"
                  href={link.url}
                  key={link.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="border-t border-slate-200 p-4">
              <h3 className="text-sm font-semibold">Region mix</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.regionCounts.length > 0 ? (
                  snapshot.regionCounts.map((item) => (
                    <span
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                      key={item.region}
                    >
                      {item.region}: {item.count}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">
                    No region data yet.
                  </span>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

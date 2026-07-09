import { runNewsIngestion } from "@/lib/news-ingestion";
import { getRuntimeDb, getRuntimeEnv } from "@/lib/runtime";

function isAuthorized(request: Request) {
  const secret = getRuntimeEnv().NEWS_REFRESH_SECRET;
  if (!secret) {
    return true;
  }

  const headerToken = request.headers.get("x-refresh-secret");
  const urlToken = new URL(request.url).searchParams.get("secret");
  return headerToken === secret || urlToken === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized refresh request" }, { status: 401 });
  }

  try {
    const summary = await runNewsIngestion(getRuntimeDb(), { trigger: "manual" });
    return Response.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

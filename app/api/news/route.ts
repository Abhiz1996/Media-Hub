import { getDashboardSnapshot } from "@/lib/news-store";
import { getRuntimeDb } from "@/lib/runtime";

export async function GET() {
  try {
    const snapshot = await getDashboardSnapshot(getRuntimeDb());
    return Response.json(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return Response.json({ error: message }, { status: 500 });
  }
}

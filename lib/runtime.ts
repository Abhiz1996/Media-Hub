import { env } from "cloudflare:workers";

type RuntimeEnv = {
  DB?: D1Database;
  NEWS_REFRESH_SECRET?: string;
};

export function getRuntimeEnv() {
  return env as RuntimeEnv;
}

export function getRuntimeDb() {
  const runtimeEnv = getRuntimeEnv();
  if (!runtimeEnv.DB) {
    throw new Error("D1 binding DB is not available.");
  }
  return runtimeEnv.DB;
}

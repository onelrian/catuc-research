import serverless from "serverless-http";
import app from "../../../api-server/src/app";
import { type Config } from "@netlify/functions";

const handler = serverless(app);

function normalizeNetlifyPath(path: string | undefined): string | undefined {
  if (!path) return path;

  const netlifyPrefix = "/.netlify/functions";
  if (!path.startsWith(netlifyPrefix)) return path;

  const normalized = path.slice(netlifyPrefix.length);
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export default async function api(event: any, context: any) {
  const normalizedEvent = { ...event };

  normalizedEvent.rawPath = normalizeNetlifyPath(event.rawPath);
  normalizedEvent.path = normalizeNetlifyPath(event.path);
  normalizedEvent.requestPath = normalizeNetlifyPath(event.requestPath);

  return handler(normalizedEvent, context);
}

export const config: Config = {
  path: "/api/*",
};

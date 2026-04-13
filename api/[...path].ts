import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/dist/app.mjs";

function normalizeApiPath(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith("/api")) return url;
  return url === "/" ? "/api" : `/api${url}`;
}

export default function handler(
  req: IncomingMessage & { url?: string | undefined },
  res: ServerResponse,
) {
  req.url = normalizeApiPath(req.url);
  return app(req as never, res as never);
}

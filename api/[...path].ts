import type { IncomingMessage, ServerResponse } from "node:http";
import app from "../artifacts/api-server/src/app";

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
  const requestHandler = app as unknown as (
    req: IncomingMessage & { url?: string | undefined },
    res: ServerResponse,
  ) => unknown;

  return requestHandler(req, res);
}

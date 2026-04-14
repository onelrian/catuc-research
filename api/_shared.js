function buildApiUrl(req) {
  const query = req.query || {};

  // Vercel passes catch-all segments in req.query.path (array) or req.query["...path"]
  const rawPath = query.path ?? query["...path"];
  const pathSegments = Array.isArray(rawPath)
    ? rawPath.filter(Boolean)
    : typeof rawPath === "string" && rawPath
    ? [rawPath]
    : [];

  // Strip internal Vercel routing params from the query string
  const parsedUrl = new URL(req.url || "/", "http://localhost");
  parsedUrl.searchParams.delete("path");
  parsedUrl.searchParams.delete("...path");

  // Express is mounted at /api, so we must produce /api/<segments>
  const pathname =
    pathSegments.length > 0 ? `/api/${pathSegments.join("/")}` : "/api";

  const rebuilt = `${pathname}${parsedUrl.search}`;
  console.log(
    `[Vercel Shim] ${req.method} ${req.url} -> Express: ${rebuilt}`
  );
  return rebuilt;
}

let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = import("../artifacts/api-server/dist/app.mjs").then(
      (mod) => mod.default
    );
  }
  return appPromise;
}

function createHandler() {
  return async function handler(req, res) {
    req.url = buildApiUrl(req);
    const app = await getApp();
    return new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("error", reject);
      app(req, res);
    });
  };
}

module.exports = { createHandler };

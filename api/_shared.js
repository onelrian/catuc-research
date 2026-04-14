function buildApiUrl(req, basePath = "") {
  const query = req.query || {};

  // Vercel passes catch-all segments in req.query.path (array) or req.query["...path"]
  const rawPath = query.path ?? query["...path"];
  const pathSegments = Array.isArray(rawPath)
    ? rawPath.filter(Boolean)
    : typeof rawPath === "string" && rawPath
    ? [rawPath]
    : [];

  // Rebuild query string without internal Vercel routing params
  const parsedUrl = new URL(req.url || "/", "http://localhost");
  parsedUrl.searchParams.delete("path");
  parsedUrl.searchParams.delete("...path");

  // Build pathname: /api/<basePath>/<catch-all segments>
  const parts = ["api", basePath, ...pathSegments].filter(Boolean);
  const pathname = "/" + parts.join("/");

  const rebuilt = `${pathname}${parsedUrl.search}`;
  console.log(`[Vercel Shim] ${req.method} ${req.url} -> Express: ${rebuilt}`);
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

function createHandler(basePath = "") {
  return async function handler(req, res) {
    req.url = buildApiUrl(req, basePath);
    const app = await getApp();
    return new Promise((resolve, reject) => {
      res.on("finish", resolve);
      res.on("error", reject);
      app(req, res);
    });
  };
}

module.exports = { createHandler };

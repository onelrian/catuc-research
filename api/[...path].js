function getPathSegments(query) {
  const value = query?.path;

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [];
}

function normalizeApiPath(req) {
  const currentUrl = new URL(req.url || "/", "http://localhost");

  if (currentUrl.pathname.startsWith("/api")) {
    return `${currentUrl.pathname}${currentUrl.search}`;
  }

  const pathSegments = getPathSegments(req.query);
  const normalizedPath =
    pathSegments.length > 0
      ? `/api/${pathSegments.join("/")}`
      : currentUrl.pathname === "/"
        ? "/api"
        : `/api${currentUrl.pathname}`;

  return `${normalizedPath}${currentUrl.search}`;
}

let appPromise;

async function getApp() {
  if (!appPromise) {
    appPromise = import("../artifacts/api-server/dist/app.mjs").then(
      (mod) => mod.default,
    );
  }

  return appPromise;
}

module.exports = async function handler(req, res) {
  req.url = normalizeApiPath(req);
  const app = await getApp();
  return app(req, res);
};

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

function buildApiUrl(req, basePath = "") {
  const currentUrl = new URL(req.url || "/", "http://localhost");
  const pathSegments = getPathSegments(req.query);
  const normalizedBasePath = basePath.replace(/^\/+|\/+$/g, "");

  const pathnameParts = ["/api"];
  if (normalizedBasePath) {
    pathnameParts.push(normalizedBasePath);
  }
  if (pathSegments.length > 0) {
    pathnameParts.push(pathSegments.join("/"));
  }

  const pathname = pathnameParts.join("/").replace(/\/+/g, "/");
  return `${pathname}${currentUrl.search}`;
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

function createHandler(basePath = "") {
  return async function handler(req, res) {
    req.url = buildApiUrl(req, basePath);
    const app = await getApp();
    return app(req, res);
  };
}

module.exports = { createHandler };

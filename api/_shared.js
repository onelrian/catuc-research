function buildApiUrl(req) {
  const currentUrl = new URL(req.url || "/", "http://localhost");
  return `${currentUrl.pathname}${currentUrl.search}`;
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

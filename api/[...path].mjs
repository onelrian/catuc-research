function normalizeApiPath(url) {
  if (!url) return url;
  if (url.startsWith("/api")) return url;
  return url === "/" ? "/api" : `/api${url}`;
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

export default async function handler(req, res) {
  req.url = normalizeApiPath(req.url);
  const app = await getApp();
  return app(req, res);
}

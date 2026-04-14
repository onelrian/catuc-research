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
    const app = await getApp();
    const originalUrl = req.url;
    req.url = buildApiUrl(req, basePath);
    
    console.log(`[Vercel API] ${req.method} ${originalUrl} -> Express path: ${req.url}`);
    
    // Ensure the lambda stays alive until Express finishes the response
    return new Promise((resolve, reject) => {
      res.on("finish", () => {
        console.log(`[Vercel API] Response finished with ${res.statusCode}`);
        resolve();
      });
      res.on("error", (err) => {
        console.error(`[Vercel API] Response error:`, err);
        reject(err);
      });
      app(req, res);
    });
  };
}

module.exports = { createHandler };

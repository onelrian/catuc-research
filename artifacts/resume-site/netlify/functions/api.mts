// Singleton to track if seeding has been performed in this instance
let isSeeded = false;

const handler = serverless(app);

export default async (req: Request, context: Context) => {
  if (process.env.AUTO_SEED === "true" && !isSeeded) {
    console.log("🚀 AUTO_SEED is enabled. Starting initial database population...");
    try {
      await seedCatucQuestionnaire();
      console.log("✅ Initial database population successful.");
      isSeeded = true;
    } catch (error) {
      console.error("❌ Database population failed:", error);
      // We don't throw here to allow the app to boot even if seeding fails, 
      // but the error will be visible in Netlify logs.
    }
  }

  return handler(req, context);
};

export const config: Config = {
  path: "/api/*",
};

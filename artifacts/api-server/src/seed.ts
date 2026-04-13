import { seedCatucQuestionnaire } from "./lib/seed-catuc";
import { logger } from "./lib/logger";

console.log("🚀 Starting standalone seeding script...");

seedCatucQuestionnaire()
  .then(() => {
    console.log("✅ Seeding complete!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });

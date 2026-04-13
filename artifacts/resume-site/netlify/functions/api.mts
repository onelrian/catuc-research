import serverless from "serverless-http";
import app from "../../../api-server/src/app";
import { seedCatucQuestionnaire } from "../../../api-server/src/lib/seed-catuc";
import { type Config } from "@netlify/functions";

// Seed the CATUC questionnaire if requested via environment variable
if (process.env.AUTO_SEED === "true") {
  seedCatucQuestionnaire().catch(console.error);
}

export default serverless(app);

export const config: Config = {
  path: "/api/*",
};

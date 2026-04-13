import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please ensure environment variables are configured correctly in the Netlify UI.");
}

// Log a masked version of the URL to Netlify logs for debugging purposes
const maskedUrl = process.env.DATABASE_URL.replace(/:\/\/.*@/, "://****@");
console.log(`📡 Connecting to database at ${maskedUrl}`);

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql, schema });

export * from "./schema";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema/index";

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
const databaseUrl = process.env.DATABASE_URL?.trim();

// Aggressively check for placeholders or missing URLs during build time
const isPlaceholder = !databaseUrl || 
                      databaseUrl === "" || 
                      databaseUrl === "your_postgresql_url_here" || 
                      databaseUrl.includes("user:pass@localhost");

/**
 * Build-safe Neon Client.
 * If we are in the build phase and don't have a valid DB URL,
 * we return a mock client that returns empty sets instead of throwing or trying to connect.
 */
function getNeonClient() {
  if (isBuildTime && isPlaceholder) {
    // Return a mock function that satisfies the neon client signature
    return async () => ([]);
  }
  
  if (!databaseUrl || isPlaceholder) {
    if (process.env.NODE_ENV === "production" && !isBuildTime) {
      throw new Error("Missing or invalid DATABASE_URL in production environment.");
    }
    // Fallback for non-production local dev if URL is missing
    return async () => ([]);
  }

  return neon(databaseUrl);
}

const sql = getNeonClient();

/**
 * Drizzle Database instance.
 * Build-safe: Uses a mock client during Next.js build phase
 * to prevent database connection failures from blocking static optimization.
 */
export const db = drizzle({ client: sql as any, schema });

export * from "./schema";
export { schema };

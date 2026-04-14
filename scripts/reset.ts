import { db } from "./db";
import { surveysTable, questionsTable, responsesTable, answersTable, usersTable, accountsTable, sessionsTable } from "./schema";
import { sql } from "drizzle-orm";

async function reset() {
  console.log("⏳ Resetting database...");
  
  try {
    // Truncate all tables with CASCADE to ensure a clean slate
    await db.execute(sql`TRUNCATE TABLE ${answersTable}, ${responsesTable}, ${questionsTable}, ${surveysTable}, ${sessionsTable}, ${accountsTable}, ${usersTable} CASCADE`);
    
    console.log("✅ Database reset successfully.");
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    process.exit(1);
  }
}

reset();

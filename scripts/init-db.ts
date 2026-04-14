import { db } from "./db";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function init() {
  console.log("🚀 Initializing database...");

  try {
    // 1. Drop existing tables if they exist
    console.log("🗑️  Cleaning up previous state...");
    const tables = ["answers", "responses", "questions", "surveys", "session", "account", "user", "verificationToken"];
    for (const table of tables) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE`));
    }
    console.log("✅ Database cleared.");

    // 2. Read and Execute Migration SQL
    console.log("📄 Applying schema from migration...");
    const sqlPath = path.join(process.cwd(), "drizzle", "0000_even_big_bertha.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    
    // Split into individual statements if using statement-breakpoint or just run if single block
    // Drizzle-kit exports use --> statement-breakpoint
    const statements = sqlContent.split("--> statement-breakpoint");
    
    for (const statement of statements) {
      const cleanStatement = statement.trim();
      if (cleanStatement) {
        await db.execute(sql.raw(cleanStatement));
      }
    }
    console.log("✅ Schema applied.");

    // 3. Import and run seed
    console.log("🌱 Starting seed...");
    // We already have lib/seed.ts but we can just import the logic or run it as a separate process
    // To keep it simple, I'll just run lib/seed.ts after this script
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
}

init();

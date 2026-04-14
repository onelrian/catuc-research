import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

// Load .env.local manually
try {
  const envFile = readFileSync(".env.local", "utf8");
  for (const line of envFile.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
} catch {}

// Read admin emails from env
const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
const ADMIN_EMAILS = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

async function makeAdmins() {
  if (ADMIN_EMAILS.length === 0) {
    console.error("❌  ADMIN_EMAILS env variable is empty or not set.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL!);

  // First, check what columns actually exist on the user table
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'user'`;
  console.log("Columns in 'user' table:", cols.map(c => c.column_name));

  console.log("Admin emails from env:", ADMIN_EMAILS);

  for (const email of ADMIN_EMAILS) {
    const check = await sql`SELECT id, email FROM "user" WHERE email = ${email}`;
    
    if (check.length === 0) {
      console.log(`⚠️  ${email} — not found (user must log in at least once first)`);
      continue;
    }

    await sql`UPDATE "user" SET "isAdmin" = true WHERE email = ${email}`;
    const verify = await sql`SELECT "isAdmin" FROM "user" WHERE email = ${email}`;
    console.log(`✅  ${email} → isAdmin: ${verify[0].isAdmin}`);
  }

  process.exit(0);
}

makeAdmins().catch((e) => { console.error(e); process.exit(1); });

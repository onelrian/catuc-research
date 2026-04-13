import { Router } from "express";
import { db } from "@workspace/db";
import { resumeTable, viewsTable, resumeUpdateSchema } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/resume", async (req, res) => {
  try {
    const rows = await db.select().from(resumeTable).limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }
    const r = rows[0];
    return res.json({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get resume");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/resume", async (req, res) => {
  try {
    const parsed = resumeUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const rows = await db.select().from(resumeTable).limit(1);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const updated = await db
      .update(resumeTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(resumeTable.id, rows[0].id))
      .returning();

    const r = updated[0];
    return res.json({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update resume");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/views", async (req, res) => {
  try {
    const referrer = req.body?.referrer ?? null;

    const ipRaw = req.ip ?? "";
    const { createHash } = await import("crypto");
    const ipHash = ipRaw ? createHash("sha256").update(ipRaw).digest("hex").slice(0, 16) : null;

    const [view] = await db.insert(viewsTable).values({ referrer, ipHash }).returning();
    return res.status(201).json({
      ...view,
      viewedAt: view.viewedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to record view");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/summary", async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(viewsTable);

    const [todayResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(viewsTable)
      .where(sql`viewed_at >= ${todayStart.toISOString()}`);

    const [weekResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(viewsTable)
      .where(sql`viewed_at >= ${weekStart.toISOString()}`);

    const [monthResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(viewsTable)
      .where(sql`viewed_at >= ${monthStart.toISOString()}`);

    const [referrerResult] = await db
      .select({ count: sql<number>`cast(count(distinct referrer) as int)` })
      .from(viewsTable);

    const lastViewRows = await db
      .select({ viewedAt: viewsTable.viewedAt })
      .from(viewsTable)
      .orderBy(desc(viewsTable.viewedAt))
      .limit(1);

    return res.json({
      totalViews: totalResult.count,
      viewsToday: todayResult.count,
      viewsThisWeek: weekResult.count,
      viewsThisMonth: monthResult.count,
      uniqueReferrers: referrerResult.count,
      lastViewedAt: lastViewRows.length > 0 ? lastViewRows[0].viewedAt.toISOString() : null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-views", async (req, res) => {
  try {
    const views = await db
      .select()
      .from(viewsTable)
      .orderBy(desc(viewsTable.viewedAt))
      .limit(20);

    return res.json(
      views.map((v) => ({
        ...v,
        viewedAt: v.viewedAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get recent views");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

import { db } from "@/lib/db";
import { surveysTable, responsesTable } from "@/lib/schema";
import { desc, sql, inArray } from "drizzle-orm";
import { SurveyManagementClient } from "./survey-management-client";

export const dynamic = "force-dynamic";

/**
 * Survey/Instrument Management Dashboard.
 * Lists all research tools and their participation metrics.
 */
export default async function SurveyManagementPage() {
  const surveys = (await db
    .select()
    .from(surveysTable)
    .orderBy(desc(surveysTable.createdAt))) ?? [];

  const ids = surveys.map((s) => s.id);
  let countMap: Record<number, number> = {};
  
  if (ids.length > 0) {
    const counts = (await db
      .select({
        surveyId: responsesTable.surveyId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(responsesTable)
      .where(inArray(responsesTable.surveyId, ids))
      .groupBy(responsesTable.surveyId)) ?? [];

    countMap = Object.fromEntries(counts.map((c) => [c.surveyId, (c as any).count]));
  }

  const enrichedSurveys = surveys.map((s) => ({
    ...s,
    responseCount: countMap[s.id] ?? 0,
  }));

  return <SurveyManagementClient initialSurveys={enrichedSurveys} />;
}

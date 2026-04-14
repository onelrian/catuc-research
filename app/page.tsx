import { Layout } from "@/components/layout";
import { db } from "@/lib/db";
import { surveysTable, responsesTable } from "@/lib/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { HeroSection, FeaturesSection, SurveyList } from "@/components/home/client-sections";

export const dynamic = "force-dynamic";

export default async function Home() {
  const surveys = await db
    .select()
    .from(surveysTable)
    .where(eq(surveysTable.isActive, true))
    .orderBy(desc(surveysTable.createdAt));

  const ids = surveys.map((s) => s.id);
  let countMap: Record<number, number> = {};
  
  if (ids.length > 0) {
    const counts = await db
      .select({
        surveyId: responsesTable.surveyId,
        count: sql<number>`cast(count(*) as int)`,
      })
      .from(responsesTable)
      .where(inArray(responsesTable.surveyId, ids))
      .groupBy(responsesTable.surveyId);
    countMap = Object.fromEntries(counts.map((c) => [c.surveyId, c.count]));
  }

  const enrichedSurveys = surveys.map((s) => ({
    ...s,
    responseCount: countMap[s.id] ?? 0,
  }));

  return (
    <Layout>
      <div className="space-y-16 py-8">
        <HeroSection />
        <FeaturesSection />

        <section id="surveys" className="space-y-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-semibold text-foreground tracking-tight">Available Studies</h2>
            <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              {enrichedSurveys.length} Active {enrichedSurveys.length === 1 ? 'Study' : 'Studies'}
            </div>
          </div>

          <SurveyList surveys={enrichedSurveys} />
        </section>
      </div>
    </Layout>
  );
}

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { FileText, Activity, Users, CalendarDays, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { surveysTable, responsesTable } from "@/lib/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { OverviewChart } from "./overview-charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalSurveysResult] = (await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(surveysTable)) ?? [{ count: 0 }];

  const [activeSurveysResult] = (await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(surveysTable)
    .where(eq(surveysTable.isActive, true))) ?? [{ count: 0 }];

  const [totalResponsesResult] = (await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(responsesTable)) ?? [{ count: 0 }];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [responsesTodayResult] = (await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(responsesTable)
    .where(sql`submitted_at >= ${todayStart}`)) ?? [{ count: 0 }];

  const surveys = (await db
    .select()
    .from(surveysTable)
    .orderBy(desc(surveysTable.createdAt))
    .limit(10)) ?? [];
  
  const surveyIds = surveys.map((s) => s.id);

  let recentActivity: any[] = [];
  if (surveyIds.length > 0) {
    const counts = (await db
      .select({
        surveyId: responsesTable.surveyId,
        count: sql<number>`cast(count(*) as int)`,
        lastResponseAt: sql<string>`max(submitted_at)`,
      })
      .from(responsesTable)
      .where(inArray(responsesTable.surveyId, surveyIds))
      .groupBy(responsesTable.surveyId)) ?? [];

    const countMap = Object.fromEntries(counts.map((c) => [c.surveyId, c]));

    recentActivity = surveys.map((s) => ({
      surveyId: s.id,
      surveyTitle: s.title,
      responseCount: countMap[s.id]?.count ?? 0,
      lastResponseAt: countMap[s.id]?.lastResponseAt ?? null,
    }));
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/50">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-foreground tracking-tight">Researcher Dashboard</h1>
          <p className="text-lg text-muted-foreground">Comprehensive overview of academic studies and data collection.</p>
        </div>
        <Link href="/dashboard/surveys">
          <Button size="lg" className="rounded-full px-6 shadow-sm">
            Manage Instruments <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Instruments</CardTitle>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold text-foreground">{totalSurveysResult.count}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-br from-card to-emerald-500/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Studies</CardTitle>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold text-foreground">{activeSurveysResult.count}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-br from-card to-indigo-500/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Responses</CardTitle>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold text-foreground">{totalResponsesResult.count}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-br from-card to-orange-500/5">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Responses Today</CardTitle>
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <CalendarDays className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-serif font-bold text-foreground">{responsesTodayResult.count}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <Card className="lg:col-span-2 flex flex-col rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
            <CardTitle className="text-xl font-serif">Recent Data Collection</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[350px] p-6">
            <OverviewChart data={recentActivity} />
          </CardContent>
        </Card>

        <Card className="flex flex-col rounded-2xl border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
            <CardTitle className="text-xl font-serif">Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border/50">
              {recentActivity.map((activity, i) => (
                <Link key={i} href={`/dashboard/surveys/${activity.surveyId}/results`} className="block group">
                  <div className="p-5 hover:bg-muted/30 transition-colors">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {activity.surveyTitle}
                    </div>
                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-medium text-xs">
                        {activity.responseCount} Responses
                      </span>
                      {activity.lastResponseAt && (
                        <span className="text-muted-foreground text-xs font-medium flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {format(new Date(activity.lastResponseAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                  No active studies found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

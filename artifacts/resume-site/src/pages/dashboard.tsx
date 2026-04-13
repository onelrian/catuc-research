import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetDashboardOverview, getGetDashboardOverviewQueryKey } from "@workspace/api-client-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { FileText, Activity, Users, CalendarDays, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { data: overview, isLoading, error } = useGetDashboardOverview({
    query: { queryKey: getGetDashboardOverviewQueryKey() }
  });

  return (
    <Layout>
      <div className="space-y-10 py-6">
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

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="rounded-2xl">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-10 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error || !overview ? (
          <div className="p-8 text-center border rounded-2xl bg-destructive/5 text-destructive border-destructive/20 shadow-sm">
            <p className="font-medium text-lg">Dashboard Data Unavailable</p>
            <p className="opacity-80 mt-2">Could not retrieve overview statistics. Please check your connection.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-2xl border-border/50 shadow-sm bg-gradient-to-br from-card to-muted/20">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Instruments</CardTitle>
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-serif font-bold text-foreground">{overview.totalSurveys}</div>
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
                  <div className="text-4xl font-serif font-bold text-foreground">{overview.activeSurveys}</div>
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
                  <div className="text-4xl font-serif font-bold text-foreground">{overview.totalResponses}</div>
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
                  <div className="text-4xl font-serif font-bold text-foreground">{overview.responsesToday}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
              <Card className="lg:col-span-2 flex flex-col rounded-2xl border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
                  <CardTitle className="text-xl font-serif">Recent Data Collection</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-[350px] p-6">
                  {overview.recentActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview.recentActivity.slice(0, 5)} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis 
                          dataKey="surveyTitle" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.length > 18 ? val.substring(0, 18) + '...' : val}
                          dy={10}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 500 }}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))', 
                            borderRadius: '0.75rem',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            fontWeight: 500
                          }}
                        />
                        <Bar 
                          dataKey="responseCount" 
                          name="Responses" 
                          fill="hsl(var(--primary))" 
                          radius={[6, 6, 0, 0]} 
                          barSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-medium bg-muted/5 rounded-xl border border-dashed border-border">
                      No response data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col rounded-2xl border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
                  <CardTitle className="text-xl font-serif">Quick Access</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <div className="divide-y divide-border/50">
                    {overview.recentActivity.map((activity, i) => (
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
                    {overview.recentActivity.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground text-sm font-medium">
                        No active studies found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

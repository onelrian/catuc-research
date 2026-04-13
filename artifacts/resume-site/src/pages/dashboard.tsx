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

export default function DashboardPage() {
  const { data: overview, isLoading, error } = useGetDashboardOverview({
    query: { queryKey: getGetDashboardOverviewQueryKey() }
  });

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8 mt-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-serif font-semibold text-primary tracking-tight">Researcher Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your academic studies and responses.</p>
          </div>
          <Link href="/dashboard/surveys">
            <Button>Manage Surveys</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error || !overview ? (
          <div className="p-6 text-center border rounded-lg bg-destructive/5 text-destructive border-destructive/20">
            <p>Error loading dashboard overview.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Surveys</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{overview.totalSurveys}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Active Surveys</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{overview.activeSurveys}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Responses</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{overview.totalResponses}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Responses Today</CardTitle>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{overview.responsesToday}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              <Card className="lg:col-span-2 flex flex-col">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 min-h-[300px]">
                  {overview.recentActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={overview.recentActivity.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="surveyTitle" 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                        />
                        <YAxis 
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                        />
                        <Bar 
                          dataKey="responseCount" 
                          name="Responses" 
                          fill="hsl(var(--primary))" 
                          radius={[4, 4, 0, 0]} 
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No response data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Active Studies</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {overview.recentActivity.map((activity, i) => (
                      <Link key={i} href={`/dashboard/surveys/${activity.surveyId}/results`} className="block group">
                        <div className="p-3 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                          <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">{activity.surveyTitle}</div>
                          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                            <span>{activity.responseCount} responses</span>
                            {activity.lastResponseAt && (
                              <span>Last: {format(new Date(activity.lastResponseAt), "MMM d")}</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                    {overview.recentActivity.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No active studies
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

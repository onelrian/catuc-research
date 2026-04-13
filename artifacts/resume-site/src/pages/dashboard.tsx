import React from "react";
import { 
  useGetDashboardSummary, 
  getGetDashboardSummaryQueryKey,
  useGetRecentViews,
  getGetRecentViewsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Calendar, Clock, Users, Activity } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const { data: recentViews, isLoading: loadingViews } = useGetRecentViews({
    query: { queryKey: getGetRecentViewsQueryKey() }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-foreground">Analytics Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor who is viewing your professional profile.</p>
      </div>

      {loadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summary.totalViews.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Views Today</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summary.viewsToday.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Views This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summary.viewsThisWeek.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Unique Referrers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{summary.uniqueReferrers.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Recent Activity</h2>
      
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {loadingViews ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
              </div>
            ))
          ) : recentViews && recentViews.length > 0 ? (
            recentViews.map((view) => (
              <div key={view.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 p-2 rounded-full shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {view.referrer && view.referrer !== "direct" ? (
                        <span>Referred by <span className="text-primary truncate block sm:inline max-w-[200px]">{view.referrer}</span></span>
                      ) : (
                        "Direct Visit"
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(new Date(view.viewedAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground whitespace-nowrap sm:text-right">
                  {formatDistanceToNow(new Date(view.viewedAt), { addSuffix: true })}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No recent views found.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

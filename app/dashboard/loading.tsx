import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 rounded-2xl">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-12 w-16" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6 rounded-2xl">
          <CardHeader className="p-0 mb-6">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <Skeleton className="h-[300px] w-full" />
        </Card>
        <Card className="p-6 rounded-2xl">
          <CardHeader className="p-0 mb-6">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

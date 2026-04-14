import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function ResultsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 rounded-2xl">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-12 w-16" />
          </Card>
        ))}
      </div>

      <Skeleton className="h-12 w-full max-w-md rounded-xl" />

      <div className="grid gap-8">
        {[1, 2].map((i) => (
          <Card key={i} className="rounded-2xl border">
            <CardHeader className="p-6">
              <Skeleton className="h-8 w-1/2" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

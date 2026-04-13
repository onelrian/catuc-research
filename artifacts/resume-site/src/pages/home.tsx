import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useListSurveys, getListSurveysQueryKey } from "@workspace/api-client-react";

export default function Home() {
  const { data: surveys, isLoading, error } = useListSurveys({ query: { queryKey: getListSurveysQueryKey() } });

  const activeSurveys = surveys?.filter(s => s.isActive) || [];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 mt-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-semibold tracking-tight text-primary">Active Research Studies</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Welcome to the Ashley Research platform. Your participation helps advance our understanding in Business and Management Sciences. Please select a study below to begin.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center border rounded-lg bg-destructive/5 text-destructive border-destructive/20">
            <p>We encountered an error loading the available surveys. Please try again later.</p>
          </div>
        ) : activeSurveys.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-muted/30">
            <h3 className="text-xl font-medium text-foreground mb-2">No active studies</h3>
            <p className="text-muted-foreground">
              There are currently no active surveys available for participation. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {activeSurveys.map((survey) => (
              <Card key={survey.id} className="transition-all hover:shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">{survey.title}</CardTitle>
                  {survey.description && (
                    <CardDescription className="text-base mt-2">
                      {survey.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardFooter>
                  <Link href={`/survey/${survey.id}`}>
                    <Button>Participate in Study</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

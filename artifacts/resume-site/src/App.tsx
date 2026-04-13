import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@workspace/auth-web";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SurveyPage from "@/pages/survey";
import DashboardPage from "@/pages/dashboard";
import SurveyManagementPage from "@/pages/survey-management";
import SurveyResultsPage from "@/pages/survey-results";
import { useEffect } from "react";

const queryClient = new QueryClient();

function ProtectedDashboard({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const isResearcher = user?.isAdmin || false;

  useEffect(() => {
    if (!isLoading && !isResearcher) {
      setLocation("/");
    }
  }, [isLoading, isResearcher, setLocation]);


  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isResearcher) return null;


  return <Component />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="catuc-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/survey/:surveyId" component={SurveyPage} />
              
              <Route path="/dashboard">
                <ProtectedDashboard component={DashboardPage} />
              </Route>
              <Route path="/dashboard/surveys">
                <ProtectedDashboard component={SurveyManagementPage} />
              </Route>
              <Route path="/dashboard/surveys/:surveyId/results">
                <ProtectedDashboard component={SurveyResultsPage} />
              </Route>
              
              <Route component={NotFound} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import SurveyPage from "@/pages/survey";
import DashboardPage from "@/pages/dashboard";
import SurveyManagementPage from "@/pages/survey-management";
import SurveyResultsPage from "@/pages/survey-results";

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="catuc-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/survey/:surveyId" component={SurveyPage} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/dashboard/surveys" component={SurveyManagementPage} />
              <Route path="/dashboard/surveys/:surveyId/results" component={SurveyResultsPage} />
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

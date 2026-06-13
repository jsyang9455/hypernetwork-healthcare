import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import MemberDetail from "@/pages/member-detail";
import MemberDashboard from "@/pages/member-dashboard";
import MemberProfile from "@/pages/member-profile";
import LocationTracking from "@/pages/location-tracking";
import StatusDashboard from "@/pages/status-dashboard";
import RehabilitationManagement from "@/pages/rehabilitation-management";
import MemberRehabilitationReport from "@/pages/member-rehabilitation-report";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-health-blue mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/member/:id">
        {isAuthenticated ? <MemberDetail /> : <Login />}
      </Route>
      <Route path="/dashboard">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/profile">
        {isAuthenticated && !user?.isAdmin ? <MemberProfile /> : <Login />}
      </Route>
      <Route path="/member-profile">
        {isAuthenticated && !user?.isAdmin ? <MemberProfile /> : <Login />}
      </Route>
      <Route path="/location-tracking/:userId">
        {isAuthenticated ? <LocationTracking /> : <Login />}
      </Route>
      <Route path="/status-dashboard">
        {isAuthenticated && user?.isAdmin ? <StatusDashboard /> : <Login />}
      </Route>
      <Route path="/rehabilitation-management/:userId">
        {(params) => isAuthenticated ? <RehabilitationManagement userId={parseInt(params.userId)} /> : <Login />}
      </Route>
      <Route path="/member-rehabilitation-report">
        {isAuthenticated && !user?.isAdmin ? <MemberRehabilitationReport /> : <Login />}
      </Route>
      <Route path="/">
        {isAuthenticated ? (
          user?.isAdmin ? <Dashboard /> : <MemberDashboard />
        ) : (
          <Login />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;

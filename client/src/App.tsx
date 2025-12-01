import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import { StudentRoute, AdminRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import ProductPage from "@/pages/product";
import CreateListing from "@/pages/create-listing";
import AuthPage from "@/pages/auth";
import MessagesPage from "@/pages/messages";
import StudentDashboard from "@/pages/student-dashboard";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminLogin from "@/pages/admin/login";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin/login" component={AdminLogin} />

      {/* Protected Student Routes */}
      <Route path="/create-listing">
        <StudentRoute>
          <CreateListing />
        </StudentRoute>
      </Route>
      <Route path="/messages">
        <StudentRoute>
          <MessagesPage />
        </StudentRoute>
      </Route>
      <Route path="/dashboard">
        <StudentRoute>
          <StudentDashboard />
        </StudentRoute>
      </Route>

      {/* Protected Admin Routes */}
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/admin/:rest*">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  redirectTo = "/auth",
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Redirect to={redirectTo} />;
  }

  if (requireAdmin && !isAdmin) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth requireAdmin redirectTo="/admin/login">
      {children}
    </ProtectedRoute>
  );
}

export function StudentRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute requireAuth redirectTo="/auth">
      {children}
    </ProtectedRoute>
  );
}

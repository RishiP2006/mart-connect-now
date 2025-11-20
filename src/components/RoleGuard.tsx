import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useUserRole, UserRole } from "@/hooks/useUserRole";

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  children: ReactNode;
  /**
   * Optional custom redirect path when access is denied.
   * Defaults to the user's role dashboard or home.
   */
  redirectTo?: string;
}

export const RoleGuard = ({ allowedRoles, children, redirectTo }: RoleGuardProps) => {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={redirectTo || `/${role}`} replace />;
  }

  return <>{children}</>;
};



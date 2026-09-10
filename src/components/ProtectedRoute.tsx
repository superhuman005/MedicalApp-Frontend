import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  // A single role, or a list of roles that should all be allowed in (e.g. an
  // admin-oversight page that both "admin" and "superadmin" can view).
  allowedUserType?: UserRole | UserRole[];
}

const dashboardPathFor = (role: UserRole) => {
  if (role === "doctor") return "/doctor-dashboard";
  if (role === "admin" || role === "superadmin") return "/admin-dashboard";
  return "/patient-dashboard";
};

const ProtectedRoute = ({ children, allowedUserType }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowedRoles = allowedUserType
    ? Array.isArray(allowedUserType)
      ? allowedUserType
      : [allowedUserType]
    : null;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in, but as the wrong role for this route - send them to their
    // own dashboard instead of bouncing them back to /login.
    return <Navigate to={dashboardPathFor(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

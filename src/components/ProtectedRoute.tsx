import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: "patient" | "doctor" | "admin";
}

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

  if (allowedUserType && user.role !== allowedUserType) {
    // Logged in, but as the wrong role for this route - send them to their
    // own dashboard instead of bouncing them back to /login.
    const redirectTo =
      user.role === "doctor" ? "/doctor-dashboard" : user.role === "admin" ? "/admin-dashboard" : "/patient-dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

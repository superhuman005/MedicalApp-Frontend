
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserType?: 'patient' | 'doctor';
}

const ProtectedRoute = ({ children, allowedUserType }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    
    if (!userType) {
      navigate('/login');
      return;
    }

    if (allowedUserType && userType !== allowedUserType) {
      navigate('/login');
      return;
    }
  }, [navigate, allowedUserType]);

  const userType = localStorage.getItem('userType');
  
  if (!userType) {
    return null;
  }

  if (allowedUserType && userType !== allowedUserType) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

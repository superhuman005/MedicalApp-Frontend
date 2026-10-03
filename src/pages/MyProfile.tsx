import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import PatientProfilePage from "@/pages/PatientProfilePage";

// Generic "/profile" entry point - rendered inside a <ProtectedRoute> so
// `user` is always set by the time this mounts. A doctor's profile page
// lives at /doctors/:id (so patients can also view it), so a doctor landing
// on /profile is sent straight to their own copy of that page; a patient
// gets their dedicated profile page directly. Admins have no profile page
// of their own yet - send them back to their dashboard rather than 404.
const MyProfile = () => {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "doctor") return <Navigate to={`/doctors/${user._id}`} replace />;
  if (user.role === "patient") return <PatientProfilePage />;
  return <Navigate to="/admin-dashboard" replace />;
};

export default MyProfile;

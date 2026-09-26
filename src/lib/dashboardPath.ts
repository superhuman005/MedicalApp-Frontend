import type { UserRole } from "@/types";

// Where to send a signed-in user based on their role. Shared by ProtectedRoute
// (redirecting away from a route they can't access) and Login (redirecting
// after sign-in, since the portal is no longer chosen up front - the server
// tells us the role and we route from there).
export const dashboardPathFor = (role: UserRole) => {
  if (role === "doctor") return "/doctor-dashboard";
  if (role === "admin" || role === "superadmin") return "/admin-dashboard";
  return "/patient-dashboard";
};

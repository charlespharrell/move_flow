import { Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "./ui/States";
import { useAuth } from "../hooks/useAuth";
import { rolePermissions } from "../services/userService";

// Map path prefix to permission label
function labelForPath(pathname) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/shipments")) return "Shipments";
  if (pathname.startsWith("/customers")) return "Customers";
  if (pathname.startsWith("/drivers")) return "Drivers & Haulers";
  if (pathname.startsWith("/payments")) return "Payments";
  if (pathname.startsWith("/users")) return "Users";
  if (pathname.startsWith("/settings")) return "Settings";
  return null;
}

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isRestoring, user } = useAuth();

  // While a stored token is being verified against /auth/me, hold the route
  // rather than bouncing to /login and back.
  if (isRestoring) {
    return <LoadingState label="Restoring session…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // UX convenience only — the API enforces authorization independently.
  const label = labelForPath(location.pathname);
  if (label) {
    const allowed = rolePermissions[user?.role] || [];
    if (!allowed.includes(label)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
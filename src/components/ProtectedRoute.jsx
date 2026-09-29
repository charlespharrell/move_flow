import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, getCurrentUserRole } from "../services/authService";
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

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const label = labelForPath(location.pathname);
  if (label) {
    const allowed = rolePermissions[getCurrentUserRole()] || [];
    if (!allowed.includes(label)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import { LoadingState } from "./components/ui/States";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/Toast";
import { isAuthenticated } from "./services/authService";

// Page-level code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Shipments = lazy(() => import("./pages/Shipments"));
const ShipmentDetails = lazy(() => import("./pages/ShipmentDetails"));
const Customers = lazy(() => import("./pages/Customers"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));
const Drivers = lazy(() => import("./pages/Drivers"));
const DriverDetails = lazy(() => import("./pages/DriverDetails"));
const Payments = lazy(() => import("./pages/Payments"));
const PaymentDetails = lazy(() => import("./pages/PaymentDetails"));
const Users = lazy(() => import("./pages/Users"));
const UserDetails = lazy(() => import("./pages/UserDetails"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PublicRoute({ children }) {
  if (isAuthenticated()) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ErrorBoundary>
          <Suspense fallback={<LoadingState label="Loading…" />}>
            <Routes>
              {/* Public */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Suspense fallback={<LoadingState label="Loading…" />}>
                      <Login />
                    </Suspense>
                  </PublicRoute>
                }
              />

              {/* Protected */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/shipments" element={<Shipments />} />
                <Route path="/shipments/:id" element={<ShipmentDetails />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:customerId" element={<CustomerDetails />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/drivers/:driverId" element={<DriverDetails />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/payments/:paymentId" element={<PaymentDetails />} />
                <Route path="/users" element={<Users />} />
                <Route path="/users/:userId" element={<UserDetails />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

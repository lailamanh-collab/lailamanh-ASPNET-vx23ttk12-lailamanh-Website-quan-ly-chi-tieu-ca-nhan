import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingSpinner from "../components/LoadingSpinner";

// Lazy load pages for better performance
const Home = lazy(() => import("../pages/Home"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const Profile = lazy(() => import("../pages/Profile"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Wallets = lazy(() => import("../pages/Wallets"));
const Transactions = lazy(() => import("../pages/Transactions"));
const Reports = lazy(() => import("../pages/Reports"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));

// Error component for route errors
const ErrorPage = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-8">Trang không tồn tại</p>
      <button onClick={() => window.history.back()} className="btn-primary">
        Quay lại
      </button>
    </div>
  </div>
);

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="large" />
  </div>
);

// Router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Layout />
      </ErrorBoundary>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "login",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: "register",
        element: (
          <Suspense fallback={<PageLoader />}>
            <Register />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <Profile />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      // Nested routes example - có thể mở rộng sau
      {
        path: "dashboard",
        element: (
          <ProtectedRoute allowedRoles={["User", "Admin"]}>
            <Suspense fallback={<PageLoader />}>
              <Dashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["Admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "wallets",
        element: (
          <ProtectedRoute allowedRoles={["User", "Admin"]}>
            <Suspense fallback={<PageLoader />}>
              <Wallets />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "transactions",
        element: (
          <ProtectedRoute allowedRoles={["User", "Admin"]}>
            <Suspense fallback={<PageLoader />}>
              <Transactions />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute allowedRoles={["User", "Admin"]}>
            <Suspense fallback={<PageLoader />}>
              <Reports />
            </Suspense>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

// Router provider component
const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;

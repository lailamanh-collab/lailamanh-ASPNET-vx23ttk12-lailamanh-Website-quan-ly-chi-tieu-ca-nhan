import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute = ({
  children,
  allowedRoles = [],
  redirectTo = "/login",
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // Debug: Log user info
  console.log("ProtectedRoute Debug:", {
    isAuthenticated,
    user,
    userRole: user?.role,
    allowedRoles,
  });

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && user) {
    // Normalize role to lowercase for comparison
    const userRole = (user.role || "user").toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      role.toLowerCase()
    );
    const hasPermission = normalizedAllowedRoles.includes(userRole);

    if (!hasPermission) {
      console.log("Permission denied:", {
        userRole: user.role,
        normalizedUserRole: userRole,
        allowedRoles,
        normalizedAllowedRoles,
        hasPermission,
      });
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
            <p className="text-gray-600 mb-8">
              Bạn không có quyền truy cập trang này
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Role hiện tại: {user.role || "Không có role"} → {userRole}
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Role được phép: {allowedRoles.join(", ")} →{" "}
              {normalizedAllowedRoles.join(", ")}
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

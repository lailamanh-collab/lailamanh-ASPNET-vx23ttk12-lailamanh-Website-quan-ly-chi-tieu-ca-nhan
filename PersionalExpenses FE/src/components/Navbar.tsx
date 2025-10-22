import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import Avatar from "./Avatar";
import LoadingSpinner from "./LoadingSpinner";

const Navbar = () => {
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Check if current page is dashboard
  // Keep for potential conditional layouts; currently unused
  // const isDashboard = location.pathname === "/dashboard";

  // Check if current page is home (landing page)
  const isHome = location.pathname === "/";

  return (
    <nav className="bg-transparent absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={
              isAuthenticated
                ? user?.role === "Admin"
                  ? "/admin"
                  : "/dashboard"
                : "/"
            }
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Personal Expenses
            </span>
          </Link>

          {/* Top-level nav links removed; use avatar dropdown instead */}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <LoadingSpinner size="small" />
            ) : isAuthenticated && user ? (
              // Only show user info and avatar on dashboard, not on home page
              !isHome ? (
                <div className="flex items-center space-x-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>

                  <div className="relative group">
                    <Avatar src={user.avatar} name={user.name} size="medium" />

                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Hồ sơ cá nhân
                        </Link>
                        {user.role !== "Admin" && (
                          <Link
                            to="/wallets"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Quản lý ví
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-primary-600 transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn-primary">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

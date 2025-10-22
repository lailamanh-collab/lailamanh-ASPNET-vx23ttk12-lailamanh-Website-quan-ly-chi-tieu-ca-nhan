import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Layout = () => {
  const location = useLocation();

  // Don't show navbar on dashboard page since it has its own header
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDashboard && <Navbar />}

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="bg-white border border-gray-200 shadow-lg"
        progressClassName="bg-primary-500"
      />
    </div>
  );
};

export default Layout;

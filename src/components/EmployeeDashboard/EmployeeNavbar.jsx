import React from "react";
import { useAuth } from "../../Context/authContext";
import { useNavigate } from "react-router-dom";

const EmployeeNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg fixed top-0 left-0 right-0 z-10">
      <div className="px-6 py-4 flex justify-between items-center">
        {/* Welcome Section */}
        <h1 className="text-lg font-bold">
          Welcome, <span className="text-teal-400">{user?.name || "Employee"}</span>
        </h1>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default EmployeeNavbar;

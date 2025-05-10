import React from "react";
import { useAuth } from "../../Context/authContext";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../NotificationDropdown";

const EmployeeNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="bg-gray-800 text-white shadow-lg fixed top-0 left-0 right-0 z-10 px-6 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">
        Welcome, <span className="text-teal-400">{user?.name || "Employee"}</span>
      </h1>

      <div className="flex items-center space-x-6">
        <NotificationDropdown userId={user?._id} />

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-md transition duration-300"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default EmployeeNavbar;
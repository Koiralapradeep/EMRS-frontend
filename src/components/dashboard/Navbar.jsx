import React from "react";
import { useAuth } from "../../Context/authContext";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../NotificationDropdown";

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Safely retrieve user from localStorage
  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      user = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error("Failed to parse user from localStorage:", error);
    localStorage.removeItem("user");
  }

  const userName = user?.name || "Manager";

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-md relative z-10">
      <h1 className="text-xl font-bold">
        Welcome, <span className="text-green-400">{userName}</span>
      </h1>

      <div className="flex items-center space-x-6">
        <NotificationDropdown userId={user?._id} />

        <button
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-md transition duration-300"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
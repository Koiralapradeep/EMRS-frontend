import React from "react";
import { useAuth } from "../../Context/authContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Fetch user name from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const userName = user?.name || "Manager";

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-md">
      {/* Left Side: User Welcome Message */}
      <h1 className="text-xl font-bold">
        Welcome, <span className="text-green-400">{userName}</span>
      </h1>

      {/* Right Side: Logout Button */}
      <button
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-md transition duration-300"
        onClick={() => {
          logout();
          navigate("/login");
        }}
      >
        Logout
      </button>
    </nav>
  );
};

export default Navbar;

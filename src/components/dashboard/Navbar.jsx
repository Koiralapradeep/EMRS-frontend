import React, { useEffect } from "react";
import { useAuth } from "../../Context/authContext";
import { useNotification } from "../../Context/NotificationContext";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../NotificationDropdown";
import { MessageCircle } from "lucide-react";

const Navbar = () => {
  const { logout } = useAuth();
  const { newMessages } = useNotification();
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

  // Calculate total unread messages
  const totalUnread = newMessages.length;

  // Log re-renders to confirm UI updates
  useEffect(() => {
    console.log("DEBUG - ManagerNavbar re-rendered with newMessages:", newMessages, "Total Unread:", totalUnread);
  }, [newMessages]);

  const handleMessageClick = () => {
    console.log("DEBUG - Messages button clicked, navigating to /manager-dashboard/messages");
    navigate("/manager-dashboard/messages");
  };

  return (
    <nav className="bg-gray-800 text-white px-6 py-4 flex justify-between items-center shadow-md relative z-10">
      <h1 className="text-xl font-bold">
        Welcome, <span className="text-green-400">{userName}</span>
      </h1>

      <div className="flex items-center space-x-6">
        {/* Message Button */}
        <button
          className="relative text-white transition-colors flex items-center"
          onClick={handleMessageClick}
        >
          <MessageCircle size={24} className={`mr-2 ${totalUnread > 0 ? 'text-green-400' : ''}`} />
          {totalUnread > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
              {totalUnread}
            </span>
          )}
        </button>

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
import React, { useEffect } from "react";
import { useAuth } from "../../Context/authContext";
import { useNotification } from "../../Context/NotificationContext";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "../NotificationDropdown";
import { MessageCircle } from "lucide-react";

const EmployeeNavbar = () => {
  const { user, logout } = useAuth();
  const { newMessages } = useNotification();
  const navigate = useNavigate();

  // Calculate total unread messages
  const totalUnread = newMessages.length;

  // Log re-renders to confirm UI updates
  useEffect(() => {
    console.log("DEBUG - EmployeeNavbar re-rendered with newMessages:", newMessages, "Total Unread:", totalUnread);
  }, [newMessages]);

  // Handle message button click
  const handleMessageClick = () => {
    console.log("DEBUG - Messages button clicked, navigating to /employee-dashboard/messages");
    navigate("/employee-dashboard/messages");
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg fixed top-0 left-0 right-0 z-10 px-6 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">
        Welcome, <span className="text-teal-400">{user?.name || "Employee"}</span>
      </h1>

      <div className="flex items-center space-x-6">
        {/* Message Button */}
        <button
          className="relative text-white transition-colors flex items-center"
          onClick={handleMessageClick}
        >
          <MessageCircle size={24} className={`mr-2 ${totalUnread > 0 ? 'text-teal-400' : ''}`} />
          {totalUnread > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs">
              {totalUnread}
            </span>
          )}
        </button>

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
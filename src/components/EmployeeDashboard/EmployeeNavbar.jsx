import React, { useState, useContext } from "react";
import { useAuth } from "../../Context/authContext";
import { useNavigate } from "react-router-dom";
import { NotificationContext } from "../../Context/NotificationContext";
import { IoNotificationsOutline } from "react-icons/io5";
import axios from "axios";

const EmployeeNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const context = useContext(NotificationContext);
  const { notifications = [], setNotifications } = context || {}; // Fallback to empty array if context is undefined
  const [isOpen, setIsOpen] = useState(false);

  console.log("Notifications in EmployeeNavbar:", notifications);

  // Ensure notifications are always an array
  const filteredNotifications = notifications?.filter(
    (notif) => notif.recipient === user?._id?.toString()
  ) || [];

  const markAsRead = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/notifications/${id}/mark-as-read`,
        {},
        { withCredentials: true }
      );
      setNotifications((prev) => prev.filter((notif) => notif._id !== id));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg fixed top-0 left-0 right-0 z-10 px-6 py-4 flex justify-between items-center">
      <h1 className="text-lg font-bold">
        Welcome, <span className="text-teal-400">{user?.name || "Employee"}</span>
      </h1>

      <div className="flex items-center space-x-6">
        <div className="relative">
          <IoNotificationsOutline
            className="text-2xl cursor-pointer hover:text-gray-300"
            onClick={() => setIsOpen(!isOpen)}
          />
          {filteredNotifications.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 rounded-full">
              {filteredNotifications.length}
            </span>
          )}

          {isOpen && (
            <div className="absolute right-0 top-10 w-72 bg-white shadow-lg rounded-md p-2 text-gray-900 z-50 max-h-96 overflow-y-auto">
              <h3 className="font-semibold text-lg mb-2 border-b pb-2">Notifications</h3>
              {filteredNotifications.length === 0 ? (
                <p className="text-center text-gray-500">No new notifications</p>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif._id}
                    className="border-b p-2 text-sm hover:bg-gray-100 flex justify-between items-center"
                  >
                    <span>{notif.message}</span>
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="text-blue-500 hover:underline text-xs"
                    >
                      Mark as Read
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default EmployeeNavbar;
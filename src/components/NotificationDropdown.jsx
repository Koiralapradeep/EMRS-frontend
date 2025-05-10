import React, { useState } from "react";
import { useNotification } from "../Context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { IoNotificationsOutline } from "react-icons/io5";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/authContext";

const NotificationDropdown = ({ userId }) => {
  const { notifications, setNotifications } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filter unread notifications for the current user
  const filteredNotifications = notifications?.filter(
    (notif) => notif.recipient?.toString() === userId?.toString() && !notif.isRead
  ) || [];
  const unreadCount = filteredNotifications.length;

  // Function to get notification icon and color based on type
  const getNotificationStyle = (type) => {
    switch (type) {
      case "leave_request":
        return { icon: "📩", color: "bg-blue-900 text-blue-300" };
      case "leave_approved":
        return { icon: "✅", color: "bg-green-900 text-green-300" };
      case "leave_rejected":
        return { icon: "❌", color: "bg-red-900 text-red-300" };
      default:
        return { icon: "🔔", color: "bg-gray-900 text-gray-300" };
    }
  };

  const markAsRead = async (id) => {
    try {
      console.log("Attempting to mark notification as read, ID:", id);
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        return;
      }

      const response = await axios.put(
        `http://localhost:3000/api/notifications/${id}/mark-as-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      console.log("API response:", response.data);

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === id ? { ...notif, isRead: true } : notif
          )
        );
        console.log("Notification marked as read in state");
      } else {
        console.error("Failed to mark notification as read:", response.data.message);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error.response?.data || error.message);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.leaveId) {
      markAsRead(notification._id); // Mark as read when clicked
      setIsOpen(false); // Close the dropdown

      // Determine navigation based on user role and notification type
      if (user.role === "Manager" && notification.type === "leave_request") {
        // For managers, navigate to ManagerLeave with the leaveId as a query parameter
        navigate(`/manager-dashboard/leave?leaveId=${notification.leaveId}`);
      } else {
        // For employees, navigate to the generic leave details page
        navigate(`/leave/${notification.leaveId}`);
      }
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon with Unread Count */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-400 hover:text-gray-200 p-2"
      >
        <IoNotificationsOutline className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-80 bg-gray-800 text-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          {filteredNotifications.length === 0 ? (
            <p className="p-4 text-gray-400 text-sm">No new notifications.</p>
          ) : (
            filteredNotifications.map((notif) => {
              const { icon, color } = getNotificationStyle(notif.type);
              return (
                <div
                  key={notif._id}
                  className={`flex items-start p-4 border-b border-gray-700 ${color} hover:bg-gray-700 transition-colors duration-150 cursor-pointer`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  {/* Icon */}
                  <div className="text-xl mr-3">{icon}</div>

                  {/* Notification Content */}
                  <div className="flex-1">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Mark as Read Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent the parent div's onClick from firing
                      markAsRead(notif._id);
                      if (filteredNotifications.length === 1) setIsOpen(false);
                    }}
                    className="ml-3 px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors duration-150"
                  >
                    Mark as Read
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
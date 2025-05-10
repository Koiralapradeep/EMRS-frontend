import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const { logout, user, isLoggingOut } = useAuth();
  const socketRef = useRef(null);
  const hasInitializedSocket = useRef(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const SOCKET_IO_URL = import.meta.env.VITE_SOCKET_IO_URL || "http://localhost:3000";

  const isTokenExpired = (token) => {
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      return Date.now() > decodedToken.exp * 1000;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  const isValidJwt = (token) => {
    if (!token || typeof token !== "string") {
      return false;
    }
    const parts = token.split(".");
    return parts.length === 3 && parts.every((part) => part.length > 0);
  };

  useEffect(() => {
    let isMounted = true;
    let hasNavigated = false;

    if (isLoggingOut) {
      console.log("Skipping NotificationContext useEffect due to logout in progress.");
      return;
    }

    if (!user || !user._id) {
      console.log("User not authenticated, skipping notification setup");
      return;
    }

    // Skip notification fetching for Admin if they have no notifications
    if (user.role === "Admin") {
      console.log("Admin user detected. Skipping notification fetch as Admin has no notifications.");
      // Still initialize Socket.IO for potential future notifications
    } else {
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("Token not found in localStorage");
            if (isMounted && !hasNavigated) {
              hasNavigated = true;
              navigate("/login", { replace: true });
            }
            return;
          }

          if (isTokenExpired(token)) {
            console.warn("Token expired, logging out.");
            logout();
            return;
          }

          const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          });

          if (response.data.success && Array.isArray(response.data.notifications)) {
            if (isMounted) {
              setNotifications(response.data.notifications);
            }
          } else {
            console.error("Failed to fetch notifications:", response.data.message);
            if (isMounted) {
              setNotifications([]);
            }
          }
        } catch (error) {
          if (error.response) {
            console.error("Error fetching notifications:", error.response.status, error.response.data);
            if (error.response.status === 401) {
              console.warn("Unauthorized, logging out...");
              logout();
            }
          } else if (error.request) {
            console.error("No response received from server:", error.message);
          } else {
            console.error("Error setting up request:", error.message);
          }
          if (isMounted) {
            setNotifications([]);
          }
        }
      };

      fetchNotifications();
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("Token missing, cannot initialize Socket.IO");
      logout();
      return;
    }

    if (!isValidJwt(token)) {
      console.error("Invalid or malformed JWT token:", token);
      logout();
      return;
    }

    if (isTokenExpired(token)) {
      console.warn("Token expired, cannot initialize Socket.IO");
      logout();
      return;
    }

    if (!socketRef.current && !hasInitializedSocket.current) {
      console.log("DEBUG - Initializing Socket.IO with token:", token);
      socketRef.current = io(SOCKET_IO_URL, {
        withCredentials: true,
        extraHeaders: {
          Authorization: `Bearer ${token}`,
        },
        transports: ["websocket", "polling"],
        reconnection: false, // Disable reconnection to prevent re-authentication
        reconnectionAttempts: 0,
      });
      window.notificationSocket = socketRef.current;
      hasInitializedSocket.current = true;

      socketRef.current.on("connect", () => {
        console.log("Connected to Socket.IO server");
        if (user?._id) {
          socketRef.current.emit("register", user._id);
        }
      });

      socketRef.current.on("notification", (notification) => {
        if (isMounted) {
          setNotifications((prev) => {
            if (!prev.some((n) => n._id === notification._id)) {
              return [...prev, notification];
            }
            return prev;
          });
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error.message);
        console.error("Error details:", error);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("Socket.IO disconnected:", reason);
        if (reason === "io server disconnect" && !localStorage.getItem("token")) {
          console.log("User logged out, disabling Socket.IO reconnection.");
          socketRef.current.io.opts.reconnection = false;
          hasInitializedSocket.current = false;
        }
      });
    }

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        window.notificationSocket = null;
      }
    };
  }, [navigate, user, isLoggingOut]);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Marking notification as read via context, ID:", notificationId);
      const response = await axios.put(
        `${API_BASE_URL}/api/notifications/${notificationId}/mark-as-read`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      console.log("Context markAsRead API response:", response.data);
  
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        console.log("Notification updated in context state");
      } else {
        console.error("Failed to mark notification as read in context:", response.data.message);
      }
    } catch (error) {
      console.error("Error marking notification as read in context:", error.response?.data || error.message);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export { NotificationContext };
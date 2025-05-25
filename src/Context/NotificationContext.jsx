import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";

// Load the notification sound
const notificationSound = new Audio('/notification-sound.mp3');

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [newMessages, setNewMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const { logout, user, isLoggingOut } = useAuth();
  const socketRef = useRef(null);
  const hasInitializedSocket = useRef(false);
  const audioUnlocked = useRef(false);

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

  // Unlock audio playback on user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlocked.current) {
        notificationSound.play().catch((error) => {
          console.error("Error pre-playing notification sound:", error);
        });
        audioUnlocked.current = true;
        document.removeEventListener('click', unlockAudio);
      }
    };
    document.addEventListener('click', unlockAudio);
    return () => {
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

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

    if (user.role === "Admin") {
      console.log("Admin user detected. Skipping notification fetch as Admin has no notifications.");
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
              // Filter out message notifications for the notifications state (bell icon)
              const filteredNotifications = response.data.notifications.filter(
                (n) => n.type !== "new_message"
              );
              console.log("DEBUG - Fetched notifications (excluding new_message):", filteredNotifications);
              setNotifications(filteredNotifications);

              // Update newMessages for message notifications (message icon)
              const messageNotifications = response.data.notifications
                .filter((n) => n.type === "new_message" && !n.isRead)
                .map((n) => {
                  if (!n.messageDetails || !n.messageDetails.conversationId) {
                    console.error("DEBUG - Missing conversationId in notification:", n);
                    return null;
                  }
                  if (!n.message) {
                    console.error("DEBUG - Missing message in notification:", n);
                    return null;
                  }
                  // Ensure message has the expected structure
                  const messageData = {
                    _id: n.message._id,
                    conversationId: n.message.conversationId,
                    sender: n.message.sender || { _id: n.sender?._id || null },
                    content: n.message.content,
                    createdAt: n.message.createdAt,
                  };
                  return {
                    conversationId: n.messageDetails.conversationId,
                    message: messageData,
                    notificationId: n._id,
                  };
                })
                .filter((n) => n !== null); // Remove invalid notifications
              console.log("DEBUG - Fetched message notifications for newMessages:", messageNotifications);
              setNewMessages(messageNotifications);
            }
          } else {
            console.error("Failed to fetch notifications:", response.data.message);
            if (isMounted) {
              setNotifications([]);
              setNewMessages([]);
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
            setNewMessages([]);
          }
        }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000); // Fetch every 5 seconds
      return () => clearInterval(interval);
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
        reconnection: true,
        reconnectionAttempts: 3,
      });
      hasInitializedSocket.current = true;

      setSocket(socketRef.current);

      socketRef.current.on("connect", () => {
        console.log("DEBUG - Connected to Socket.IO server");
        if (user?._id) {
          socketRef.current.emit("register", user._id);
          console.log("DEBUG - Emitted register event with user ID:", user._id);
        }
      });

      socketRef.current.on("notification", (notification) => {
        if (isMounted) {
          console.log("DEBUG - Received notification event:", notification);
          // Only add non-message notifications to the notifications state
          if (notification.type !== "new_message") {
            setNotifications((prev) => {
              if (!prev.some((n) => n._id === notification._id)) {
                return [...prev, notification];
              }
              return prev;
            });
          }
        }
      });

      socketRef.current.on("newMessage", (data) => {
        if (isMounted) {
          console.log("DEBUG - Received newMessage event with data:", data);
          if (!data._id || !data.messageDetails || !data.message) {
            console.error("DEBUG - Invalid newMessage data:", data);
            return;
          }
          setNewMessages((prev) => {
            const updatedMessages = [
              ...prev,
              {
                conversationId: data.messageDetails.conversationId,
                message: data.message,
                notificationId: data._id,
              },
            ];
            console.log("DEBUG - Updated newMessages state:", updatedMessages);
            if (data.message.sender._id !== user?._id) {
              notificationSound.play().catch((error) => {
                console.error("Error playing notification sound:", error);
              });
            }
            return updatedMessages;
          });
        }
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("DEBUG - Socket.IO connection error:", error.message);
      });

      socketRef.current.on("disconnect", (reason) => {
        console.log("DEBUG - Socket.IO disconnected:", reason);
        if (reason === "io server disconnect" && !localStorage.getItem("token")) {
          console.log("User logged out, disabling Socket.IO reconnection.");
          socketRef.current.io.opts.reconnection = false;
          hasInitializedSocket.current = false;
          setSocket(null);
        }
      });
    }

    return () => {
      isMounted = false;
      if (isLoggingOut && socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        hasInitializedSocket.current = false;
        setSocket(null);
      }
    };
  }, [navigate, user, isLoggingOut, logout]);

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      console.log("DEBUG - Marking notification as read, ID:", notificationId);
      const response = await axios.put(
        `${API_BASE_URL}/api/notifications/${notificationId}/mark-as-read`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("DEBUG - markAsRead API response:", response.data);

      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setNewMessages((prev) => {
          const updated = prev.filter((msg) => msg.notificationId !== notificationId);
          console.log("DEBUG - Removed notification from newMessages:", updated);
          return updated;
        });
      } else {
        console.error("Failed to mark notification as read:", response.data.message);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error.response?.data || error.message);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, setNotifications, newMessages, setNewMessages, markAsRead, socket }}>
      {children}
    </NotificationContext.Provider>
  );
};

export { NotificationContext };
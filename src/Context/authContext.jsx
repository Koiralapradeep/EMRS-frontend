import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const UserContext = createContext();

export const useAuth = () => useContext(UserContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [companyId, setCompanyId] = useState(() => localStorage.getItem("companyId") || null);
  const [companyName, setCompanyName] = useState(() =>
    localStorage.getItem("companyName") || "Unknown Company"
  );
  const [departmentId, setDepartmentId] = useState(() => localStorage.getItem("departmentId") || null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      if (isLoggingOut) {
        console.log("Skipping initialization due to logout in progress.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        if (isTokenExpired(token)) {
          console.warn("Token expired, logging out.");
          await logout();
        } else if (!user) {
          await fetchUserProfile();
        }
      } else if (!["/login", "/forgot-password", "/reset-password"].includes(location.pathname)) {
        console.warn("No token found. Redirecting to login from:", location.pathname);
        navigate("/login", { replace: true });
      } else {
        console.log("No token found, but on public route:", location.pathname);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [navigate, user, isLoggingOut, location.pathname]);

  const isTokenExpired = (token) => {
    try {
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      return Date.now() > decodedToken.exp * 1000;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  const fetchUserProfile = async () => {
    if (isLoggingOut) {
      console.log("Skipping fetchUserProfile due to logout in progress.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found in fetchUserProfile. Redirecting to login.");
      navigate("/login");
      return;
    }

    try {
      console.log("Fetching user profile with token:", token);
      const response = await fetch("http://localhost:3000/api/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn("Token invalid or expired, logging out.");
          await logout();
        } else {
          console.error(`Failed to fetch user (Status: ${response.status})`);
        }
        return;
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.user) {
        console.log("Extracted user data:", data.user);
        if (isLoggingOut) {
          console.log("User data received, but logout in progress. Ignoring.");
          return;
        }

        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "Admin") {
          console.log("Admin user detected, setting default company values.");
          localStorage.setItem("companyId", "");
          localStorage.setItem("companyName", "No Company");
          setCompanyId("");
          setCompanyName("No Company");
          localStorage.setItem("departmentId", "");
          setDepartmentId(null);
        } else {
          if (data.user.companyId) {
            console.log("Storing companyId:", data.user.companyId);
            localStorage.setItem("companyId", data.user.companyId);
            setCompanyId(data.user.companyId);
          } else {
            console.warn("ERROR: `companyId` is missing from user data!");
          }

          if (data.user.companyName) {
            console.log("Storing companyName:", data.user.companyName);
            localStorage.setItem("companyName", data.user.companyName);
            setCompanyName(data.user.companyName);
          } else {
            console.warn("ERROR: `companyName` is missing from user data!");
          }

          const employeeResponse = await fetch(`http://localhost:3000/api/employees/user/${data.user._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (employeeResponse.ok) {
            const employeeData = await employeeResponse.json();
            if (employeeData.employee && employeeData.employee.department) {
              console.log("Storing departmentId:", employeeData.employee.department);
              localStorage.setItem("departmentId", employeeData.employee.department);
              setDepartmentId(employeeData.employee.department);
            } else {
              console.warn("No department found for user in employees collection");
              localStorage.setItem("departmentId", "");
              setDepartmentId(null);
            }
          } else {
            console.warn("Failed to fetch employee data for departmentId");
            localStorage.setItem("departmentId", "");
            setDepartmentId(null);
          }
        }

        console.log("FINAL STORED VALUES:");
        console.log("Stored Company ID:", localStorage.getItem("companyId"));
        console.log("Stored Company Name:", localStorage.getItem("companyName"));
        console.log("Stored Department ID:", localStorage.getItem("departmentId"));
      } else {
        console.warn("No user data received, logging out.");
        await logout();
      }
    } catch (err) {
      console.error("Error fetching user:", err.message);
    }
  };

  const login = ({ user, token }) => {
    console.log("Logging in user:", user);

    if (!token) {
      console.error("ERROR - No token received during login");
      return;
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    if (user.role === "Admin") {
      console.log("Admin user detected, setting default company values.");
      localStorage.setItem("companyId", "");
      localStorage.setItem("companyName", "No Company");
      setCompanyId("");
      setCompanyName("No Company");
      localStorage.setItem("departmentId", "");
      setDepartmentId(null);
    } else {
      if (user.companyId) {
        console.log("Storing companyId:", user.companyId);
        localStorage.setItem("companyId", user.companyId);
        setCompanyId(user.companyId);
      } else {
        console.warn("ERROR - No `companyId` found in user data!");
      }

      if (user.companyName) {
        console.log("Storing companyName:", user.companyName);
        localStorage.setItem("companyName", user.companyName);
        setCompanyName(user.companyName);
      } else {
        console.warn("ERROR - No `companyName` found in user data!");
      }

      fetch(`http://localhost:3000/api/employees/user/${user._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to fetch employee data");
          }
        })
        .then((employeeData) => {
          if (employeeData.employee && employeeData.employee.department) {
            console.log("Storing departmentId:", employeeData.employee.department);
            localStorage.setItem("departmentId", employeeData.employee.department);
            setDepartmentId(employeeData.employee.department);
          } else {
            console.warn("No department found for user in employees collection");
            localStorage.setItem("departmentId", "");
            setDepartmentId(null);
          }
        })
        .catch((err) => {
          console.warn("Error fetching departmentId during login:", err.message);
          localStorage.setItem("departmentId", "");
          setDepartmentId(null);
        });
    }

    console.log("FINAL STORED VALUES:");
    console.log("Company ID:", localStorage.getItem("companyId"));
    console.log("Company Name:", localStorage.getItem("companyName"));
    console.log("Department ID:", localStorage.getItem("departmentId"));

    if (user.role === "Admin") {
      navigate(`/admin-dashboard`, { replace: true });
    } else if (user.role === "Manager") {
      navigate(`/manager-dashboard?companyId=${user.companyId}`, { replace: true });
    } else if (user.role === "Employee") {
      navigate(`/employee-dashboard?companyId=${user.companyId}`, { replace: true });
    } else {
      console.warn("WARNING - No valid role found, redirecting to login.");
      navigate("/login", { replace: true });
    }
  };

  const logout = async () => {
    console.log("Logging out user...");
    setIsLoggingOut(true);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log("DEBUG - Sending logout request with token:", token.slice(0, 10) + "...");
      } else {
        console.log("DEBUG - No token found in localStorage for logout request");
      }

      const response = await fetch("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to log out on server (Status: ${response.status}, Response: ${errorText})`);
      } else {
        console.log("Server session destroyed successfully.");
      }
    } catch (error) {
      console.error("Error during logout API call:", error.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("companyId");
      localStorage.removeItem("companyName");
      localStorage.removeItem("departmentId");

      console.log("After logout - localStorage:");
      console.log("Token:", localStorage.getItem("token"));
      console.log("User:", localStorage.getItem("user"));
      console.log("Company ID:", localStorage.getItem("companyId"));
      console.log("Company Name:", localStorage.getItem("companyName"));
      console.log("Department ID:", localStorage.getItem("departmentId"));

      setUser(null);
      setCompanyId(null);
      setCompanyName("Unknown Company");
      setDepartmentId(null);

      document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      console.log("Cleared connect.sid cookie on frontend.");

      // Safely disconnect sockets
      if (window.notificationSocket && typeof window.notificationSocket.disconnect === 'function') {
        window.notificationSocket.disconnect();
        window.notificationSocket = null;
        console.log("Socket.IO disconnected from NotificationContext.");
      } else {
        console.log("No notificationSocket to disconnect or disconnect method not available.");
      }

      if (window.socket && typeof window.socket.disconnect === 'function') {
        window.socket.disconnect();
        console.log("Socket.IO disconnected (window.socket).");
      } else {
        console.log("No socket to disconnect or disconnect method not available.");
      }

      // Perform state updates and navigation synchronously
      setLoading(false);
      navigate("/login", { replace: true });
      console.log("User logged out successfully.");
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User object in authContext:', JSON.stringify(user, null, 2));
      const storedCompanyId = localStorage.getItem("companyId");
      if (user.companyId && storedCompanyId !== user.companyId) {
        localStorage.setItem("companyId", user.companyId);
        setCompanyId(user.companyId);
      }

      const storedCompanyName = localStorage.getItem("companyName");
      if (user.companyName && storedCompanyName !== user.companyName) {
        localStorage.setItem("companyName", user.companyName);
        setCompanyName(user.companyName);
      }
    }
  }, [user]);

  useEffect(() => {
    console.log("Checking LocalStorage after state updates:");
    console.log("Stored Token:", localStorage.getItem("token"));
    console.log("Stored User:", localStorage.getItem("user"));
    console.log("Stored Company ID:", localStorage.getItem("companyId"));
    console.log("Stored Company Name:", localStorage.getItem("companyName"));
    console.log("Stored Department ID:", localStorage.getItem("departmentId"));
  }, [companyId, companyName, departmentId, user]);

  return (
    <UserContext.Provider
      value={{ user, companyId, companyName, departmentId, login, logout, setUser, loading, isLoggingOut }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;
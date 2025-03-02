import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const useAuth = () => useContext(UserContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Pull user from localStorage if available
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Pull companyId and companyName from localStorage if available
  const [companyId, setCompanyId] = useState(() => localStorage.getItem("companyId") || null);
  const [companyName, setCompanyName] = useState(() =>
    localStorage.getItem("companyName") || "Unknown Company"
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      if (isTokenExpired(token)) {
        console.warn("Token expired, logging out.");
        logout();
      } else if (!user) {
        // If we have a token but no user in state, fetch the user
        fetchUserProfile();
      }
    } else {
      console.warn("No token found. Redirecting to login.");
      navigate("/login");
    }
  }, [navigate]);

  const isTokenExpired = (token) => {
    try {
      // decode the middle part of JWT
      const decodedToken = JSON.parse(atob(token.split(".")[1]));
      return Date.now() > decodedToken.exp * 1000;
    } catch (error) {
      console.error("Error decoding token:", error);
      return true;
    }
  };

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token found. Redirecting to login.");
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
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (data.user) {
        console.log("Extracted user data:", data.user);

        // Update state and localStorage
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

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

        console.log("FINAL STORED VALUES:");
        console.log("Stored Company ID:", localStorage.getItem("companyId"));
        console.log("Stored Company Name:", localStorage.getItem("companyName"));
      } else {
        console.warn("No user data received, logging out.");
        logout();
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      logout();
    }
  };

  const login = ({ user, token }) => {
    console.log("Logging in user:", user);

    if (!token) {
      console.error("ERROR - No token received during login");
      return;
    }

    // Store token and user
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);

    // Also store company fields separately
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

    console.log("FINAL STORED VALUES:");
    console.log("Company ID:", localStorage.getItem("companyId"));
    console.log("Company Name:", localStorage.getItem("companyName"));

    // Navigate based on role
    if (user.role === "Admin") {
      navigate(`/admin-dashboard?companyId=${user.companyId}`, { replace: true });
    } else if (user.role === "Manager") {
      navigate(`/manager-dashboard?companyId=${user.companyId}`, { replace: true });
    } else if (user.role === "Employee") {
      navigate(`/employee-dashboard?companyId=${user.companyId}`, { replace: true });
    } else {
      console.warn("WARNING - No valid role found, redirecting to login.");
      navigate("/login", { replace: true });
    }
  };

  const logout = () => {
    console.log("Logging out user...");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("companyId");
    localStorage.removeItem("companyName");

    setUser(null);
    setCompanyId(null);
    setCompanyName("Unknown Company");

    navigate("/login", { replace: true });

    console.log("User logged out successfully.");
  };

  // Ensure that if user is already in localStorage, company details are also set
  useEffect(() => {
    if (user) {
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

  // Debug: log whenever companyId, companyName, or user changes
  useEffect(() => {
    console.log("Checking LocalStorage after state updates:");
    console.log("Stored Token:", localStorage.getItem("token"));
    console.log("Stored User:", localStorage.getItem("user"));
    console.log("Stored Company ID:", localStorage.getItem("companyId"));
    console.log("Stored Company Name:", localStorage.getItem("companyName"));
  }, [companyId, companyName, user]);

  return (
    <UserContext.Provider value={{ user, companyId, companyName, login, logout, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;

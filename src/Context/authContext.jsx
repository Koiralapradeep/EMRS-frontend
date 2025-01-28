import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const useAuth = () => useContext(UserContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Restore user session on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      localStorage.clear();
    }
    setLoading(false); // Mark restoration complete
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);

    const redirectPath =
      userData.role.toLowerCase() === "manager"
        ? "/manager-dashboard"
        : "/employee-dashboard";
    navigate(redirectPath);
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    navigate("/login");
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UserContext = createContext();

export const useAuth = () => useContext(UserContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      localStorage.clear();
    }

    // ✅ Handle Google SSO redirect (Check for token in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const googleToken = urlParams.get("token");

    if (googleToken) {
      localStorage.setItem("token", googleToken);
      fetchUserProfile(googleToken);

      // ✅ Remove the token from the URL after processing
      navigate("/loading", { replace: true });
    }

    setLoading(false);
  }, []);

  // ✅ Fetch user profile from backend using the token
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/user", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));

        // ✅ Redirect based on role
        const redirectPath =
          data.user.role.toLowerCase() === "manager"
            ? "/manager-dashboard"
            : "/employee-dashboard";

        navigate(redirectPath, { replace: true });
      } else {
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      localStorage.clear();
      navigate("/login", { replace: true });
    }
  };

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);

    const redirectPath =
      userData.role.toLowerCase() === "manager"
        ? "/manager-dashboard"
        : "/employee-dashboard";

    navigate(redirectPath, { replace: true });
  };

  const logout = () => {
    setUser(null);
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default AuthProvider;

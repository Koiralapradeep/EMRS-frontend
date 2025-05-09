import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../Context/authContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";

const Login = () => {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Define the API base URL from environment variable (or fallback to localhost:3000)
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Check for token from Google OAuth redirect in URL params
  useEffect(() => {
    console.log("DEBUG - useEffect running");
    console.log("Current URL:", window.location.href);
    console.log("Location.search:", location.search);

    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token");
    const errorParam = urlParams.get("error");

    if (errorParam) {
      console.error("OAuth2 Error from Backend:", errorParam);
      let errorMessage = "OAuth2 Authentication Failed: ";
      if (errorParam === "user-not-found") {
        errorMessage += "User not found. Please register first.";
      } else if (errorParam === "server-error-jwt-secret-missing") {
        errorMessage += "Server error: JWT_SECRET is missing. Contact the administrator.";
      } else if (errorParam === "server-error-token-generation-failed") {
        errorMessage += "Server error: Failed to generate token. Contact the administrator.";
      } else {
        errorMessage += "Unknown server error.";
      }
      setError(errorMessage);
      return;
    }

    if (token) {
      console.log("OAuth2 Token received:", token);
      localStorage.setItem("token", token);

      axios
        .get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
        .then((res) => {
          console.log("Response from /api/auth/me:", res.data);
          if (res.data?.success) {
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            // Redirect based on user role
            if (userData.role === "Admin") {
              navigate("/admin-dashboard", { replace: true });
            } else if (userData.role === "Manager") {
              navigate("/manager-dashboard", { replace: true });
            } else {
              navigate("/employee-dashboard", { replace: true });
            }
          } else {
            console.error("ERROR - /api/auth/me did not return success:", res.data);
            setError("Unable to fetch user data via /me endpoint.");
            localStorage.removeItem("token");
          }
        })
        .catch((err) => {
          console.error("Error fetching user data from /api/auth/me:", {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message,
          });
          const errorMessage = err.response?.data?.error || "Failed to fetch user data. Please log in again.";
          setError(errorMessage);
          localStorage.removeItem("token");
        });
    } else {
      console.log("No OAuth2 token found in URL query parameters.");
      // Fallback: Check localStorage in case of a page reload
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        console.log("DEBUG - Found token in localStorage:", storedToken);
        axios
          .get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            withCredentials: true,
          })
          .then((res) => {
            console.log("Response from /api/auth/me (localStorage token):", res.data);
            if (res.data?.success) {
              const userData = res.data.user;
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));

              // Redirect based on role
              if (userData.role === "Admin") {
                navigate("/admin-dashboard", { replace: true });
              } else if (userData.role === "Manager") {
                navigate("/manager-dashboard", { replace: true });
              } else {
                navigate("/employee-dashboard", { replace: true });
              }
            } else {
              console.error("ERROR - /api/auth/me did not return success (localStorage token):", res.data);
              setError("Unable to fetch user data via /me endpoint.");
              localStorage.removeItem("token");
            }
          })
          .catch((err) => {
            console.error("Error fetching user data from /api/auth/me (localStorage token):", {
              status: err.response?.status,
              data: err.response?.data,
              message: err.message,
            });
            const errorMessage = err.response?.data?.error || "Failed to fetch user data. Please log in again.";
            setError(errorMessage);
            localStorage.removeItem("token");
          });
      }
    }
  }, [navigate, setUser, location.search]);

  // Handle manual login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log("DEBUG - Sending login request to /api/auth/login");
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      console.log("Manual login response:", response.data);

      if (!response.data?.success || !response.data?.user) {
        setError("Login failed. No user data received.");
        return;
      }

      const { user, token } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      // Redirect based on user role
      if (user.role === "Admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (user.role === "Manager") {
        navigate("/manager-dashboard", { replace: true });
      } else {
        navigate("/employee-dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      console.error("Login Error Status:", err.response?.status);
      console.error("Login Error Headers:", err.response?.headers);
      const errorMessage = err.response?.data?.error || "An unexpected error occurred. Please check if the backend is running.";
      setError(errorMessage);
    }
  };

  // Redirect to Google OAuth endpoint
  const handleGoogleLogin = () => {
    console.log("DEBUG - Initiating Google OAuth login");
    console.log("Redirecting to: http://localhost:3000/auth/google");
    window.location.href = "http://localhost:3000/auth/google";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">Login</h2>

        {error && (
          <div className="bg-red-500 text-white p-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Manual Login Form */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div >
          <div className="mb-4 flex center">
          <Link to="/forgot-password" className="text-blue-500 hover:underline">
              Forgot Password?
                 </Link> 
                 </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition duration-300"
          >
            Login
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth2 Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white text-gray-900 py-2 rounded font-medium flex items-center justify-center transition duration-300 hover:bg-gray-100"
        >
          <FaGoogle className="mr-2" />
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
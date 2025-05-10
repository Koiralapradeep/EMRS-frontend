import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../Context/authContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    console.log("DEBUG - useEffect running with location.search:", location.search);
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token");
    const errorParam = urlParams.get("error");

    if (errorParam) {
      console.error("OAuth2 Error from Backend:", errorParam);
      let errorMessage = "OAuth2 Authentication Failed: ";
      if (errorParam === "user-not-found") {
        errorMessage += "User not found. Please register first.";
      } else if (errorParam === "server-error-jwt-secret-missing") {
        errorMessage += "Server error: JWT_SECRET is missing.";
      } else if (errorParam === "server-error-token-generation-failed") {
        errorMessage += "Server error: Failed to generate token.";
      } else {
        errorMessage += "Unknown server error.";
      }
      setError(errorMessage);
      return;
    }

    if (token) {
      console.log("DEBUG - OAuth2 Token received:", token);
      const validateToken = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          console.log("DEBUG - Response from /api/auth/me:", res.data);
          if (res.data?.success) {
            localStorage.setItem("token", token); // Store token only after validation
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            if (userData.role === "Admin") {
              navigate("/admin-dashboard", { replace: true });
            } else if (userData.role === "Manager") {
              navigate("/manager-dashboard", { replace: true });
            } else {
              navigate("/employee-dashboard", { replace: true });
            }
          } else {
            throw new Error("Invalid response from /api/auth/me");
          }
        } catch (err) {
          console.error("Error validating token:", err.message, err.response?.data);
          setError("Failed to validate OAuth token. Please try again.");
          localStorage.removeItem("token");
        }
      };
      validateToken();
    } else {
      console.log("DEBUG - No OAuth2 token found in URL query parameters.");
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        console.log("DEBUG - Found token in localStorage:", storedToken);
        const validateStoredToken = async () => {
          try {
            const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
              withCredentials: true,
            });
            console.log("DEBUG - Response from /api/auth/me (localStorage):", res.data);
            if (res.data?.success) {
              const userData = res.data.user;
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
              if (userData.role === "Admin") {
                navigate("/admin-dashboard", { replace: true });
              } else if (userData.role === "Manager") {
                navigate("/manager-dashboard", { replace: true });
              } else {
                navigate("/employee-dashboard", { replace: true });
              }
            } else {
              throw new Error("Invalid response from /api/auth/me");
            }
          } catch (err) {
            console.error("Error validating stored token:", err.message, err.response?.data);
            setError("Failed to fetch user data. Please log in again.");
            localStorage.removeItem("token");
          }
        };
        validateStoredToken();
      }
    }
  }, [navigate, setUser, location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      console.log("DEBUG - Sending login request to /api/auth/login");
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      }, {
        headers: { "Content-Type": "application/json" },
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
      if (user.role === "Admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (user.role === "Manager") {
        navigate("/manager-dashboard", { replace: true });
      } else {
        navigate("/employee-dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || "An unexpected error occurred.";
      setError(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    console.log("DEBUG - Initiating Google OAuth login");
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
          <div className="mb-4 relative">
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-4 py-2 rounded bg-gray-700 border border-gray-600 focus:ring-2 focus:ring-blue-500 pr-10"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 mt-6"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
            </button>
          </div>
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
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
          </div>
        </div>
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
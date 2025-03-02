import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../Context/authContext";
import { useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";

const Login = () => {
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check for token from Google OAuth redirect in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (token) {
      console.log("OAuth2 Token received:", token);
      localStorage.setItem("token", token);

      axios
        .get("http://localhost:3000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
        .then((res) => {
          if (res.data?.success) {
            const userData = res.data.user;
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            // Redirect based on user role
            if (userData.role === "Admin") {
              navigate("/admin-dashboard");
            } else if (userData.role === "Manager") {
              navigate("/manager-dashboard");
            } else {
              navigate("/employee-dashboard");
            }
          } else {
            setError("Unable to fetch user data via /me endpoint.");
          }
        })
        .catch((err) => {
          console.error("Invalid session. Please log in again.", err);
          localStorage.removeItem("token");
          setError("Invalid session. Please log in again.");
        });
    }
  }, [navigate, setUser]);

  // Handle manual login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:3000/api/auth/login", {
        email,
        password,
      });

      if (!response.data?.success || !response.data?.user) {
        setError("Login failed. No user data received.");
        return;
      }

      const { user, token } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      // Redirect based on role
      if (user.role === "Admin") {
        navigate("/admin-dashboard");
      } else if (user.role === "Manager") {
        navigate("/manager-dashboard");
      } else {
        navigate("/employee-dashboard");
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "An unexpected error occurred.");
    }
  };

  // Redirect to Google OAuth endpoint
  const handleGoogleLogin = () => {
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
        <form onSubmit={handleSubmit}>
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
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition duration-300"
          >
            Login
          </button>
        </form>

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

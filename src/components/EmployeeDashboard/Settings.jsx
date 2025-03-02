import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../Context/authContext";

const Settings = () => {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  const [setting, setSetting] = useState({
    userId: user?._id || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSetting((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (setting.newPassword !== setting.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log("Authorization Token:", token); // Debugging: Log token

      const response = await axios.put(
        "http://localhost:3000/api/setting/change-password",
        setting,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess("Password changed successfully.");
        setSetting({
          userId: user?._id || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setTimeout(() => navigate("/employee-dashboard"), 2000);
      } else {
        setError(response.data.error || "Failed to change password.");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.response?.data?.error || "Internal Server Error.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-6">
      <div className="bg-gray-800 text-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Change Password</h1>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {success && <p className="text-green-500 text-center mb-4">{success}</p>}

        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                name="currentPassword"
                value={setting.currentPassword}
                onChange={handleChange}
                placeholder="Enter Current Password"
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword.current ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                name="newPassword"
                value={setting.newPassword}
                onChange={handleChange}
                placeholder="Enter New Password"
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-gray-300 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                name="confirmPassword"
                value={setting.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm New Password"
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md transition duration-300"
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;

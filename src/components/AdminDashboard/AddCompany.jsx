import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../Context/authContext"; 

const AddCompany = () => {
  const { user } = useAuth();
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    industry: "",
    managerName: "",
    managerEmail: "",
    managerPassword: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCompanyData({ ...companyData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (
      !companyData.name ||
      !companyData.address ||
      !companyData.industry ||
      !companyData.managerName ||
      !companyData.managerEmail ||
      !companyData.managerPassword
    ) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication failed. Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:3000/api/company/create",
        companyData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Company created successfully!");
      setCompanyData({
        name: "",
        address: "",
        industry: "",
        managerName: "",
        managerEmail: "",
        managerPassword: "",
      });

      console.log("Company Created:", response.data);
    } catch (err) {
      console.error("Error adding company:", err);
      setError(err.response?.data?.error || "Failed to create company.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
      <h2 className="text-center text-xl font-semibold mb-4">Add Company</h2>
      
      {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
      {success && <p className="text-green-500 text-sm text-center mb-2">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input
            type="text"
            name="name"
            value={companyData.name}
            onChange={handleChange}
            required
            className="w-full p-2 mt-1 rounded-md bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Company Address */}
        <div>
          <label className="block text-sm font-medium">Company Address</label>
          <input
            type="text"
            name="address"
            value={companyData.address}
            onChange={handleChange}
            required
            className="w-full p-2 mt-1 rounded-md bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Industry Type */}
        <div>
          <label className="block text-sm font-medium">Industry Type</label>
          <input
            type="text"
            name="industry"
            value={companyData.industry}
            onChange={handleChange}
            required
            className="w-full p-2 mt-1 rounded-md bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <hr className="border-gray-600 my-4" />

        <h3 className="text-lg font-semibold">Assign Manager</h3>

        {/* Manager Name */}
        <div>
          <label className="block text-sm font-medium">Manager Name</label>
          <input
            type="text"
            name="managerName"
            value={companyData.managerName}
            onChange={handleChange}
            required
            className="w-full p-2 mt-1 rounded-md bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Manager Email */}
        <div>
          <label className="block text-sm font-medium">Manager Email</label>
          <input
            type="email"
            name="managerEmail"
            value={companyData.managerEmail}
            onChange={handleChange}
            required
            className="w-full p-2 mt-1 rounded-md bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Manager Password */}
        <div>
          <label className="block text-sm font-medium">Manager Password</label>
          <input
            type="password"
            name="managerPassword"
            value={companyData.managerPassword}
            onChange={handleChange}
            required
            className="w-full p-2 mt-1 rounded-md bg-gray-800 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-semibold transition duration-300"
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Company"}
        </button>
      </form>
    </div>
  );
};

export default AddCompany;

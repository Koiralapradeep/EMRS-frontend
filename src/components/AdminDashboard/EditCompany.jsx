import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditCompany = () => {
  const { id } = useParams(); // Get company ID from URL
  const navigate = useNavigate();
  const [company, setCompany] = useState({
    name: "",
    address: "",
    industry: "",
    managerName: "",
    managerEmail: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch company details
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Redirecting to login.");
          navigate("/login");
          return;
        }

        console.log("Fetching company with ID:", id);
        const response = await axios.get(`http://localhost:3000/api/company/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          const { name, address, industry, manager } = response.data.company;
          setCompany({
            name,
            address,
            industry,
            managerName: manager ? manager.name : "",
            managerEmail: manager ? manager.email : "",
          });
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
        setError("Failed to load company data.");
      }
    };

    if (id) {
      fetchCompany();
    }
  }, [id, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    setCompany({ ...company, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:3000/api/company/${id}`,
        company,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Company updated successfully!");
        navigate("/admin-dashboard/companies");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      setError("Failed to update company.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Edit Company</h2>

      {error && <p className="text-red-500">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-gray-300">Company Name</label>
          <input
            type="text"
            name="name"
            value={company.name}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        {/* Company Address */}
        <div>
          <label className="block text-gray-300">Company Address</label>
          <input
            type="text"
            name="address"
            value={company.address}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        {/* Industry Type */}
        <div>
          <label className="block text-gray-300">Industry Type</label>
          <input
            type="text"
            name="industry"
            value={company.industry}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        <h3 className="text-xl font-bold text-white mt-4">Assign Manager</h3>

        {/* Manager Name */}
        <div>
          <label className="block text-gray-300">Manager Name</label>
          <input
            type="text"
            name="managerName"
            value={company.managerName}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        {/* Manager Email */}
        <div>
          <label className="block text-gray-300">Manager Email</label>
          <input
            type="email"
            name="managerEmail"
            value={company.managerEmail}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full p-2 rounded text-white ${
            loading ? "bg-gray-500" : "bg-blue-500 hover:bg-blue-600"
          }`}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Company"}
        </button>
      </form>
    </div>
  );
};

export default EditCompany;

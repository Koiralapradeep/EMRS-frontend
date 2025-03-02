import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Redirecting to login.");
          navigate("/login");
          return;
        }

        // Decode the token to check the user's role
        const decodedToken = JSON.parse(atob(token.split(".")[1]));
        if (decodedToken.role !== "Admin") {
          console.error("Unauthorized access. Only Admins can fetch companies.");
          return;
        }

        // Correct endpoint: /api/companies
        const response = await axios.get("http://localhost:3000/api/company", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setCompanies(response.data.companies);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, [navigate]);

  // Handle Search Filter
  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Companies</h2>
        <Link to="/admin-dashboard/add-company">
          <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded">
            Add Company
          </button>
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search companies..."
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-gray-300 border-b border-gray-600">
              <th className="p-2">S.No</th>
              <th className="p-2">Company Name</th>
              <th className="p-2">Address</th>
              <th className="p-2">Industry</th>
              <th className="p-2">Manager</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.length > 0 ? (
              filteredCompanies.map((company, index) => (
                <tr key={company._id} className="border-b border-gray-700">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{company.name}</td>
                  <td className="p-2">{company.address}</td>
                  <td className="p-2">{company.industry}</td>
                  <td className="p-2">
                    {company.manager ? company.manager.name : "No Manager Assigned"}
                  </td>
                  <td className="p-2">
                    <Link to={`/admin-dashboard/edit-company/${company._id}`}>
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded mr-2 hover:bg-yellow-600">
                        Edit
                      </button>
                    </Link>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => console.log("Delete company", company._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-400">
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Companies;
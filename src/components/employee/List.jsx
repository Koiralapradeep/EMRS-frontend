import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const List = () => {
  const [employees, setEmployees] = useState([]); // State for storing employees
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [error, setError] = useState(null); // State for error messages
  const navigate = useNavigate();

  // Fetch employees when the component mounts
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true); // Start loading
        setError(null); // Clear any previous errors

        // Get the token from localStorage
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found. Please log in again.");
          navigate("/login"); // Redirect to login if no token
          return;
        }

        // Make the API call to fetch employees
        const response = await axios.get("http://localhost:3000/api/employee", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Log the response for debugging
        console.log("API Response:", response.data);

        // Check if the response contains employees
        if (response.data.success && Array.isArray(response.data.employees)) {
          setEmployees(response.data.employees);
        } else {
          setEmployees([]); // Set to empty array if no employees are returned
          setError("No employees found in the response.");
        }
      } catch (error) {
        // Handle different types of errors
        console.error("Error fetching employees:", error.response?.data || error.message);
        if (error.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("token"); // Clear invalid token
          navigate("/login"); // Redirect to login
        } else if (error.response?.status === 403) {
          setError("You are not authorized to view employees.");
        } else if (error.response?.status === 404) {
          setError("No employees found for this company.");
          setEmployees([]); // Ensure employees is empty
        } else {
          setError("Failed to fetch employees. Please try again later.");
        }
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchEmployees();
  }, [navigate]);

  // Handle employee deletion
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this employee?");
    if (!confirmDelete) return;

    try {
      setError(null); // Clear any previous errors
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please log in again.");
        navigate("/login");
        return;
      }

      // Make the API call to delete the employee
      const response = await axios.delete(`http://localhost:3000/api/employee/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Remove the deleted employee from the state
        setEmployees((prev) => prev.filter((emp) => emp._id !== id));
        alert("Employee deleted successfully.");
      } else {
        setError(response.data.error || "Failed to delete employee.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        setError("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(error.response?.data?.error || "Failed to delete employee.");
      }
    }
  };

  // Filter employees based on the search term
  const filteredEmployees = employees.filter((employee) =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        <button
          onClick={() => navigate("/manager-dashboard/add-employee")}
          className="bg-teal-500 py-2 px-4 rounded hover:bg-teal-600"
        >
          Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white rounded">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center text-lg">Loading employees...</div>
      ) : (
        <table className="w-full bg-gray-800 rounded-lg text-white">
          <thead>
            <tr>
              <th className="p-3">S.No</th>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">DOB</th>
              <th className="p-3">Department</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee, index) => (
                <tr key={employee._id} className="text-center">
                  <td className="p-3">{index + 1}</td>
                  <td className="p-3">
                    <img
                      src={`http://localhost:3000/public/uploads/${employee.image}`}
                      alt={employee.fullName}
                      className="w-10 h-10 rounded-full mx-auto"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/40"; // Fallback image if the employee image fails to load
                      }}
                    />
                  </td>
                  <td className="p-3">{employee.fullName}</td>
                  <td className="p-3">
                    {employee.dob
                      ? new Date(employee.dob).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-3">
                    {employee.department?.departmentName || "N/A"}
                  </td>
                  <td className="p-3 flex justify-center gap-2">
                    <button
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded"
                      onClick={() =>
                        navigate(`/manager-dashboard/view-employee/${employee._id}`)
                      }
                    >
                      View
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                      onClick={() =>
                        navigate(`/manager-dashboard/edit-employee/${employee._id}`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                      onClick={() => handleDelete(employee._id)}
                    >
                      Delete
                    </button>
                    <button
                      className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1 rounded"
                      onClick={() =>
                        navigate("/manager-dashboard/view-leave", {
                          state: { userId: employee.userId },
                        })
                      }
                    >
                      Leave
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-3 text-center">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default List;
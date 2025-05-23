import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const View = () => {
  const { userId } = useParams();
  console.log(`URL parameter userId: ${userId}`);

  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployeeById = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Redirecting to login.");
          setError("No token found. Please log in again.");
          navigate("/login");
          return;
        }
    
        console.log("Token from localStorage:", token);
        console.log("Fetching employee profile for userId:", userId);
    
        // Include the userId in the API request
        const response = await axios.get(
          `http://localhost:3000/api/employee/${userId}`, // Pass the userId in the URL
          { headers: { Authorization: `Bearer ${token}` } }
        );
    
        console.log("Backend response:", response.data);
    
        if (response.data.success) {
          // Check if an employee object is returned
          if (response.data.employee) {
            const fetchedEmployee = response.data.employee;
            console.log("Employee fetched successfully:", fetchedEmployee);
            setEmployee(fetchedEmployee);
          } else {
            console.error("No employee found in the response.");
            setError("No employee found in the response.");
          }
        } else {
          console.error("Backend error:", response.data.error);
          setError(response.data.error || "Failed to fetch employee profile.");
        }
      } catch (err) {
        console.error("Error fetching employee by ID:", err.response?.data || err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else if (err.response?.status === 403) {
          setError("You are not authorized to view this profile.");
        } else if (err.response?.status === 404) {
          setError("Employee profile not found. Please ensure the profile exists.");
        } else {
          setError(err.response?.data?.error || "Failed to fetch employee profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeById();
  }, [navigate]);

  if (loading) {
    return <p className="text-white text-center">Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  if (!employee) {
    return <p className="text-gray-400 text-center">No employee found.</p>;
  }

  return (
    <div className="flex justify-center items-start pt-10 bg-gray-900 min-h-screen">
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-md shadow-xl rounded-lg p-6 w-full max-w-4xl hover:shadow-2xl transition-shadow duration-300">
        <h2 className="text-2xl font-bold text-center text-teal-400 mb-6 tracking-wide">
          Employee Details
        </h2>

        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          <div className="flex-shrink-0">
            {employee.image ? (
              <img
                src={`http://localhost:3000/public/uploads/${employee.image}`}
                alt={employee.fullName}
                className="w-36 h-36 rounded-full object-cover border-4 border-teal-400 shadow-md"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150"; // Fallback image if the employee image fails to load
                }}
              />
            ) : (
              <div className="w-36 h-36 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-xl font-bold">
                No Image
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-0 grid grid-cols-2 gap-6 text-white w-full">
            <p>
              <span className="font-semibold">Name:</span> {employee.fullName || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {employee.email || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Employee ID:</span> {employee.employeeID || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Department:</span>{" "}
              {employee.department?.departmentName || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Designation:</span> {employee.designation || "N/A"}
            </p>
            <p>
              <span className="font-semibold">DOB:</span>{" "}
              {employee.dob ? new Date(employee.dob).toLocaleDateString() : "N/A"}
            </p>
            <p>
              <span className="font-semibold">Gender:</span> {employee.gender || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Marital Status:</span>{" "}
              {employee.maritalStatus || "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default View;
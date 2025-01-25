import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const View = () => {
  const { userId } = useParams(); // Get userId from route
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEmployeeByUserId = async () => {
      try {
        console.log("User ID from route params:", userId); // Log the userId from params
        const response = await axios.get(`http://localhost:3000/api/employee/user/${userId}`);
        if (response.data.success) {
          setEmployee(response.data.employee);
        } else {
          setError(response.data.error || "Failed to fetch employee");
        }
      } catch (err) {
        console.error("Error fetching employee by userId:", err);
        setError("Failed to fetch employee");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEmployeeByUserId();
    }
  }, [userId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!employee) {
    return <p>No employee found.</p>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg shadow-lg rounded-lg p-8 w-96 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">My Profile</h2>
        <div className="flex justify-center mb-4">
          {employee.image ? (
            <img
              src={`http://localhost:3000/public/uploads/${employee.image}`}
              alt={employee.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              No Image
            </div>
          )}
        </div>
        <div className="space-y-3 text-white">
          <p>
            <span className="font-semibold">Name:</span> {employee.fullName}
          </p>
          <p>
            <span className="font-semibold">Email:</span> {employee.email}
          </p>
          <p>
            <span className="font-semibold">Employee ID:</span> {employee.employeeID}
          </p>
          <p>
            <span className="font-semibold">Department:</span> {employee.department?.departmentName || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Designation:</span> {employee.designation}
          </p>
          <p>
            <span className="font-semibold">DOB:</span> {new Date(employee.dob).toLocaleDateString()}
          </p>
          <p>
            <span className="font-semibold">Gender:</span> {employee.gender}
          </p>
          <p>
            <span className="font-semibold">Marital Status:</span> {employee.maritalStatus}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {employee.role}
          </p>
        </div>
      </div>
    </div>
  );
};

export default View;

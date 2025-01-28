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
    <div className="flex justify-center items-start pt-10 bg-gray-900 min-h-screen">
      <div className="bg-gray-800 bg-opacity-90 backdrop-blur-md shadow-xl rounded-lg p-6 w-full max-w-4xl hover:shadow-2xl transition-shadow duration-300">
        {/* Header */}
        <h2 className="text-2xl font-bold text-center text-teal-400 mb-6 tracking-wide">
          Employee Details
        </h2>
        {/* Content */}
        <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            {employee.image ? (
              <img
                src={`http://localhost:3000/public/uploads/${employee.image}`}
                alt={employee.fullName}
                className="w-36 h-36 rounded-full object-cover border-4 border-teal-400 shadow-md"
              />
            ) : (
              <div className="w-36 h-36 rounded-full bg-gray-300 flex items-center justify-center text-gray-500 text-xl font-bold">
                No Image
              </div>
            )}
          </div>
          {/* Details */}
          <div className="mt-6 md:mt-0 grid grid-cols-2 gap-6 text-white w-full">
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
    </div>
  );
};

export default View;

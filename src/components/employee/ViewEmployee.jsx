import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ViewEmployee = () => {
  const { id } = useParams(); // expects the Employee document's _id
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Redirecting to login.");
          navigate("/login");
          return;
        }
        // Call GET /api/employee/:id
        const response = await axios.get(`http://localhost:3000/api/employee/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setEmployee(response.data.employee);
        } else {
          console.error("Error fetching employee:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching employee:", error.response?.data || error);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  if (!employee) {
    return <p className="text-white text-center">Loading...</p>;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-1/2 text-gray-800">
        <h2 className="text-2xl font-bold mb-6 text-center border-b pb-4">
          Employee Details
        </h2>
        <div className="flex items-start space-x-8">
          {/* Employee Photo */}
          {employee.image ? (
            <img
              src={`http://localhost:3000/public/uploads/${employee.image}`}
              alt={employee.fullName}
              className="w-36 h-36 rounded-full object-cover border-2 border-gray-400"
            />
          ) : (
            <div className="w-36 h-36 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
              No Image
            </div>
          )}
          {/* Employee Information */}
          <div className="text-left flex-grow">
            <div className="mb-4">
              <span className="font-bold">Name:</span> {employee.fullName}
            </div>
            <div className="mb-4">
              <span className="font-bold">Email:</span> {employee.email}
            </div>
            <div className="mb-4">
              <span className="font-bold">Date of Birth:</span>{" "}
              {new Date(employee.dob).toLocaleDateString()}
            </div>
            <div className="mb-4">
              <span className="font-bold">Gender:</span> {employee.gender}
            </div>
            <div className="mb-4">
              <span className="font-bold">Marital Status:</span> {employee.maritalStatus}
            </div>
            <div className="mb-4">
              <span className="font-bold">Designation:</span> {employee.designation}
            </div>
            <div className="mb-4">
              <span className="font-bold">Department:</span>{" "}
              {employee.department?.departmentName || "N/A"}
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate("/manager-dashboard/employee")}
            className="bg-red-500 text-white py-2 px-6 rounded hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewEmployee;

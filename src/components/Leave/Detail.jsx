import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const Detail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const leave = location.state;

  const changeStatus = async (leaveId, status) => {
    try {
      const response = await axios.put(
        `http://localhost:3000/api/leave/${leaveId}/status`,
        { status },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        alert(`Leave has been ${status.toLowerCase()} successfully.`);
        navigate(-1); // Navigate back after successful update
      } else {
        alert("Failed to update leave status.");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("An error occurred while updating leave status.");
    }
  };

  console.log("Leave Details:", leave);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Leave Details
        </h2>
        <div className="space-y-6 text-gray-700 text-lg">
          <p>
            <span className="font-semibold">Name:</span> {leave.name}
          </p>
          <p>
            <span className="font-semibold">Employee ID:</span> {leave.empId}
          </p>
          <p>
            <span className="font-semibold">Leave Type:</span> {leave.leaveType}
          </p>
          <p>
            <span className="font-semibold">Reason:</span>{" "}
            {leave.description || "Not specified"}
          </p>
          <p>
            <span className="font-semibold">Department:</span> {leave.department}
          </p>
          <p>
            <span className="font-semibold">Start Date:</span>{" "}
            {new Date(leave.fromDate).toLocaleDateString()}
          </p>
          <p>
            <span className="font-semibold">End Date:</span>{" "}
            {new Date(leave.toDate).toLocaleDateString()}
          </p>
          <div className="flex items-center space-x-3">
            <span className="text-lg font-bold">Status:</span>
            {leave.status === "Pending" ? (
              <div className="flex space-x-4">
                <button
                  onClick={() => changeStatus(leave._id, "Approved")}
                  className="px-5 py-2 bg-teal-500 text-white rounded-lg shadow hover:bg-teal-600 focus:outline-none focus:ring focus:ring-teal-300 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => changeStatus(leave._id, "Rejected")}
                  className="px-5 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-300 transition"
                >
                  Reject
                </button>
              </div>
            ) : (
              <span className="px-4 py-1 rounded-full text-sm font-medium inline-block bg-gray-200 text-gray-800">
                {leave.status}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-8">
          <button
            onClick={() => navigate(-1)}
            className="bg-red-500 text-white px-6 py-3 rounded-lg shadow hover:bg-red-600 focus:outline-none focus:ring focus:ring-red-300 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Detail;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const LeaveList = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        if (!user?._id) {
          setError("User ID not found. Please log in again.");
          console.error("User ID not found in localStorage:", user);
          return;
        }

        console.log("Fetching leaves for userId:", user._id);
        const token = localStorage.getItem("token") || localStorage.getItem("jwt");
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          console.error("Token not found in localStorage");
          return;
        }
        console.log("Token for fetch:", token);

        const response = await axios.get(
          `http://localhost:3000/api/leave/employee/${user._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        console.log("Fetch leaves response:", response.data);

        if (response.data.success && Array.isArray(response.data.leaves)) {
          setLeaves(response.data.leaves);
          setFilteredLeaves(response.data.leaves);
        } else {
          setLeaves([]);
          setFilteredLeaves([]);
          setError(response.data.message || "Failed to fetch leave requests.");
        }
      } catch (err) {
        console.error("Error fetching leaves:", err.response?.data || err.message);
        setLeaves([]);
        setFilteredLeaves([]);
        setError("Failed to fetch leave requests.");
      }
    };

    if (user) {
      fetchLeaves();
    } else {
      setError("User is not logged in.");
      console.error("User not found in localStorage");
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLeaves(leaves);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = leaves.filter(
        (leave) =>
          (leave.leaveType?.toLowerCase().includes(lowerCaseQuery) || false) ||
          (leave.description?.toLowerCase().includes(lowerCaseQuery) || false) ||
          (leave.status?.toLowerCase().includes(lowerCaseQuery) || false) ||
          (leave.fromDate && new Date(leave.fromDate).toLocaleDateString().includes(lowerCaseQuery)) ||
          (leave.toDate && new Date(leave.toDate).toLocaleDateString().includes(lowerCaseQuery))
      );
      setFilteredLeaves(filtered);
    }
  }, [searchQuery, leaves]);

  // Function to handle leave cancellation
  const handleCancelLeave = async (leaveId) => {
    // Show confirmation popup
    const confirmCancel = window.confirm("Are you sure you want to cancel this leave request?");
    if (!confirmCancel) {
      return; // Exit if user cancels the action
    }

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await axios.delete(
        `http://localhost:3000/api/leave/${leaveId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        // Remove the canceled leave from the state
        const updatedLeaves = leaves.filter((leave) => leave._id !== leaveId);
        setLeaves(updatedLeaves);
        setFilteredLeaves(updatedLeaves);
      } else {
        setError(response.data.message || "Failed to cancel leave.");
      }
    } catch (err) {
      console.error("Error canceling leave:", err.response?.data || err.message);
      setError("Failed to cancel leave.");
    }
  };

  return (
    <div className="flex flex-col p-4 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">Manage Leave</h1>
        <button
          onClick={() => navigate("/employee-dashboard/add-leave")}
          className="bg-teal-500 py-2 px-4 rounded text-white hover:bg-teal-600"
        >
          Add Leave
        </button>
      </div>

      <input
        type="text"
        placeholder="Search leaves..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 mb-4"
      />

      <div className="overflow-x-auto">
        <table className="table-auto w-full text-left border border-gray-700 bg-gray-800 text-white rounded-lg">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="px-4 py-2 border border-gray-600">S.No</th>
              <th className="px-4 py-2 border border-gray-600">Leave Type</th>
              <th className="px-4 py-2 border border-gray-600">From</th>
              <th className="px-4 py-2 border border-gray-600">To</th>
              <th className="px-4 py-2 border border-gray-600">Description</th>
              <th className="px-4 py-2 border border-gray-600">Applied Date</th>
              <th className="px-4 py-2 border border-gray-600">Status</th>
              <th className="px-4 py-2 border border-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave, index) => (
                <tr key={leave._id} className="hover:bg-gray-700">
                  <td className="px-4 py-2 border border-gray-600">{index + 1}</td>
                  <td className="px-4 py-2 border border-gray-600">{leave.leaveType || "N/A"}</td>
                  <td className="px-4 py-2 border border-gray-600">
                    {leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">
                    {leave.toDate ? new Date(leave.toDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">{leave.description || "N/A"}</td>
                  <td className="px-4 py-2 border border-gray-600">
                    {leave.appliedDate ? new Date(leave.appliedDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">
                    <span
                      className={`px-3 py-1 rounded text-white ${
                        leave.status === "Approved"
                          ? "bg-green-500"
                          : leave.status === "Rejected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {leave.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2 border border-gray-600">
                    {leave.status === "Pending" && (
                      <button
                        onClick={() => handleCancelLeave(leave._id)}
                        className="bg-red-500 py-1 px-3 rounded text-white hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-2 border border-gray-600 text-center text-gray-400">
                  {error || "No leave requests found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveList;
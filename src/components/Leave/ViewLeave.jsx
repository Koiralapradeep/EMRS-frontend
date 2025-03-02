import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const ViewLeave = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Retrieve the userId from the location state
  const employeeId = location.state?.userId;

  useEffect(() => {
    const fetchLeaves = async () => {
      if (!employeeId) {
        setError("No employee ID provided.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token provided. Please login again.");
        return;
      }

      try {
        // Call the "employee/:employeeId" route
        const response = await axios.get(
          `http://localhost:3000/api/leave/employee/${employeeId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setLeaves(response.data.leaves);
          setFilteredLeaves(response.data.leaves);
        } else {
          setError(response.data.error || "Failed to fetch leave requests.");
        }
      } catch (err) {
        console.error("Error fetching leaves:", err);
        setError("Internal Server Error.");
      }
    };

    fetchLeaves();
  }, [employeeId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLeaves(leaves);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = leaves.filter((leave) =>
        leave.leaveType.toLowerCase().includes(lowerCaseQuery) ||
        leave.description?.toLowerCase().includes(lowerCaseQuery) ||
        leave.status?.toLowerCase().includes(lowerCaseQuery) ||
        new Date(leave.fromDate).toLocaleDateString().includes(lowerCaseQuery) ||
        new Date(leave.toDate).toLocaleDateString().includes(lowerCaseQuery)
      );
      setFilteredLeaves(filtered);
    }
  }, [searchQuery, leaves]);

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leave Requests</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Back
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
        <table className="table-auto w-full bg-gray-800 rounded-lg text-white">
          <thead>
            <tr>
              <th className="px-4 py-2">S.No</th>
              <th className="px-4 py-2">Leave Type</th>
              <th className="px-4 py-2">From</th>
              <th className="px-4 py-2">To</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Applied Date</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave, index) => (
                <tr key={leave._id} className="hover:bg-gray-700">
                  <td className="px-4 py-2">{index + 1}</td>
                  <td className="px-4 py-2">{leave.leaveType}</td>
                  <td className="px-4 py-2">
                    {new Date(leave.fromDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(leave.toDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{leave.description || "N/A"}</td>
                  <td className="px-4 py-2">
                    {leave.appliedDate
                      ? new Date(leave.appliedDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-3 py-1 rounded text-white ${
                        leave.status === "Approved"
                          ? "bg-green-500"
                          : leave.status === "Rejected"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-2 text-center text-gray-400">
                  {error || "No leave requests found for this employee."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewLeave;

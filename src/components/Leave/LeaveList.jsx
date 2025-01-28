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
  const userId = user?._id;

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/leave/", {
          params: { userId },
        });

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

    if (userId) {
      fetchLeaves();
    } else {
      setError("User is not logged in.");
    }
  }, [userId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredLeaves(leaves);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = leaves.filter((leave) =>
        leave.leaveType.toLowerCase().includes(lowerCaseQuery) ||
        leave.description.toLowerCase().includes(lowerCaseQuery) ||
        leave.status?.toLowerCase().includes(lowerCaseQuery) ||
        new Date(leave.fromDate).toLocaleDateString().includes(lowerCaseQuery) ||
        new Date(leave.toDate).toLocaleDateString().includes(lowerCaseQuery)
      );
      setFilteredLeaves(filtered);
    }
  }, [searchQuery, leaves]);

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
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave, index) => (
                <tr key={leave._id} className="hover:bg-gray-700">
                  <td className="px-4 py-2 border border-gray-600">{index + 1}</td>
                  <td className="px-4 py-2 border border-gray-600">{leave.leaveType}</td>
                  <td className="px-4 py-2 border border-gray-600">
                    {leave.fromDate ? new Date(leave.fromDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">
                    {leave.toDate ? new Date(leave.toDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">{leave.description || "N/A"}</td>
                  <td className="px-4 py-2 border border-gray-600">
                    {leave.appliedDate
                      ? new Date(leave.appliedDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2 border border-gray-600">
                    <span className="bg-yellow-500 px-3 py-1 rounded text-white">
                      {leave.status || "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-4 py-2 border border-gray-600 text-center text-gray-400">
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

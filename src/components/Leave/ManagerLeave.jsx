import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ManagerLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/leave");

        if (response.data.success) {
          setLeaves(response.data.leaves);
        } else {
          setError("Failed to fetch leave requests.");
        }
      } catch (err) {
        console.error("Error fetching leaves:", err.message);
        setError("Internal Server Error.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

  const filteredLeaves =
    filter === "All" ? leaves : leaves.filter((leave) => leave.status === filter);

  const searchedLeaves = filteredLeaves.filter(
    (leave) =>
      leave.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Manage Leaves</h1>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <div className="bg-gray-800 rounded shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Search by Department or Name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 w-1/3 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="space-x-2">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded ${
                    filter === status
                      ? "bg-teal-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-teal-500 hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table-auto w-full text-left border border-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2">S.No</th>
                  <th className="px-4 py-2">Emp ID</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Leave Type</th>
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">From</th>
                  <th className="px-4 py-2">To</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {searchedLeaves.length > 0 ? (
                  searchedLeaves.map((leave, index) => (
                    <tr key={leave._id} className="hover:bg-gray-700">
                      <td className="px-4 py-2">{index + 1}</td>
                      <td className="px-4 py-2">{leave.empId}</td>
                      <td className="px-4 py-2">{leave.name}</td>
                      <td className="px-4 py-2">{leave.leaveType}</td>
                      <td className="px-4 py-2">{leave.department}</td>
                      <td className="px-4 py-2">
                        {new Date(leave.fromDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {new Date(leave.toDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-3 py-1 text-white rounded ${
                            leave.status === "Pending"
                              ? "bg-yellow-500"
                              : leave.status === "Approved"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="bg-blue-500 text-white px-4 py-1 rounded"
                          onClick={() => navigate(`/manager-dashboard/detail`, { state: leave })}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center text-gray-400 py-4">
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerLeave;

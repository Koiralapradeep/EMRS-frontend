import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../Context/authContext"; // Import useAuth to get user details

const ManagerLeave = () => {
  const { user } = useAuth(); // Get user details from auth context
  const [leaves, setLeaves] = useState([]);
  const [filteredLeaves, setFilteredLeaves] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (user?.companyId) {
      fetchLeaves();
    } else {
      setError("User company ID not found.");
    }
  }, [user]);

  // Fetch all leaves for the company
  const fetchLeaves = async () => {
    try {
      console.log("Fetching leaves for companyId:", user.companyId);
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      console.log("Token for fetch:", token);

      const response = await axios.get(
        `http://localhost:3000/api/leave/company/${user.companyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      console.log("Fetch leaves response:", response.data);

      // Check if success is true and leaves is an array
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

  // Filter leaves based on status + search
  const applyFilters = (status) => {
    let filtered = leaves;

    // Filter by status
    if (status !== "All") {
      filtered = filtered.filter((leave) => leave.status === status);
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (leave) =>
          leave.employeeID?.toLowerCase().includes(lower) ||
          leave.userId?.name?.toLowerCase().includes(lower) ||
          leave.department?.toLowerCase().includes(lower)
      );
    }

    setFilteredLeaves(filtered);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
    applyFilters(filterStatus);
  };

  const handleFilterClick = (status) => {
    setFilterStatus(status);
    applyFilters(status);
  };

  // View leave details in modal
  const viewLeaveDetails = (leave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  // Delete leave
  const deleteLeave = async (leaveId) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      const response = await axios.delete(
        `http://localhost:3000/api/leave/${leaveId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        const updatedLeaves = leaves.filter((l) => l._id !== leaveId);
        setLeaves(updatedLeaves);
        setFilteredLeaves(updatedLeaves.filter(leaveMatchesCurrentFilter));
        alert("Leave deleted successfully.");
      } else {
        alert(response.data.message || "Failed to delete leave.");
      }
    } catch (err) {
      alert("Internal Server Error. Could not delete leave.");
    }
  };

  // Approve/Reject leave
  const updateLeaveStatus = async (leaveId, status) => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("jwt");
      const response = await axios.put(
        `http://localhost:3000/api/leave/${leaveId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const updatedLeaves = leaves.map((l) =>
          l._id === leaveId ? { ...l, status } : l
        );
        setLeaves(updatedLeaves);
        setFilteredLeaves(updatedLeaves.filter(leaveMatchesCurrentFilter));
        setModalVisible(false);
        alert(`Leave successfully ${status.toLowerCase()}!`);
      } else {
        alert(response.data.message || "Failed to update leave status.");
      }
    } catch (err) {
      alert("Internal Server Error. Could not update leave status.");
    }
  };

  // Check if a leave matches current filter
  const leaveMatchesCurrentFilter = (leave) => {
    if (filterStatus === "All") return true;
    return leave.status === filterStatus;
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Manage Leaves</h1>
      {error && <p className="text-red-500">{error}</p>}

      <div className="flex items-center justify-between mb-6">
        <input
          type="text"
          placeholder="Search by Department or Name..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-1/3 p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-4">
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                filterStatus === status
                  ? "bg-teal-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-teal-500 hover:text-white"
              }`}
              onClick={() => handleFilterClick(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table-auto w-full bg-gray-800 rounded-lg text-white border border-gray-700">
          <thead>
            <tr className="bg-gray-700 text-left text-sm font-semibold">
              <th className="px-4 py-3 text-center">S.No</th>
              <th className="px-4 py-3">Emp ID</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Leave Type</th>
              <th className="px-4 py-3">From</th>
              <th className="px-4 py-3">To</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.map((leave, index) => (
              <tr
                key={leave._id}
                className="hover:bg-gray-700 border-b border-gray-600 last:border-b-0"
              >
                <td className="px-4 py-3 text-center">{index + 1}</td>
                <td className="px-4 py-3">{leave.employeeID || "N/A"}</td>
                <td className="px-4 py-3">{leave.userId?.name || "N/A"}</td>
                <td className="px-4 py-3">{leave.department || "N/A"}</td>
                <td className="px-4 py-3">{leave.leaveType}</td>
                <td className="px-4 py-3">
                  {new Date(leave.fromDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {new Date(leave.toDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-4 py-1 rounded-lg font-medium ${
                      leave.status === "Approved"
                        ? "bg-green-600 text-white"
                        : leave.status === "Rejected"
                        ? "bg-red-600 text-white"
                        : "bg-yellow-600 text-black"
                    }`}
                  >
                    {leave.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center flex justify-center gap-2">
                  <button
                    onClick={() => viewLeaveDetails(leave)}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-md text-sm"
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteLeave(leave._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for viewing details & approving/rejecting */}
      {modalVisible && selectedLeave && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg text-white w-1/2">
            <h2 className="text-2xl font-bold mb-4">Leave Details</h2>
            <p>
              <strong>Employee ID:</strong> {selectedLeave.employeeID || "N/A"}
            </p>
            <p>
              <strong>Name:</strong> {selectedLeave.userId?.name || "N/A"}
            </p>
            <p>
              <strong>Department:</strong> {selectedLeave.department || "N/A"}
            </p>
            <p>
              <strong>Leave Type:</strong> {selectedLeave.leaveType}
            </p>
            <p>
              <strong>From:</strong>{" "}
              {new Date(selectedLeave.fromDate).toLocaleDateString()}
            </p>
            <p>
              <strong>To:</strong>{" "}
              {new Date(selectedLeave.toDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Status:</strong> {selectedLeave.status}
            </p>

            {selectedLeave.status === "Pending" ? (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() =>
                    updateLeaveStatus(selectedLeave._id, "Approved")
                  }
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    updateLeaveStatus(selectedLeave._id, "Rejected")
                  }
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
                >
                  Reject
                </button>
              </div>
            ) : (
              <p className="mt-4 text-lg font-medium">
                This leave has already been{" "}
                {selectedLeave.status.toLowerCase()}.
              </p>
            )}

            <button
              onClick={() => setModalVisible(false)}
              className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerLeave;
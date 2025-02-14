import React, { useState, useEffect } from "react";
import axios from "axios";

const ManagerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filters, setFilters] = useState({ search: "" });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [error, setError] = useState("");

  // Fetch all feedback records on component mount
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/feedback/manager");
      if (response.data.success) {
        console.log("🟢 API Response:", response.data.feedbacks);
        setFeedbacks(response.data.feedbacks);
      } else {
        console.error("❌ Failed to fetch feedbacks:", response.data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching feedbacks:", error);
      setFeedbacks([]);
    }
  };

  // Handle search input
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setFilters((prev) => ({ ...prev, search: searchTerm }));
  };

  // Open modal to view details
  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedFeedback(null);
  };

  // Delete feedback
  const handleDelete = async (feedbackId) => {
    try {
      setError("");
      const response = await axios.delete(`http://localhost:3000/api/feedback/${feedbackId}`);
      if (response.data.success) {
        // Remove the deleted feedback from state
        setFeedbacks((prev) => prev.filter((fb) => fb._id !== feedbackId));
      } else {
        setError(response.data.message || "Failed to delete feedback.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Internal Server Error.");
    }
  };

  // Filter feedbacks by search term (Employee Name or Department)
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const name = fb.makePrivate ? "unknown" : fb.userId?.name?.toLowerCase() || "";
    const department = fb.makePrivate ? "unknown" : fb.department?.toLowerCase() || "";
    return name.includes(filters.search) || department.includes(filters.search);
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white px-4 py-6">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Employee Feedback</h1>

        {/* Search Filter */}
        <div className="flex justify-start mb-6">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleSearch}
            placeholder="Search by Employee Name or Department..."
            className="p-3 w-72 rounded bg-gray-800 text-white border border-gray-600 
                       focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Error Display */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Feedback Table */}
        <h2 className="text-xl font-bold mb-4">Feedback Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-gray-700 rounded-md mb-6">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Work Summary</th>
                <th className="py-3 px-4">Challenges</th>
                <th className="py-3 px-4">Suggestions</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedbacks.length > 0 ? (
                filteredFeedbacks.map((fb, index) => (
                  <tr key={fb._id} className="border-b border-gray-600 hover:bg-gray-600 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4">
                      {fb.makePrivate ? "Unknown" : fb.userId?.name || "Unknown"}
                    </td>
                    <td className="py-3 px-4">
                      {fb.makePrivate ? "Unknown" : fb.department || "Not Assigned"}
                    </td>
                    <td className="py-3 px-4">{new Date(fb.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {fb.accomplishments?.slice(0, 20) || "No data"}...
                    </td>
                    <td className="py-3 px-4">
                      {fb.challenges?.slice(0, 20) || "No data"}...
                    </td>
                    <td className="py-3 px-4">
                      {fb.suggestions?.slice(0, 20) || "No data"}...
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => handleView(fb)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white 
                                   rounded-md hover:bg-blue-600 focus:outline-none"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(fb._id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white 
                                   rounded-md hover:bg-red-600 focus:outline-none"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-3 px-4 text-center text-gray-400">
                    No feedback found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Viewing Detailed Feedback */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={handleCloseModal}
        >
          {/* Stop click from closing if user clicks inside the modal */}
          <div
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Feedback Details</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Employee:</span>{" "}
                {selectedFeedback.makePrivate ? "Unknown" : selectedFeedback.userId?.name || "Unknown"}
              </p>
              <p>
                <span className="font-semibold">Department:</span>{" "}
                {selectedFeedback.makePrivate ? "Unknown" : selectedFeedback.department || "Not Assigned"}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(selectedFeedback.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold">Accomplishments:</span>{" "}
                {selectedFeedback.accomplishments}
              </p>
              <p>
                <span className="font-semibold">Challenges:</span>{" "}
                {selectedFeedback.challenges}
              </p>
              <p>
                <span className="font-semibold">Suggestions:</span>{" "}
                {selectedFeedback.suggestions}
              </p>
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFeedback;

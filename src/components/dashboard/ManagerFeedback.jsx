import React, { useState, useEffect } from "react";
import axios from "axios";

const ManagerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filters, setFilters] = useState({ search: "" });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage. User might be logged out.");
        return;
      }

      console.log(" Using token:", token);

      const response = await axios.get("http://localhost:3000/api/feedback/manager", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(" API Response:", response.data);

      if (response.data.success) {
        setFeedbacks(response.data.feedbacks);
      } else {
        console.error(" Failed to fetch feedbacks:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
    }
  };

  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleCloseModal = () => {
    setSelectedFeedback(null);
  };

  const handleDelete = async (feedbackId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`http://localhost:3000/api/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFeedbacks((prev) => prev.filter((fb) => fb._id !== feedbackId));
      } else {
        console.error("Failed to delete feedback:", response.data.message);
      }
    } catch (error) {
      console.error(" Error deleting feedback:", error);
    }
  };

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
            onChange={(e) => setFilters({ search: e.target.value.toLowerCase() })}
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
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length > 0 ? (
                feedbacks.map((fb, index) => (
                  <tr key={fb._id} className="border-b border-gray-600 hover:bg-gray-600 transition-colors">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4">{fb.makePrivate ? "Unknown" : fb.userId?.name || "Unknown"}</td>
                    <td className="py-3 px-4">{fb.makePrivate ? "Unknown" : fb.department || "Not Assigned"}</td>
                    <td className="py-3 px-4">{new Date(fb.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{fb.accomplishments?.slice(0, 20) || "No data"}...</td>
                    <td className="py-3 px-4">{fb.challenges?.slice(0, 20) || "No data"}...</td>
                    <td className="py-3 px-4">{fb.suggestions?.slice(0, 20) || "No data"}...</td>
                    <td className="py-3 px-4 text-center flex gap-2">
                      <button
                        onClick={() => handleView(fb)}
                        className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-md text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(fb._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm"
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

      {/* Modal for Viewing Feedback Details */}
      {selectedFeedback && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
             onClick={handleCloseModal}>
          <div className="bg-gray-800 p-6 rounded-lg text-white w-1/2" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">Feedback Details</h2>
            <p><strong>Employee:</strong> {selectedFeedback.makePrivate ? "Unknown" : selectedFeedback.userId?.name || "Unknown"}</p>
            <p><strong>Department:</strong> {selectedFeedback.makePrivate ? "Unknown" : selectedFeedback.department || "Not Assigned"}</p>
            <p><strong>Date:</strong> {new Date(selectedFeedback.createdAt).toLocaleString()}</p>
            <p><strong>Accomplishments:</strong> {selectedFeedback.accomplishments}</p>
            <p><strong>Challenges:</strong> {selectedFeedback.challenges}</p>
            <p><strong>Suggestions:</strong> {selectedFeedback.suggestions}</p>

            <button
              onClick={handleCloseModal}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFeedback;

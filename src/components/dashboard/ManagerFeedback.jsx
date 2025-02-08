import React, { useState, useEffect } from "react";
import axios from "axios";

const ManagerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]); // All feedbacks
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]); // Filtered feedbacks
  const [filters, setFilters] = useState({ search: "" });
  const [selectedFeedback, setSelectedFeedback] = useState(null); // For detailed feedback

  // Fetch feedbacks on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const feedbackResponse = await axios.get("http://localhost:3000/api/feedback/manager");
        if (feedbackResponse.data.success) {
          setFeedbacks(feedbackResponse.data.feedbacks);
          setFilteredFeedbacks(feedbackResponse.data.feedbacks);
        } else {
          console.error("Failed to fetch feedbacks:", feedbackResponse.data.message);
        }
      } catch (error) {
        console.error("Error fetching feedbacks:", error);
      }
    };

    fetchData();
  }, []);

  // Handle search filter
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setFilters((prev) => ({ ...prev, search: searchTerm }));

    const filtered = feedbacks.filter(
      (feedback) =>
        feedback.userId?.name.toLowerCase().includes(searchTerm) || // Filter by employee name
        feedback.department?.toLowerCase().includes(searchTerm) // Filter by department name
    );

    setFilteredFeedbacks(filtered);
  };

  // Close the detailed feedback view
  const closeFeedback = () => {
    setSelectedFeedback(null);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white px-4 py-6">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-center">Employee Feedback</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleSearch}
            placeholder="Search by Employee Name or Department..."
            className="w-1/3 p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Feedback Table */}
        <table className="w-full text-sm bg-gray-700 rounded-md">
          <thead>
            <tr className="text-left border-b border-gray-600">
              <th className="py-3 px-4">S.No</th>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Work Summary</th>
              <th className="py-3 px-4">Challenges</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedbacks.length > 0 ? (
              filteredFeedbacks.map((feedback, index) => (
                <tr key={feedback._id} className="border-b border-gray-600">
                  <td className="py-3 px-4">{index + 1}</td>
                  <td className="py-3 px-4">{feedback.userId?.name || "Unknown"}</td>
                  <td className="py-3 px-4">{feedback.department || "Not Assigned"}</td>
                  <td className="py-3 px-4">
                    {new Date(feedback.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {feedback.accomplishments?.slice(0, 30) || "No data"}...
                  </td>
                  <td className="py-3 px-4">
                    {feedback.challenges?.slice(0, 30) || "No data"}...
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedFeedback(feedback)}
                      className="px-4 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-3 px-4 text-center text-gray-400">
                  No feedback found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detailed Feedback Card */}
      {selectedFeedback && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Feedback Details</h2>
            <p>
              <strong>Employee:</strong> {selectedFeedback.userId?.name || "Unknown"}
            </p>
            <p>
              <strong>Department:</strong> {selectedFeedback.department || "Not Assigned"}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(selectedFeedback.createdAt).toLocaleDateString()}
            </p>
            <p>
              <strong>Work Summary:</strong> {selectedFeedback.accomplishments || "No data"}
            </p>
            <p>
              <strong>Challenges:</strong> {selectedFeedback.challenges || "No data"}
            </p>
            <button
              onClick={closeFeedback}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFeedback;

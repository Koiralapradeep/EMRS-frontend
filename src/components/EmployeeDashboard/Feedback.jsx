import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../Context/authContext";

const Feedback = () => {
  const { user } = useAuth(); // Fetch the logged-in user details
  const [feedback, setFeedback] = useState({
    userId: user._id,
    accomplishments: "",
    challenges: "",
    suggestions: "",
  });

  const [previousFeedbacks, setPreviousFeedbacks] = useState([]); // Fetch user's previous feedbacks
  const [selectedFeedback, setSelectedFeedback] = useState(null); // Store selected feedback for modal
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchPreviousFeedbacks = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/feedback", {
          params: { userId: user._id }, // Fetch data for the logged-in user only
        });
        if (response.data.success) {
          setPreviousFeedbacks(response.data.feedbacks);
        } else {
          setError("Failed to fetch previous feedbacks.");
        }
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
        setError("Internal Server Error.");
      }
    };

    fetchPreviousFeedbacks();
  }, [user._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!feedback.accomplishments || !feedback.challenges || !feedback.suggestions) {
      setError("All fields are required.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3000/api/feedback",
        feedback,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message); // Show success message
        setFeedback({ userId: user._id, accomplishments: "", challenges: "", suggestions: "" }); // Clear fields
        setPreviousFeedbacks((prev) => [response.data.feedback, ...prev]); // Update the list
      } else {
        setError(response.data.error || "Failed to submit feedback.");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(err.response?.data?.error || "Internal Server Error.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white px-4 py-6">
      {/* Feedback Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-5xl"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Monthly Feedback</h1>
        {success && <p className="text-green-500 mb-4">{success}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-2 gap-6">
          {/* Accomplishments */}
          <div className="col-span-2">
            <label htmlFor="accomplishments" className="block text-sm mb-2">
              What were your accomplishments this month?
            </label>
            <textarea
              id="accomplishments"
              name="accomplishments"
              value={feedback.accomplishments}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your achievements..."
              rows="3"
            ></textarea>
          </div>

          {/* Challenges */}
          <div className="col-span-2">
            <label htmlFor="challenges" className="block text-sm mb-2">
              What challenges or difficulties did you face this month?
            </label>
            <textarea
              id="challenges"
              name="challenges"
              value={feedback.challenges}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe any obstacles..."
              rows="3"
            ></textarea>
          </div>

          {/* Suggestions */}
          <div className="col-span-2">
            <label htmlFor="suggestions" className="block text-sm mb-2">
              Any suggestions for improving the workplace or processes?
            </label>
            <textarea
              id="suggestions"
              name="suggestions"
              value={feedback.suggestions}
              onChange={handleChange}
              className="w-full p-3 bg-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your suggestions for improvement..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit Feedback
        </button>
      </form>

      {/* Previous Feedbacks */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-5xl mt-8">
        <h2 className="text-xl font-bold mb-4">Previous Feedbacks</h2>
        {previousFeedbacks.length > 0 ? (
          <table className="w-full text-sm bg-gray-700 rounded-md">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="py-2 px-4">Date Submitted</th>
                <th className="py-2 px-4">Work Summary</th>
                <th className="py-2 px-4">Challenges</th>
                <th className="py-2 px-4">Suggestions</th>
                <th className="py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {previousFeedbacks.map((feedback) => (
                <tr key={feedback._id} className="border-b border-gray-600">
                  <td className="py-2 px-4">{new Date(feedback.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 px-4">{feedback.accomplishments.slice(0, 30)}...</td>
                  <td className="py-2 px-4">{feedback.challenges.slice(0, 30)}...</td>
                  <td className="py-2 px-4">{feedback.suggestions.slice(0, 30)}...</td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => setSelectedFeedback(feedback)}
                      className="px-4 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400">No feedbacks found.</p>
        )}
      </div>

      {/* Modal for Viewing Feedback Details */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
            <h2 className="text-xl font-bold mb-4">Feedback Details</h2>
            <p className="mb-4">
              <strong>Date:</strong> {new Date(selectedFeedback.createdAt).toLocaleDateString()}
            </p>
            <p className="mb-4">
              <strong>Accomplishments:</strong> {selectedFeedback.accomplishments}
            </p>
            <p className="mb-4">
              <strong>Challenges:</strong> {selectedFeedback.challenges}
            </p>
            <p className="mb-4">
              <strong>Suggestions:</strong> {selectedFeedback.suggestions}
            </p>
            <button
              onClick={() => setSelectedFeedback(null)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../Context/authContext";

const Feedback = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState({
    userId: user._id,
    accomplishments: "",
    challenges: "",
    suggestions: "",
    makePrivate: false,       // New flag to control privacy in Manager view
    saveToDashboard: false,   // New flag to permanently save feedback on Employee Dashboard
  });

  const [previousFeedbacks, setPreviousFeedbacks] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch saved feedbacks on component mount (only those with saveToDashboard: true)
  useEffect(() => {
    const fetchPreviousFeedbacks = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/feedback", {
          params: { userId: user._id },
        });
        if (response.data.success) {
          setPreviousFeedbacks(response.data.feedbacks);
        } else {
          setError("Failed to fetch previous feedbacks.");
        }
      } catch (err) {
        setError("Internal Server Error.");
      }
    };
    fetchPreviousFeedbacks();
  }, [user._id]);

  // Update text inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prevState) => ({ ...prevState, [name]: value }));
  };

  // Update checkboxes and log for debugging if needed
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    console.log(`Checkbox ${name} changed: ${checked}`);
    setFeedback((prevState) => ({ ...prevState, [name]: checked }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const response = await axios.post(
        "http://localhost:3000/api/feedback",
        {
          ...feedback,
          makePrivate: Boolean(feedback.makePrivate),
          saveToDashboard: Boolean(feedback.saveToDashboard),
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.data.success) {
        setSuccess(response.data.message);
        // Only add to dashboard if feedback is to be saved permanently
        if (response.data.feedback.saveToDashboard) {
          setPreviousFeedbacks((prev) => [response.data.feedback, ...prev]);
        }
        // Reset the form
        setFeedback({
          userId: user._id,
          accomplishments: "",
          challenges: "",
          suggestions: "",
          makePrivate: false,
          saveToDashboard: false,
        });
      } else {
        setError(response.data.error || "Failed to submit feedback.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Internal Server Error.");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white px-4 py-6">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-5xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Submit Feedback</h1>

        {success && <p className="text-green-500 mb-4">{success}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="mb-4">
          <label className="block text-sm mb-2">Accomplishments</label>
          <textarea
            name="accomplishments"
            value={feedback.accomplishments}
            onChange={handleChange}
            className="w-full p-3 bg-gray-700 rounded-md text-white"
            placeholder="Describe your achievements..."
            rows="3"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-2">Challenges</label>
          <textarea
            name="challenges"
            value={feedback.challenges}
            onChange={handleChange}
            className="w-full p-3 bg-gray-700 rounded-md text-white"
            placeholder="Describe any obstacles..."
            rows="3"
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm mb-2">Suggestions</label>
          <textarea
            name="suggestions"
            value={feedback.suggestions}
            onChange={handleChange}
            className="w-full p-3 bg-gray-700 rounded-md text-white"
            placeholder="Your suggestions..."
            rows="3"
          ></textarea>
        </div>

        {/* Checkbox for "Make Private" */}
        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            name="makePrivate"
            checked={feedback.makePrivate}
            onChange={handleCheckboxChange}
            className="mr-2 w-5 h-5 accent-blue-500"
          />
          <label>Make Private (Hide Employee Info in Manager View)</label>
        </div>

        {/* Checkbox for "Save to Dashboard" */}
        <div className="mt-2 flex items-center">
          <input
            type="checkbox"
            name="saveToDashboard"
            checked={feedback.saveToDashboard}
            onChange={handleCheckboxChange}
            className="mr-2 w-5 h-5 accent-blue-500"
          />
          <label>Save to Employee Dashboard (Permanent)</label>
        </div>

        <button type="submit" className="mt-6 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600">
          Submit Feedback
        </button>
      </form>

      {/* Employee Dashboard Feedback List */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-5xl mt-8">
        <h2 className="text-xl font-bold mb-4">Previous Feedback (Employee Dashboard)</h2>
        {previousFeedbacks.length > 0 ? (
          <table className="w-full text-sm bg-gray-700 rounded-md">
            <thead>
              <tr className="text-left border-b border-gray-600">
                <th className="py-2 px-4">Date</th>
                <th className="py-2 px-4">Accomplishments</th>
                <th className="py-2 px-4">Challenges</th>
                <th className="py-2 px-4">Suggestions</th>
              </tr>
            </thead>
            <tbody>
              {previousFeedbacks.map((fb) => (
                <tr key={fb._id} className="border-b border-gray-600">
                  <td className="py-2 px-4">{new Date(fb.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 px-4">{fb.accomplishments}</td>
                  <td className="py-2 px-4">{fb.challenges}</td>
                  <td className="py-2 px-4">{fb.suggestions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400">No feedback found.</p>
        )}
      </div>
    </div>
  );
};

export default Feedback;

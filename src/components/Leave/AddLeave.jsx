import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AddLeave = () => {
  const navigate = useNavigate();
  const [leave, setLeave] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    description: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setLeave({ ...leave, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate
    if (!leave.leaveType || !leave.fromDate || !leave.toDate || !leave.description) {
      setError("All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/api/leave/add",
        leave,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // must be an Employee's token
          },
        }
      );

      if (response.data.success) {
        // Go back to your Employee Leaves page
        navigate("/employee-dashboard/leave");
      } else {
        setError(response.data.error || "Failed to add leave.");
      }
    } catch (err) {
      console.error("Error adding leave:", err.response?.data || err);
      setError(err.response?.data?.error || "Internal Server Error.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Leave</h1>

        <label className="block mb-2">Leave Type</label>
        <select
          name="leaveType"
          value={leave.leaveType}
          onChange={handleChange}
          className="w-full p-2 mb-4 bg-gray-700 rounded"
        >
          <option value="">Select Leave Type</option>
          <option value="Casual Leave">Casual Leave</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Annual Leave">Annual Leave</option>
        </select>

        <label className="block mb-2">From Date</label>
        <input
          type="date"
          name="fromDate"
          value={leave.fromDate}
          onChange={handleChange}
          className="w-full p-2 mb-4 bg-gray-700 rounded"
        />

        <label className="block mb-2">To Date</label>
        <input
          type="date"
          name="toDate"
          value={leave.toDate}
          onChange={handleChange}
          className="w-full p-2 mb-4 bg-gray-700 rounded"
        />

        <label className="block mb-2">Description</label>
        <textarea
          name="description"
          value={leave.description}
          onChange={handleChange}
          className="w-full p-2 mb-4 bg-gray-700 rounded"
        />

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <button type="submit" className="bg-blue-500 w-full p-2 rounded">
          Submit Leave
        </button>
      </form>
    </div>
  );
};

export default AddLeave;

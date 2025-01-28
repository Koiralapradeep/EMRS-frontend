import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/authContext';

const AddLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leave, setLeave] = useState({
    userId: user._id,
    leaveType: '',
    fromDate: '',
    toDate: '',
    description: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeave((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure all required fields are filled
    if (!leave.leaveType || !leave.fromDate || !leave.toDate || !leave.description) {
      setError('All fields are required.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3000/api/leave/add',
        leave,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.success) {
        navigate('/employee-dashboard/Leave');
      } else {
        setError(response.data.error || 'Failed to add leave.');
      }
    } catch (err) {
      console.error('Error adding leave:', err.response?.data || err);
      setError(err.response?.data?.error || 'Internal Server Error.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Add Leave</h1>

        {/* Leave Type */}
        <label htmlFor="leaveType" className="block text-gray-300 mb-2">
          Leave Type
        </label>
        <select
          id="leaveType"
          name="leaveType"
          value={leave.leaveType}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Leave Type</option>
          <option value="Casual Leave">Casual Leave</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Annual Leave">Annual Leave</option>
        </select>

        {/* From Date */}
        <label htmlFor="fromDate" className="block text-gray-300 mb-2">
          From Date
        </label>
        <input
          type="date"
          id="fromDate"
          name="fromDate"
          value={leave.fromDate}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* To Date */}
        <label htmlFor="toDate" className="block text-gray-300 mb-2">
          To Date
        </label>
        <input
          type="date"
          id="toDate"
          name="toDate"
          value={leave.toDate}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {/* Description */}
        <label htmlFor="description" className="block text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={leave.description}
          onChange={handleChange}
          className="w-full p-2 mb-4 border rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Reason"
          required
        ></textarea>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Submit Leave Request
        </button>

        {/* Error Message */}
        {error && (
          <p className="mt-4 text-red-500 text-sm text-center">{error}</p>
        )}
      </form>
    </div>
  );
};

export default AddLeave;

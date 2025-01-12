import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddDepartment = () => {
  const [form, setForm] = useState({ departmentName: '', departmentCode: '', description: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await axios.post('http://localhost:3000/api/departments', form);
      navigate('/manager-dashboard/department'); // Redirect to department list
    } catch (err) {
      console.error('Error adding department:', err);
      setError(err.response?.data?.error || 'Failed to add department.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-800 to-black text-white">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Add Department</h2>
        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm mb-2">Department Name</label>
            <input
              type="text"
              className="w-full p-3 rounded bg-gray-800 border border-gray-700"
              placeholder="Enter Department Name"
              value={form.departmentName}
              onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-2">Department Code</label>
            <input
              type="text"
              className="w-full p-3 rounded bg-gray-800 border border-gray-700"
              placeholder="Enter Department Code"
              value={form.departmentCode}
              onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-2">Description</label>
            <textarea
              className="w-full p-3 rounded bg-gray-800 border border-gray-700"
              placeholder="Enter Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Add Department
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDepartment;

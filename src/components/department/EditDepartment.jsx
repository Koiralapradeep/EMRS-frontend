import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditDepartment = () => {
  const { id } = useParams(); // Get department ID from the URL
  const navigate = useNavigate();

  const [form, setForm] = useState({
    departmentName: '',
    departmentCode: '',
    description: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch department details when component loads
  useEffect(() => {
    const fetchDepartment = async () => {
      const token = localStorage.getItem("token"); // Get token from localStorage
      console.log("DEBUG - Token being sent:", token); // Debugging

      if (!token) {
        console.error("ERROR - No token found in localStorage.");
        setError("Unauthorized: Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3000/api/departments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }, // Send token in headers
        });

        setForm({
          departmentName: response.data.departmentName,
          departmentCode: response.data.departmentCode,
          description: response.data.description || '', 
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching department:', err);
        setError('Failed to fetch department details.');
        setLoading(false);
      }
    };

    fetchDepartment();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem("token"); // Get token for update request
    if (!token) {
      console.error("ERROR - No token found in localStorage.");
      setError("Unauthorized: Please log in again.");
      return;
    }

    try {
      await axios.put(
        `http://localhost:3000/api/departments/${id}`, 
        form,
        { headers: { Authorization: `Bearer ${token}` } } // Send token in headers
      );
      navigate('/manager-dashboard/department'); // Redirect back to the departments list
    } catch (err) {
      console.error('Error updating department:', err);
      setError(err.response?.data?.error || 'Failed to update department.');
    }
  };

  if (loading) {
    return <div className="text-white text-center">Loading...</div>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-gray-800 to-black text-white">
      <div className="bg-gray-900 p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Edit Department</h2>
        {error && <div className="bg-red-500 text-white p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm mb-2">Department Name</label>
            <input
              type="text"
              className="w-full p-3 rounded bg-gray-800 border border-gray-700"
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
              value={form.departmentCode}
              onChange={(e) => setForm({ ...form, departmentCode: e.target.value })}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm mb-2">Description</label>
            <textarea
              className="w-full p-3 rounded bg-gray-800 border border-gray-700"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Update Department
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditDepartment;

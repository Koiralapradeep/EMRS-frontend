import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // State for search term

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/departments');
      setDepartments(response.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Filter departments based on the search term
  const filteredDepartments = departments.filter((dept) =>
    dept.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Departments</h1>
        <Link to="/manager-dashboard/add-department" className="bg-teal-500 py-2 px-4 rounded">
          Add Department
        </Link>
      </div>

      {/* Smaller and Standard Search Bar */}
      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Search departments..."
          className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update search term
        />
      </div>

      <table className="w-full bg-gray-800 rounded">
        <thead>
          <tr className="text-left">
            <th className="p-3">S.No</th>
            <th className="p-3">Department Name</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDepartments.map((dept, index) => (
            <tr key={dept._id}>
              <td className="p-3">{index + 1}</td>
              <td className="p-3">{dept.departmentName}</td>
              <td className="p-3">
                <Link
                  to={`/manager-dashboard/edit-department/${dept._id}`}
                  className="bg-yellow-500 px-3 py-1 rounded mr-2"
                >
                  Edit
                </Link>
                <button
                  className="bg-red-500 px-3 py-1 rounded"
                  onClick={async () => {
                    await axios.delete(`http://localhost:3000/api/departments/${dept._id}`);
                    fetchDepartments(); // Refresh list after deletion
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Departments;

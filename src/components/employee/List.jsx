import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const List = () => {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token"); // Get token
        if (!token) {
          console.error(" No token found. User might not be logged in.");
          return;
        }
    
        const response = await axios.get("http://localhost:3000/api/employee", {
          headers: { Authorization: `Bearer ${token}` }, // Include token
        });
    
        setEmployees(response.data.employees);
      } catch (error) {
        console.error("Error fetching employees:", error.response?.data || error);
      }
    };
    
    fetchEmployees();
  }, []);

  // Delete employee
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this employee?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please log in again.");
        return;
      }

      // Use the 'id' parameter in the route
      const response = await axios.delete(`http://localhost:3000/api/employee/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setEmployees((prev) => prev.filter((emp) => emp._id !== id));
      } else {
        alert(response.data.error || "Failed to delete employee.");
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert(error.response?.data?.error || "Internal Server Error.");
    }
  };


  // Filter employees based on the search term
  const filteredEmployees = employees.filter((employee) =>
    employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        <button
          onClick={() => navigate("/manager-dashboard/add-employee")}
          className="bg-teal-500 py-2 px-4 rounded"
        >
          Add Employee
        </button>
      </div>

      <div className="mb-4 flex justify-end">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <table className="w-full bg-gray-800 rounded-lg text-white">
        <thead>
          <tr>
            <th className="p-3">S.No</th>
            <th className="p-3">Image</th>
            <th className="p-3">Name</th>
            <th className="p-3">DOB</th>
            <th className="p-3">Department</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee, index) => (
              <tr key={employee._id} className="text-center">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">
                  <img
                  src={`http://localhost:3000/public/uploads/${employee.image}`}
                    alt={employee.fullName}
                    className="w-10 h-10 rounded-full mx-auto"
                  />
                </td>
                <td className="p-3">{employee.fullName}</td>
                <td className="p-3">{new Date(employee.dob).toLocaleDateString()}</td>
                <td className="p-3">{employee.department?.departmentName || "N/A"}</td>
                <td className="p-3 flex justify-center gap-2">
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded"
                    onClick={() => navigate(`/manager-dashboard/view-employee/${employee._id}`)}
                  >
                    View
                  </button>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded"
                    onClick={() => navigate(`/manager-dashboard/edit-employee/${employee._id}`)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded"
                    onClick={() => handleDelete(employee._id)}
                  >
                    Delete
                  </button>
                  <button
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-1 rounded"
                  onClick={() => navigate("/manager-dashboard/view-leave", { state: { userId: employee.userId } })}
                  >
                 Leave
               </button>


                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="p-3 text-center">
                No employees found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default List;

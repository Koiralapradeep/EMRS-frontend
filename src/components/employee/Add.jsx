// Add.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchDepartments } from "../employee/EmployeeHelper";
import { useNavigate } from "react-router-dom";

const Add = () => {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    employeeID: "",
    dob: "",
    gender: "",
    maritalStatus: "",
    designation: "",
    department: "",
    password: "",
    role: "",
    image: null,
  });

  useEffect(() => {
    const getDepartments = async () => {
      try {
        const fetchedDepartments = await fetchDepartments();
        setDepartments(fetchedDepartments || []);
      } catch (err) {
        console.error("Error fetching departments:", err);
        setDepartments([]);
      }
    };
    getDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();
    Object.keys(form).forEach((key) => {
      formData.append(key, form[key]);
    });

    try {
      const response = await axios.post(
        "http://localhost:3000/api/employee/add",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        navigate("/manager-dashboard/employee");
      } else {
        setError(response.data.error || "Failed to add employee.");
      }
    } catch (err) {
      console.error("Error adding employee:", err.response?.data || err);
      setError(err.response?.data?.error || "Internal Server Error.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Add Employee</h1>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Enter Full Name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee ID</label>
            <input
              type="text"
              placeholder="Enter Employee ID"
              value={form.employeeID}
              onChange={(e) => setForm({ ...form, employeeID: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Marital Status</label>
            <select
              value={form.maritalStatus}
              onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </select>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-medium mb-1">Designation</label>
            <input
              type="text"
              placeholder="Enter Designation"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              placeholder="Enter Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">Select Role</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          {/* Upload Image */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload Image</label>
            <input
              type="file"
              onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 col-span-2">{error}</p>}
        </form>
        <div className="mt-6 text-center">
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base font-medium rounded"
          >
            Add Employee
          </button>
        </div>
      </div>
    </div>
  );
};

export default Add;

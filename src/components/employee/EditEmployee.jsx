import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const EditEmployee = () => {
  const { id } = useParams(); // expects the Employee document's _id
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
    role: "",
    image: null,
  });
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Redirecting to login.");
          navigate("/login");
          return;
        }
        // GET /api/employee/:id to fetch employee details
        const response = await axios.get(`http://localhost:3000/api/employee/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          const { employee } = response.data;
          setForm({
            fullName: employee.fullName,
            email: employee.email,
            employeeID: employee.employeeID,
            dob: employee.dob ? employee.dob.split("T")[0] : "",
            gender: employee.gender,
            maritalStatus: employee.maritalStatus,
            designation: employee.designation,
            department: employee.department ? employee.department._id : "",
            role: employee.role || "",
            image: null,
          });
        } else {
          console.error("Error fetching employee:", response.data.error);
        }
      } catch (error) {
        console.error("Error fetching employee:", error.response?.data || error);
      }
    };

    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found.");
          return;
        }
        const response = await axios.get("http://localhost:3000/api/departments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setDepartments(response.data.departments);
        }
      } catch (error) {
        console.error("Error fetching departments:", error.response?.data || error);
      }
    };

    fetchEmployee();
    fetchDepartments();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Redirecting to login.");
      navigate("/login");
      return;
    }
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key]) {
          formData.append(key, form[key]);
        }
      });
      // PUT /api/employee/:id to update employee details
      const response = await axios.put(`http://localhost:3000/api/employee/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        alert("Employee updated successfully!");
        navigate("/manager-dashboard/employee");
      }
    } catch (error) {
      console.error("Error updating employee:", error.response?.data || error);
      setError(error.response?.data?.error || "Failed to update employee.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Edit Employee</h1>
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>
          {/* Employee ID */}
          <div>
            <label className="block text-sm font-medium mb-1">Employee ID</label>
            <input
              type="text"
              value={form.employeeID}
              onChange={(e) => setForm({ ...form, employeeID: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
              type="date"
              value={form.dob}
              onChange={(e) => setForm({ ...form, dob: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
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
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
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
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>
          {/* Department */}
          <div>
            <label className="block text-sm font-medium mb-1">Department</label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>
          {/* Role (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
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
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            />
          </div>
          {/* Submit and Cancel */}
          <div className="col-span-2 flex justify-between">
            <button type="submit" className="bg-blue-500 py-2 px-4 rounded text-white">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate("/manager-dashboard/employee")}
              className="bg-gray-600 py-2 px-4 rounded text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;

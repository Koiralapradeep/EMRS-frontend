import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { fetchDepartments } from "../employee/EmployeeHelper"; // Import the helper

const EditEmployee = () => {
  const { id } = useParams();
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
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [departmentWarning, setDepartmentWarning] = useState("");
  const maxRetries = 3;

  const getDepartments = async () => {
    try {
      console.log("Fetching departments...");
      const fetchedDepartments = await fetchDepartments();
      console.log("Fetched departments:", fetchedDepartments);
      setDepartments(fetchedDepartments || []);
    } catch (error) {
      console.error("Error fetching departments:", error.message);
      console.error("Full error:", error.response ? error.response.data : error);
      if (retryCount < maxRetries) {
        console.log(`Retrying fetchDepartments (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => setRetryCount(retryCount + 1), 2000);
      } else {
        setApiError(
          error.response?.data?.error || error.message || "Failed to fetch departments after retries."
        );
        setDepartments([]);
      }
    }
  };

  const fetchEmployee = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found. Please log in.");
      }
      console.log("Fetching employee with token:", token);
      const response = await axios.get(`http://localhost:3000/api/employee/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Employee API response:", response.data);
      if (response.data.success) {
        const { employee } = response.data;
        console.log("Fetched employee:", employee);
        console.log("Employee department:", employee.department);
        const departmentId = employee.department
          ? typeof employee.department === "object" && employee.department._id
            ? employee.department._id
            : employee.department
          : "";
        console.log("Setting form.department to:", departmentId);
        console.log("Available department IDs:", departments.map((dept) => dept._id));

        // Check if departmentId matches any available department
        if (departmentId && departments.length > 0) {
          const departmentExists = departments.some((dept) => dept._id === departmentId);
          if (!departmentExists) {
            setDepartmentWarning(
              "The employee's department is invalid or no longer exists. Please select a new department."
            );
          }
        }

        setForm({
          fullName: employee.fullName || "",
          email: employee.email || "",
          employeeID: employee.employeeID || "",
          dob: employee.dob ? employee.dob.split("T")[0] : "",
          gender: employee.gender || "",
          maritalStatus: employee.maritalStatus || "",
          designation: employee.designation || "",
          department: departmentId,
          role: employee.role || "",
          image: null,
        });
      } else {
        throw new Error(response.data.error || "Failed to fetch employee data.");
      }
    } catch (error) {
      console.error("Error fetching employee:", error.message);
      console.error("Full error:", error.response ? error.response.data : error);
      setApiError(error.response?.data?.error || error.message || "Failed to fetch employee data.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setApiError("");
      setDepartmentWarning("");
      await getDepartments();
      await fetchEmployee();
      setLoading(false);
    };

    fetchData();
  }, [id, navigate, retryCount]);

  const retryFetchDepartments = () => {
    setRetryCount(0);
    getDepartments();
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.fullName) newErrors.fullName = "Full Name is required.";
    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid.";
    }
    if (!form.employeeID) newErrors.employeeID = "Employee ID is required.";
    if (!form.dob) newErrors.dob = "Date of Birth is required.";
    if (!form.gender) newErrors.gender = "Gender is required.";
    if (!form.maritalStatus) newErrors.maritalStatus = "Marital Status is required.";
    if (!form.designation) newErrors.designation = "Designation is required.";
    if (!form.department) newErrors.department = "Department is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validateForm()) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setApiError("No token found. Please log in.");
      navigate("/login");
      return;
    }

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      const response = await axios.put(`http://localhost:3000/api/employee/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        alert("Employee updated successfully!");
        navigate("/manager-dashboard/employee");
      } else {
        throw new Error(response.data.error || "Failed to update employee.");
      }
    } catch (error) {
      console.error("Error updating employee:", error.message);
      setApiError(error.response?.data?.error || error.message || "Failed to update employee.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Edit Employee</h1>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {apiError && (
              <div className="text-red-500 mb-4">
                <p>{apiError}</p>
                <button
                  onClick={retryFetchDepartments}
                  className="underline text-blue-400 hover:text-blue-500"
                >
                  Retry
                </button>
              </div>
            )}
            {departments.length === 0 && !loading && !apiError && (
              <p className="text-yellow-500 mb-4">
                No departments available. Please add a department first.
              </p>
            )}
            {departmentWarning && (
              <p className="text-yellow-500 mb-4">{departmentWarning}</p>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.fullName ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.email ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Employee ID</label>
                <input
                  type="text"
                  value={form.employeeID}
                  onChange={(e) => setForm({ ...form, employeeID: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.employeeID ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {errors.employeeID && <p className="text-red-500 text-sm">{errors.employeeID}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.dob ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.gender ? "border-red-500" : "border-gray-600"
                  }`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Marital Status</label>
                <select
                  value={form.maritalStatus}
                  onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.maritalStatus ? "border-red-500" : "border-gray-600"
                  }`}
                >
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                </select>
                {errors.maritalStatus && (
                  <p className="text-red-500 text-sm">{errors.maritalStatus}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Designation</label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.designation ? "border-red-500" : "border-gray-600"
                  }`}
                />
                {errors.designation && (
                  <p className="text-red-500 text-sm">{errors.designation}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={form.department || ""}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={`w-full p-2 rounded bg-gray-800 text-white border ${
                    errors.department ? "border-red-500" : "border-gray-600"
                  }`}
                  disabled={departments.length === 0}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="text-red-500 text-sm">{errors.department}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload Image</label>
                <input
                  type="file"
                  onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                  className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                />
              </div>
              <div className="col-span-2 flex justify-between">
                <button
                  type="submit"
                  className="bg-blue-500 py-2 px-4 rounded text-white"
                  disabled={departments.length === 0}
                >
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
          </>
        )}
      </div>
    </div>
  );
};

export default EditEmployee;
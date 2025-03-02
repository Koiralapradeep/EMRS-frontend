import axios from "axios";

export const fetchDepartments = async () => {
  try {
    const token = localStorage.getItem("token"); // Ensure token is sent for authentication
    const response = await axios.get("http://localhost:3000/api/departments", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Check if response data is an array
    if (Array.isArray(response.data)) {
      console.log(" API Response (Array):", response.data); // Debug log
      return response.data; // Return the array directly
    }

    // If the response contains a success flag, use that logic
    if (response.data.success) {
      console.log(" API Response (Object):", response.data); // Debug log
      return response.data.departments;
    }

    console.error("API returned an unexpected structure:", response.data);
    return []; // Return an empty array if the API structure is incorrect
  } catch (err) {
    console.error(" Failed to fetch departments:", err.message || err);
    return []; // Return an empty array on error
  }
};

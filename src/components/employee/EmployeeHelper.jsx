import axios from 'axios';

export const fetchDepartments = async () => {
  try {
    const response = await axios.get('http://localhost:3000/api/departments');

    // Check if response data is an array
    if (Array.isArray(response.data)) {
      console.log('API Response (Array):', response.data); // Debug log
      return response.data; // Return the array directly
    }

    // If the response contains a success flag, use that logic
    if (response.data.success) {
      console.log('API Response (Object):', response.data); // Debug log
      return response.data.departments;
    }

    console.error('API returned an unexpected structure:', response.data);
    return []; // Return an empty array if the API indicates failure
  } catch (err) {
    // Log detailed error information
    console.error('Failed to fetch departments:', err.message || err);
    return []; // Return an empty array on error
  }
};

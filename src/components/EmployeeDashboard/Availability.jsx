import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../Context/authContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

dayjs.extend(utc);

// Function to convert 24-hour time to 12-hour AM/PM format
const formatTimeTo12Hour = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const Availability = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const fetchCount = useRef(0); // Track number of fetch calls
  const userFetchCount = useRef(0); // Track number of user fetch calls

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    userFetchCount.current += 1;
    console.log(`User fetch attempt #${userFetchCount.current}`);

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (user) {
      const id = user._id || user.id;
      console.log('User data available:', { id, companyId: user.companyId, role: user.role });
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        setError('Invalid user ID format. Please contact support.');
        return;
      }
      setEmployeeId(id);
      setCompanyId(user.companyId);

      if (user.role === 'Admin' && !user.companyId) {
        navigate('/admin/company-setup');
        return;
      }

      if (user.role === 'Employee' && !user.companyId) {
        setError('Your account is not fully set up: Missing company. Please contact your admin.');
        return;
      }
    } else {
      const fetchUserData = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          });
          console.log('Fetched user data:', response.data);
          if (response.data?.success) {
            const userData = response.data.user;
            const id = userData._id || userData.id;
            if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
              setError('Invalid user ID format from server. Please contact support.');
              return;
            }
            setEmployeeId(id);
            setCompanyId(userData.companyId);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }
        } catch (err) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        }
      };
      fetchUserData();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!employeeId || !companyId) {
      console.log('Skipping fetch: employeeId or companyId not set', { employeeId, companyId });
      return;
    }

    const fetchAvailabilities = async () => {
      fetchCount.current += 1;
      console.log(`Fetch attempt #${fetchCount.current} for employeeId: ${employeeId}, companyId: ${companyId}`);

      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/availability/${employeeId}`, {
          params: { companyId },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        console.log('API Response:', response.data);

        // Ensure the response is always an array
        const data = Array.isArray(response.data) ? response.data : response.data && typeof response.data === 'object' ? [response.data] : [];
        console.log('Processed data:', data);

        // Validate that each availability has an _id
        const validData = data.filter(item => {
          if (!item._id) {
            console.warn('Availability item missing _id:', item);
            return false;
          }
          return true;
        });

        if (validData.length === 0 && data.length > 0) {
          setError('No valid availabilities found: Missing ID fields.');
          toast.error('No valid availabilities found.', { duration: 7000 });
        }

        console.log('Before setting availabilities, current state:', availabilities);
        setAvailabilities(validData);
        console.log('After setting availabilities, new state:', validData);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch availabilities.';
        console.log('Error fetching availabilities:', errorMessage);
        setAvailabilities([]);
        setError(errorMessage);
        toast.error(errorMessage, { duration: 7000 });
      } finally {
        setLoading(false);
      }
    };

    fetchAvailabilities();
  }, [employeeId, companyId]);

  const handleEdit = (availabilityId) => {
    console.log('handleEdit called with availabilityId:', availabilityId);
    if (!availabilityId || !/^[0-9a-fA-F]{24}$/.test(availabilityId)) {
      console.error('Invalid availabilityId:', availabilityId);
      toast.error('Cannot edit availability: Invalid ID.', { duration: 7000 });
      return;
    }
    const targetPath = `/employee-dashboard/edit-availability/${availabilityId}`;
    console.log('Navigating to:', targetPath);
    navigate(targetPath);
  };

  const handleDelete = async (availabilityId) => {
    if (!window.confirm('Are you sure you want to delete this availability?')) return;

    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      if (!employeeId) throw new Error('Employee ID not found.');

      await axios.delete(`${API_BASE_URL}/api/availability/${availabilityId}`, {
        data: { employeeId },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      console.log('Before deleting, availabilities:', availabilities);
      const updatedAvailabilities = availabilities.filter((avail) => avail._id !== availabilityId);
      setAvailabilities(updatedAvailabilities);
      console.log('After deleting, availabilities:', updatedAvailabilities);

      setSuccess('Availability deleted successfully!');
      toast.success('Availability deleted!', { duration: 7000 });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to delete availability.';
      setError(errorMessage);
      toast.error(errorMessage, { duration: 7000 });
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Log state before rendering
  console.log('Availabilities before rendering:', availabilities);

  return (
    <div className="p-6 bg-gray-800 min-h-screen text-white">
      <div className="max-w-6xl mx-auto bg-gray-900 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
          <span className="mr-2">📅</span> My Availabilities
        </h2>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-lg mb-6 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <Link
            to="/employee-dashboard/add-availability"
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-semibold transition duration-200"
          >
            Add New Availability
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-400 text-center flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading availabilities...
          </div>
        ) : availabilities.length === 0 ? (
          <p className="text-gray-400 text-center">No availabilities found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-800 text-gray-300">
                  <th className="p-4 text-sm font-semibold border-b border-gray-600">Week Start</th>
                  <th className="p-4 text-sm font-semibold border-b border-gray-600">Week End</th>
                  {daysOfWeek.map((day, idx) => (
                    <th key={idx} className="p-4 text-sm font-semibold border-b border-gray-600">{day}</th>
                  ))}
                  <th className="p-4 text-sm font-semibold border-b border-gray-600">Note</th>
                  <th className="p-4 text-sm font-semibold border-b border-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {availabilities.map((availability, index) => {
                  console.log(`Rendering availability #${index}:`, availability);
                  const renderKey = availability._id ? `${availability._id}-${index}` : `avail-${index}`;
                  return (
                    <tr
                      key={renderKey}
                      className={`border-b border-gray-600 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700'} hover:bg-gray-600 transition-colors`}
                    >
                      <td className="p-4">{dayjs(availability.weekStartDate).utc().format('YYYY-MM-DD')}</td>
                      <td className="p-4">{dayjs(availability.weekEndDate).utc().format('YYYY-MM-DD')}</td>
                      {daysOfWeek.map((day, idx) => {
                        const dayKey = day.toLowerCase();
                        const dayData = availability.days?.[dayKey] || { available: false, slots: [] };
                        return (
                          <td key={idx} className="p-4">
                            {dayData.available ? (
                              dayData.slots.length > 0 ? (
                                <ul className="space-y-1">
                                  {dayData.slots.map((slot, slotIdx) => (
                                    <li key={slotIdx}>
                                      {slot.startDay} {formatTimeTo12Hour(slot.startTime)} - {slot.endDay} {formatTimeTo12Hour(slot.endTime)} ({slot.shiftType})
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                'Available all day'
                              )
                            ) : (
                              'Unavailable'
                            )}
                          </td>
                        );
                      })}
                      <td className="p-4">{availability.note || '-'}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => {
                            console.log('Edit button clicked for availability:', availability._id);
                            handleEdit(availability._id);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for availability:', availability._id);
                            handleDelete(availability._id);
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Availability;
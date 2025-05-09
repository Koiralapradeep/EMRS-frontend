import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../Context/authContext';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import isEqual from 'lodash/isEqual';

const EditAvailabilities = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { availabilityId } = useParams();
  console.log('Extracted availabilityId from useParams:', availabilityId);
  const [employeeId, setEmployeeId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [weekStartDate, setWeekStartDate] = useState(null);
  const [days, setDays] = useState({
    sunday: { available: false, slots: [], note: '' },
    monday: { available: false, slots: [], note: '' },
    tuesday: { available: false, slots: [], note: '' },
    wednesday: { available: false, slots: [], note: '' },
    thursday: { available: false, slots: [], note: '' },
    friday: { available: false, slots: [], note: '' },
    saturday: { available: false, slots: [], note: '' },
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissionDeadline, setSubmissionDeadline] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/login');
      return;
    }

    if (user) {
      setEmployeeId(user._id || user.id);
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
          if (response.data?.success) {
            const userData = response.data.user;
            setEmployeeId(userData._id || userData.id);
            setCompanyId(userData.companyId);
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate('/login');
          }
        } catch (err) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate('/login');
        }
      };
      fetchUserData();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!employeeId || !companyId || !availabilityId) {
      console.log('Missing required data:', { employeeId, companyId, availabilityId });
      return;
    }

    // Temporarily bypass fetch for testing
    const defaultDays = {
      sunday: { available: false, slots: [], note: '' },
      monday: { available: false, slots: [], note: '' },
      tuesday: { available: true, slots: [{ startTime: '09:00', endTime: '17:00', preference: 3 }], note: '' },
      wednesday: { available: true, slots: [{ startTime: '09:00', endTime: '17:00', preference: 3 }], note: '' },
      thursday: { available: false, slots: [], note: '' },
      friday: { available: false, slots: [], note: '' },
      saturday: { available: false, slots: [], note: '' },
    };
    setDays(defaultDays);
    setWeekStartDate(dayjs('2025-04-27')); // A future Sunday
    setIsRecurring(false);
    setOriginalData({
      weekStartDate: '2025-04-27',
      days: defaultDays,
      isRecurring: false,
    });
    setLoading(false);

    /*
    const fetchAvailability = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('Fetching availability with ID:', availabilityId);
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/availability/${employeeId}`, {
          params: { companyId, availabilityId },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        console.log('Fetched availability data:', response.data);

        if (response.data && response.data._id === availabilityId) {
          const fetchedDays = response.data.days;
          const updatedDays = Object.keys(fetchedDays).reduce((acc, day) => {
            if (fetchedDays[day].available && fetchedDays[day].slots.length === 0) {
              return {
                ...acc,
                [day]: {
                  ...fetchedDays[day],
                  slots: [{ startTime: '09:00', endTime: '17:00', preference: 3 }],
                },
              };
            }
            return { ...acc, [day]: fetchedDays[day] };
          }, {});
          console.log('Updated days with default slots:', updatedDays);
          setDays(updatedDays);
          setWeekStartDate(dayjs(response.data.weekStartDate));
          setIsRecurring(response.data.isRecurring);
          setOriginalData({
            weekStartDate: response.data.weekStartDate,
            days: updatedDays,
            isRecurring: response.data.isRecurring,
          });
        } else {
          setError('Availability entry not found for the given ID.');
          navigate('/employee-dashboard/availability');
        }
      } catch (err) {
        console.error('Error fetching availability:', err);
        setError(err.response?.data?.message || 'Failed to load availability data.');
        navigate('/employee-dashboard/availability');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
    */
  }, [employeeId, companyId, availabilityId, navigate]);

  useEffect(() => {
    const today = dayjs();
    const daysUntilWednesday = (3 - today.day() + 7) % 7 || 7;
    const deadline = today.add(daysUntilWednesday, 'day').endOf('day');
    setSubmissionDeadline(deadline);
  }, []);

  const resetForm = () => {
    setDays({
      sunday: { available: false, slots: [], note: '' },
      monday: { available: false, slots: [], note: '' },
      tuesday: { available: false, slots: [], note: '' },
      wednesday: { available: false, slots: [], note: '' },
      thursday: { available: false, slots: [], note: '' },
      friday: { available: false, slots: [], note: '' },
      saturday: { available: false, slots: [], note: '' },
    });
    setIsRecurring(false);
    setError('');
    setSuccess('');
    setOriginalData(null);
  };

  const copyPreviousWeek = async () => {
    try {
      const prevWeek = weekStartDate.subtract(7, 'day').format('YYYY-MM-DD');
      const response = await axios.get(`${API_BASE_URL}/api/availability/${employeeId}`, {
        params: { companyId, weekStartDate: prevWeek },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        withCredentials: true,
      });
      if (response.data.days) {
        setDays(response.data.days);
        setIsRecurring(response.data.isRecurring);
        setSuccess('Copied availability from previous week.');
        toast.success('Copied previous week’s availability!');
      }
    } catch (err) {
      setError('No availability found for previous week.');
      toast.error('No previous week availability found.');
    }
  };

  const handleWeekChange = (e) => {
    const selectedDate = dayjs(e.target.value);
    if (selectedDate.day() !== 0) {
      setError('Please select a Sunday as the week start date.');
      toast.error('Week start must be a Sunday.');
      return;
    }
    if (selectedDate.isBefore(dayjs().startOf('day'))) {
      setError('Week start date must be in the future.');
      toast.error('Week start must be in the future.');
      return;
    }
    setWeekStartDate(selectedDate);
  };

  const toggleDay = (day) => {
    setDays((prev) => {
      const isAvailable = !prev[day].available;
      const slots = isAvailable && prev[day].slots.length === 0 
        ? [{ startTime: '09:00', endTime: '17:00', preference: 3 }] 
        : (isAvailable ? prev[day].slots : []);
      return {
        ...prev,
        [day]: {
          ...prev[day],
          available: isAvailable,
          slots,
        },
      };
    });
  };

  const addTimeSlot = (day) => {
    const newSlot = { startTime: '09:00', endTime: '17:00', preference: 3 };
    setDays((prev) => {
      const updatedSlots = [...prev[day].slots, newSlot];
      const error = validateSlots(updatedSlots);
      if (error) {
        setError(error);
        toast.error(error);
        return prev;
      }
      setError('');
      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: updatedSlots,
        },
      };
    });
  };

  const removeTimeSlot = (day, slotIndex) => {
    setDays((prev) => {
      const updatedSlots = prev[day].slots.filter((_, index) => index !== slotIndex);
      if (updatedSlots.length === 0 && prev[day].available) {
        setError(`At least one time slot is required for ${day}.`);
        toast.error(`At least one time slot is required for ${day}.`);
        return prev;
      }
      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: updatedSlots,
        },
      };
    });
    setError('');
  };

  const updateTimeSlot = (day, slotIndex, field, value) => {
    setDays((prev) => {
      const updatedSlots = [...prev[day].slots];
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [field]: value };
      const error = validateSlots(updatedSlots);
      if (error) {
        setError(error);
        toast.error(error);
        return prev;
      }
      setError('');
      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: updatedSlots,
        },
      };
    });
  };

  const updateNote = (day, value) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        note: value,
      },
    }));
  };

  const validateSlots = (slots) => {
    if (!slots || slots.length === 0) return 'At least one time slot is required.';
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.startTime || !slot.endTime) return 'All time slots must have a start and end time.';
      if (!/^\d{2}:\d{2}$/.test(slot.startTime) || !/^\d{2}:\d{2}$/.test(slot.endTime)) {
        return 'Time slots must be in HH:mm format.';
      }
      if (slot.startTime >= slot.endTime) return 'Start time must be before end time.';
      for (let j = i + 1; j < slots.length; j++) {
        const otherSlot = slots[j];
        if (!(slot.endTime <= otherSlot.startTime || otherSlot.endTime <= slot.startTime)) {
          return 'Overlapping time slots are not allowed.';
        }
      }
    }
    return null;
  };

  const calculateTotalHours = () => {
    return Object.keys(days).reduce((sum, day) => {
      if (!days[day].available) return sum;
      return sum + days[day].slots.reduce((daySum, slot) => {
        const start = dayjs(`2025-01-01 ${slot.startTime}`);
        const end = dayjs(`2025-01-01 ${slot.endTime}`);
        return daySum + end.diff(start, 'hour', true);
      }, 0);
    }, 0);
  };

  const getChangedFields = () => {
    const changes = {};
    if (!originalData) return changes;

    if (weekStartDate && !weekStartDate.isSame(dayjs(originalData.weekStartDate))) {
      changes.weekStartDate = weekStartDate.format('YYYY-MM-DD');
      changes.weekEndDate = weekStartDate.add(6, 'day').format('YYYY-MM-DD');
    }

    const changedDays = {};
    let daysChanged = false;
    Object.keys(days).forEach((day) => {
      if (!isEqual(days[day], originalData.days[day])) {
        changedDays[day] = days[day];
        daysChanged = true;
      }
    });
    if (daysChanged) {
      changes.days = changedDays;
    }

    if (isRecurring !== originalData.isRecurring) {
      changes.isRecurring = isRecurring;
    }

    changes.employeeId = employeeId;
    changes.companyId = companyId;

    console.log('Changed fields:', changes);
    return changes;
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (dayjs().isAfter(submissionDeadline)) {
      setError(`Submission deadline has passed (${submissionDeadline.format('MMMM D, YYYY HH:mm')}). Please submit for the next week.`);
      toast.error('Submission deadline passed.');
      setLoading(false);
      return;
    }

    const totalHours = calculateTotalHours();
    if (totalHours < 10) {
      setError('You must provide at least 10 hours of availability.');
      toast.error('Minimum 10 hours required.');
      setLoading(false);
      return;
    }

    for (const day of Object.keys(days)) {
      if (days[day].available) {
        const error = validateSlots(days[day].slots);
        if (error) {
          setError(`Invalid slots for ${day}: ${error}`);
          toast.error(`Invalid slots for ${day}.`);
          setLoading(false);
          return;
        }
      }
    }

    if (!employeeId || !companyId) {
      setError('Required user data is missing. Please log in again.');
      toast.error('User data missing. Please log in.');
      setLoading(false);
      return;
    }

    const payload = getChangedFields();
    if (Object.keys(payload).length === 2) {
      setError('No changes detected.');
      toast.error('No changes to save.');
      setLoading(false);
      return;
    }

    console.log('Submitting payload:', JSON.stringify(payload, null, 2));
    try {
      const token = localStorage.getItem("token");
      // Temporarily hardcode availabilityId for testing
      const tempAvailabilityId = "60c72b2f9b1d8e1b4c8f9a2b"; // Replace with a valid ID from your database
      const response = await axios.put(`${API_BASE_URL}/api/availability/${tempAvailabilityId}`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        withCredentials: true,
      });
      setSuccess('Availability updated successfully!');
      toast.success('Availability updated!');
      resetForm();
      setTimeout(() => navigate('/employee-dashboard/availability'), 1500);
    } catch (error) {
      const message = error.response?.data?.message || 'Submission failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopRecurring = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_BASE_URL}/api/availability/stop-recurring/${employeeId}`,
        { companyId },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setIsRecurring(false);
      setSuccess('Recurring availability stopped for future weeks.');
      toast.success('Recurring availability stopped.');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to stop recurring availability.';
      setError(message);
      toast.error(message);
    }
  };

  const daysOfWeek = [
    { key: 'sunday', label: 'Sunday', idx: 0 },
    { key: 'monday', label: 'Monday', idx: 1 },
    { key: 'tuesday', label: 'Tuesday', idx: 2 },
    { key: 'wednesday', label: 'Wednesday', idx: 3 },
    { key: 'thursday', label: 'Thursday', idx: 4 },
    { key: 'friday', label: 'Friday', idx: 5 },
    { key: 'saturday', label: 'Saturday', idx: 6 },
  ];

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="mr-2">📅</span> Edit Availability
      </h2>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-600 text-white p-3 rounded mb-4">
          <strong>Success:</strong> {success}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400">Loading availability...</p>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-300">
              Total Availability: {calculateTotalHours().toFixed(2)} hours{' '}
              {calculateTotalHours() < 10 && <span className="text-red-400">(Minimum 10 hours required)</span>}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Week Start Date (Must be a Sunday):
            </label>
            <input
              type="date"
              value={weekStartDate ? weekStartDate.format('YYYY-MM-DD') : ''}
              onChange={handleWeekChange}
              min={dayjs().format('YYYY-MM-DD')}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            />
            {submissionDeadline && (
              <p className="text-sm text-gray-400 mt-2">
                Submission Deadline: {submissionDeadline.format('MMMM D, YYYY HH:mm')}
              </p>
            )}
          </div>

          <div className="mb-4 flex gap-4">
            <button
              onClick={copyPreviousWeek}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Copy Previous Week
            </button>
            <label className="flex items-center text-white">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={() => setIsRecurring(!isRecurring)}
                className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
              />
              Apply Recurring (Next 4 Weeks)
            </label>
            {isRecurring && (
              <button
                onClick={handleStopRecurring}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Stop Recurring
              </button>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Select Weekly Days</h3>
            <p className="text-sm text-gray-400 mb-2">Unchecked days are marked as unavailable.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {daysOfWeek.map((day) => (
                <label key={day.key} className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={days[day.key].available}
                    onChange={() => toggleDay(day.key)}
                    className="mr-2 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-600 rounded"
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Time Slots</h3>
            {daysOfWeek.map((day) => {
              console.log(`Rendering ${day.key}:`, { available: days[day.key].available, slots: days[day.key].slots });
              return (
                days[day.key].available && (
                  <div key={day.key} className="mb-4">
                    <h4 className="text-md font-medium text-white mb-2">
                      {day.label} ({weekStartDate?.add(day.idx, 'day').format('YYYY-MM-DD')})
                    </h4>
                    {days[day.key].slots.length === 0 && (
                      <p className="text-sm italic text-gray-400">No time slots added (available all day)</p>
                    )}
                    {days[day.key].slots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 mb-2">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(day.key, index, 'startTime', e.target.value)}
                          step="1800"
                          className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(day.key, index, 'endTime', e.target.value)}
                          step="1800"
                          className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <select
                          value={slot.preference}
                          onChange={(e) => updateTimeSlot(day.key, index, 'preference', parseInt(e.target.value))}
                          className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
                        >
                          {[1, 2, 3, 4, 5].map((val) => (
                            <option key={val} value={val}>{val} (Preference)</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeTimeSlot(day.key, index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addTimeSlot(day.key)}
                      className="text-sm text-blue-500 hover:text-blue-400 flex items-center mt-2"
                    >
                      <FaPlus className="mr-1" /> Add Time Slot
                    </button>
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Optional Note (e.g., prefer morning shifts)
                      </label>
                      <textarea
                        value={days[day.key].note}
                        onChange={(e) => updateNote(day.key, e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional note"
                      />
                    </div>
                  </div>
                )
              );
            })}
          </div>

          <div className="text-right">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold disabled:bg-gray-600"
            >
              {loading ? 'Updating...' : 'Update Availability'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EditAvailabilities;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../Context/authContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AvailabilityForm = ({ availabilityId }) => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
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
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            setEmployeeId(userData._id || userData.id);
            setCompanyId(userData.companyId);

            if (userData.role === 'Admin' && !userData.companyId) {
              navigate('/admin/company-setup');
              return;
            }

            if (userData.role === 'Employee' && !userData.companyId) {
              setError('Your account is not fully set up: Missing company. Please contact your admin.');
              return;
            }
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
  }, [user, navigate, setUser]);

  useEffect(() => {
    const today = dayjs();
    const daysUntilSunday = (7 - today.day()) % 7 || 7;
    const nextSunday = today.add(daysUntilSunday, 'day').startOf('day');
    setWeekStartDate(nextSunday);

    const saturdayBefore = nextSunday.subtract(1, 'day').endOf('day');
    setSubmissionDeadline(saturdayBefore);

    if (!availabilityId) {
      resetForm();
    }
  }, [availabilityId]);

  useEffect(() => {
    if (!weekStartDate || !employeeId || !companyId || !availabilityId) return;

    const fetchAvailability = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/availability/${employeeId}`, {
          params: {
            companyId,
            weekStartDate: weekStartDate.format('YYYY-MM-DD'),
          },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data && response.data._id === availabilityId) {
          const fetchedDays = response.data.days;
          Object.keys(fetchedDays).forEach(day => {
            if (fetchedDays[day].slots) {
              fetchedDays[day].slots = fetchedDays[day].slots.map(slot => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                startDay: slot.startDay || day,
                endDay: slot.endDay || day,
                shiftType: slot.shiftType || 'Day',
                preference: slot.preference || 0, // Default to 0 if not present
              }));
            }
          });
          setDays(fetchedDays);
          setWeekStartDate(dayjs(response.data.weekStartDate));
          setIsRecurring(response.data.isRecurring);
        } else {
          resetForm();
        }
      } catch (err) {
        setError('Failed to load existing availability.');
        toast.error('Failed to load availability.');
      }
    };

    fetchAvailability();
  }, [weekStartDate, employeeId, companyId, availabilityId]);

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
  };

  const copyPreviousWeek = async () => {
    try {
      const prevWeek = weekStartDate.subtract(7, 'day').format('YYYY-MM-DD');
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/availability/${employeeId}`, {
        params: { companyId, weekStartDate: prevWeek },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (response.data && response.data.days) {
        const copiedDays = { ...response.data.days };
        Object.keys(copiedDays).forEach(day => {
          if (copiedDays[day].slots) {
            copiedDays[day].slots = copiedDays[day].slots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime,
              startDay: slot.startDay || day,
              endDay: slot.endDay || day,
              shiftType: slot.shiftType || 'Day',
              preference: slot.preference || 0,
            }));
          }
        });

        setDays(copiedDays);
        setIsRecurring(response.data.isRecurring || false);
        setSuccess('Successfully copied availability from the previous week.');
        toast.success('Copied previous week’s availability!', { duration: 7000 });
      } else {
        setError('No availability found for the previous week.');
        toast.error('No previous week availability found.', { duration: 7000 });
      }
    } catch (err) {
      setError('Failed to copy availability from the previous week.');
      toast.error('Failed to copy previous week availability.', { duration: 7000 });
    }
  };

  const handleWeekChange = (e) => {
    const selectedDate = dayjs(e.target.value);
    if (selectedDate.day() !== 0) {
      setError('Please select a Sunday as the week start date.');
      toast.error('Week start must be a Sunday.', { duration: 7000 });
      return;
    }
    if (selectedDate.isBefore(dayjs().startOf('day'))) {
      setError('Week start date must be in the future.');
      toast.error('Week start must be in the future.', { duration: 7000 });
      return;
    }
    setWeekStartDate(selectedDate);
    const saturdayBefore = selectedDate.subtract(1, 'day').endOf('day');
    setSubmissionDeadline(saturdayBefore);
    resetForm();
  };

  const toggleDay = (day) => {
    setDays((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available,
        slots: !prev[day].available ? [{ startTime: '05:00', endTime: '17:00', startDay: day, endDay: day, shiftType: 'Day', preference: 0 }] : [],
      },
    }));
  };

  const addTimeSlot = (day) => {
    const newSlot = { startTime: '05:00', endTime: '17:00', startDay: day, endDay: day, shiftType: 'Day', preference: 0 };
    setDays((prev) => {
      const updatedSlots = [...prev[day].slots, newSlot];
      const error = validateSlots(updatedSlots, day);
      if (error) {
        setError(error);
        toast.error(error, { duration: 7000 });
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
        toast.error(`At least one time slot is required for ${day}.`, { duration: 7000 });
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
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [field]: field === 'preference' ? parseInt(value) : value };
      const error = validateSlots(updatedSlots, day);
      if (error) {
        setError(error);
        toast.error(error, { duration: 7000 });
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

  const validateSlots = (slots, baseDay) => {
    if (!slots || slots.length === 0) return 'At least one time slot is required.';
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot.startTime || !slot.endTime || !slot.startDay || !slot.endDay || !slot.shiftType) {
        console.log(`Validation failed for ${baseDay} slot ${i}: Missing required fields`, slot);
        return 'All time slots must have a start time, end time, start day, end day, and shift type.';
      }
      if (!/^\d{2}:\d{2}$/.test(slot.startTime) || !/^\d{2}:\d{2}$/.test(slot.endTime)) {
        console.log(`Validation failed for ${baseDay} slot ${i}: Invalid time format`, slot);
        return 'Time slots must be in HH:mm format.';
      }
      if (!['Day', 'Night'].includes(slot.shiftType)) {
        console.log(`Validation failed for ${baseDay} slot ${i}: Invalid shift type`, slot);
        return 'Shift type must be either "Day" or "Night".';
      }
      if (isNaN(slot.preference) || slot.preference < 0 || slot.preference > 10) {
        console.log(`Validation failed for ${baseDay} slot ${i}: Invalid preference`, slot);
        return 'Preference must be a number between 0 and 10.';
      }

      const dayIndex = daysOfWeek.find(d => d.key === slot.startDay)?.idx || 0;
      const endDayIndex = daysOfWeek.find(d => d.key === slot.endDay)?.idx || 0;
      const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
      let endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
      let adjustedEndMinutes = endMinutes;
      let daySpan = 0;

      if (endDayIndex < dayIndex) {
        daySpan = 7 - dayIndex + endDayIndex;
        adjustedEndMinutes += daySpan * 24 * 60;
      } else if (endDayIndex === dayIndex && endMinutes <= startMinutes) {
        daySpan = 1;
        adjustedEndMinutes += 24 * 60;
      } else {
        daySpan = endDayIndex - dayIndex;
        if (endMinutes <= startMinutes) {
          adjustedEndMinutes += 24 * 60;
          daySpan += 1;
        }
      }

      console.log(`Validating slot for ${baseDay}:`, {
        startDay: slot.startDay,
        endDay: slot.endDay,
        startMinutes,
        endMinutes,
        adjustedEndMinutes,
        daySpan,
      });

      if (startMinutes === adjustedEndMinutes && daySpan === 0) {
        console.log(`Validation failed for ${baseDay} slot ${i}: Start and end times are the same on the same day`, slot);
        return 'Start time and end time cannot be the same on the same day.';
      }

      for (let j = 0; j < slots.length; j++) {
        if (i === j) continue;
        const otherSlot = slots[j];
        const otherDayIndex = daysOfWeek.find(d => d.key === otherSlot.startDay)?.idx || 0;
        const otherEndDayIndex = daysOfWeek.find(d => d.key === otherSlot.endDay)?.idx || 0;
        const otherStartMinutes = parseInt(otherSlot.startTime.split(':')[0]) * 60 + parseInt(otherSlot.startTime.split(':')[1]);
        let otherEndMinutes = parseInt(otherSlot.endTime.split(':')[0]) * 60 + parseInt(otherSlot.endTime.split(':')[1]);
        let adjustedOtherEndMinutes = otherEndMinutes;
        let otherDaySpan = 0;

        if (otherEndDayIndex < otherDayIndex) {
          otherDaySpan = 7 - otherDayIndex + otherEndDayIndex;
          adjustedOtherEndMinutes += otherDaySpan * 24 * 60;
        } else if (otherEndDayIndex === otherDayIndex && otherEndMinutes <= otherStartMinutes) {
          otherDaySpan = 1;
          adjustedOtherEndMinutes += 24 * 60;
        } else {
          otherDaySpan = otherEndDayIndex - otherDayIndex;
          if (otherEndMinutes <= otherStartMinutes) {
            adjustedOtherEndMinutes += 24 * 60;
            otherDaySpan += 1;
          }
        }

        if (slot.startDay === otherSlot.startDay) {
          if (
            (startMinutes > otherStartMinutes && startMinutes < adjustedOtherEndMinutes) ||
            (adjustedEndMinutes > otherStartMinutes && adjustedEndMinutes < adjustedOtherEndMinutes) ||
            (startMinutes <= otherStartMinutes && adjustedEndMinutes >= adjustedOtherEndMinutes)
          ) {
            console.log(`Validation failed for ${baseDay} slot ${i}: Overlapping time slots`, { slot, otherSlot });
            return `Overlapping time slots are not allowed on ${slot.startDay}.`;
          }
        }
      }
    }
    return null;
  };

  const calculateTotalHours = () => {
    return Object.keys(days).reduce((sum, day) => {
      if (!days[day].available) return sum;
      return sum + days[day].slots.reduce((daySum, slot) => {
        const startDayIndex = daysOfWeek.find(d => d.key === slot.startDay)?.idx || 0;
        const endDayIndex = daysOfWeek.find(d => d.key === slot.endDay)?.idx || 0;
        const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
        let endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
        let daySpan = 0;

        if (endDayIndex < startDayIndex) {
          daySpan = 7 - startDayIndex + endDayIndex;
        } else if (endDayIndex === startDayIndex && endMinutes <= startMinutes) {
          daySpan = 1;
          endMinutes += 24 * 60;
        } else {
          daySpan = endDayIndex - startDayIndex;
          if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
            daySpan += 1;
          }
        }

        const hours = (endMinutes - startMinutes) / 60 + (daySpan * 24);
        console.log(`Calculating hours for ${day} slot:`, { startMinutes, endMinutes, daySpan, hours });
        return daySum + hours;
      }, 0);
    }, 0);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (dayjs().isAfter(submissionDeadline)) {
      setError(`Submission deadline has passed (${submissionDeadline.format('MMMM D, YYYY HH:mm')}). Please submit for the next week.`);
      toast.error('Submission deadline passed.', { duration: 7000 });
      setLoading(false);
      return;
    }

    const totalHours = calculateTotalHours();
    if (totalHours < 10) {
      setError('You must provide at least 10 hours of availability.');
      toast.error('Minimum 10 hours required.', { duration: 7000 });
      setLoading(false);
      return;
    }

    for (const day of Object.keys(days)) {
      if (days[day].available) {
        const error = validateSlots(days[day].slots, day);
        if (error) {
          setError(`Invalid slots for ${day}: ${error}`);
          toast.error(`Invalid slots for ${day}.`, { duration: 7000 });
          setLoading(false);
          return;
        }
      }
    }

    if (!employeeId || !companyId || !weekStartDate) {
      setError('Required user data is missing. Please log in again.');
      toast.error('User data missing. Please log in.', { duration: 7000 });
      setLoading(false);
      return;
    }

    const payload = {
      employeeId,
      companyId,
      weekStartDate: weekStartDate.format('YYYY-MM-DD'),
      weekEndDate: weekStartDate.add(6, 'day').format('YYYY-MM-DD'),
      days,
      note: Object.values(days)
        .map(day => day.note)
        .filter(note => note)
        .join('; '),
      isRecurring,
    };

    try {
      const token = localStorage.getItem("token");
      if (availabilityId) {
        const response = await axios.put(`${API_BASE_URL}/api/availability/${availabilityId}`, payload, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          withCredentials: true,
        });
        setSuccess('Availability updated successfully!');
        toast.success('Availability updated!', { duration: 7000 });
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/availability`, payload, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          withCredentials: true,
        });
        setSuccess('Availability added successfully!');
        toast.success('Availability added!', { duration: 7000 });
      }
      setTimeout(() => navigate('/employee-dashboard/availability'), 1500);
    } catch (error) {
      const message = error.response?.data?.message || 'Submission failed. Please try again.';
      setError(message);
      toast.error(message, { duration: 7000 });
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
      toast.success('Recurring availability stopped.', { duration: 7000 });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to stop recurring availability.';
      setError(message);
      toast.error(message, { duration: 7000 });
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
    <div className="p-6 bg-gray-800 min-h-screen text-white">
      <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center text-white">
          <span className="mr-2">📅</span> {availabilityId ? 'Edit Your Availability' : 'Set Your Weekly Availability'}
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

        <div className="mb-6">
          <p className="text-sm text-gray-300">
            Total Availability: <span className="font-semibold">{calculateTotalHours().toFixed(2)} hours</span>
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
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {submissionDeadline && (
            <p className="text-sm text-gray-400 mt-2">
              Submission Deadline: {submissionDeadline.format('MMMM D, YYYY HH:mm')}
            </p>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            onClick={copyPreviousWeek}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200"
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
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Stop Recurring
            </button>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Select Available Days</h3>
          <p className="text-sm text-gray-400 mb-2">Unchecked days will be marked as unavailable.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Set Time Slots</h3>
          {daysOfWeek.map((day) => (
            days[day.key].available && (
              <div key={day.key} className="mb-6 p-4 bg-gray-800 rounded-lg">
                <h4 className="text-md font-medium text-white mb-2">
                  {day.label} ({weekStartDate?.add(day.idx, 'day').format('YYYY-MM-DD')})
                </h4>
                {days[day.key].slots.length === 0 && (
                  <p className="text-sm italic text-gray-400">No time slots added (available all day)</p>
                )}
                {days[day.key].slots.map((slot, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-3 mb-3">
                    <select
                      value={slot.startDay}
                      onChange={(e) => updateTimeSlot(day.key, index, 'startDay', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {daysOfWeek.map(d => (
                        <option key={d.key} value={d.key}>{d.label}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateTimeSlot(day.key, index, 'startTime', e.target.value)}
                      step="1800"
                      className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">to</span>
                    <select
                      value={slot.endDay}
                      onChange={(e) => updateTimeSlot(day.key, index, 'endDay', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      {daysOfWeek.map(d => (
                        <option key={d.key} value={d.key}>{d.label}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateTimeSlot(day.key, index, 'endTime', e.target.value)}
                      step="1800"
                      className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={slot.shiftType}
                      onChange={(e) => updateTimeSlot(day.key, index, 'shiftType', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Day">Day Shift</option>
                      <option value="Night">Night Shift</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={slot.preference}
                      onChange={(e) => updateTimeSlot(day.key, index, 'preference', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Preference (0-10)"
                    />
                    <button
                      onClick={() => removeTimeSlot(day.key, index)}
                      className="text-red-500 hover:text-red-700"
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
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional note"
                  />
                </div>
              </div>
            )
          ))}
        </div>

        <div className="text-right">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition duration-200 disabled:bg-gray-600"
          >
            {loading ? 'Submitting...' : availabilityId ? 'Update Availability' : 'Submit Availability'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityForm;
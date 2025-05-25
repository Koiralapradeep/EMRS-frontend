import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../Context/authContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { FaPlus, FaEdit, FaSave, FaTimes, FaTrash } from 'react-icons/fa';

const ShiftRequirements = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState({ fetch: false, save: false, departments: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [shiftRequirements, setShiftRequirements] = useState({
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
  });
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [addingShift, setAddingShift] = useState(null);
  const [newSlot, setNewSlot] = useState({
    startDay: '',
    endDay: '',
    startTime: '',
    endTime: '',
    shiftType: 'Day',
    minEmployees: '',
  });
  const [originalShiftRequirements, setOriginalShiftRequirements] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  useEffect(() => {
    if (!user || user.role.toLowerCase() !== 'manager') {
      toast.error('Unauthorized access. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found. Please log in.');
      navigate('/login');
      return;
    }

    fetchDepartments();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedDepartment) {
      fetchShiftRequirements();
    } else {
      setShiftRequirements({
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
      });
    }
  }, [selectedDepartment]);

  const fetchDepartments = async () => {
    setLoading((prev) => ({ ...prev, departments: true }));
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/departments/`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        timeout: 10000,
      });
      const deptData = response.data || [];
      setDepartments(deptData);
      if (deptData.length > 0) {
        setSelectedDepartment(deptData[0]._id);
      } else {
        setSelectedDepartment('');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch departments. Please try again later.';
      setError(message);
      toast.error(message);
      setDepartments([]);
      setSelectedDepartment('');
    } finally {
      setLoading((prev) => ({ ...prev, departments: false }));
    }
  };

  const fetchShiftRequirements = async () => {
    setLoading((prev) => ({ ...prev, fetch: true }));
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/availability/shift-requirements/${user.companyId}`, {
        params: { departmentId: selectedDepartment },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const requirements = response.data.find((req) => req.departmentId === selectedDepartment) || {};
      const updatedRequirements = {
        sunday: (requirements.sunday || []).filter(slot => slot.startDay && slot.endDay),
        monday: (requirements.monday || []).filter(slot => slot.startDay && slot.endDay),
        tuesday: (requirements.tuesday || []).filter(slot => slot.startDay && slot.endDay),
        wednesday: (requirements.wednesday || []).filter(slot => slot.startDay && slot.endDay),
        thursday: (requirements.thursday || []).filter(slot => slot.startDay && slot.endDay),
        friday: (requirements.friday || []).filter(slot => slot.startDay && slot.endDay),
        saturday: (requirements.saturday || []).filter(slot => slot.startDay && slot.endDay),
      };
      setShiftRequirements(updatedRequirements);
      setOriginalShiftRequirements(JSON.parse(JSON.stringify(updatedRequirements)));
      console.log('Fetched shift requirements:', updatedRequirements);
    } catch (err) {
      if (err.response?.status !== 404) {
        const message = err.response?.data?.message || 'Failed to fetch shift requirements. Please try again later.';
        setError(message);
        toast.error(message);
      }
      setShiftRequirements({
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
      });
      setOriginalShiftRequirements(null);
    } finally {
      setLoading((prev) => ({ ...prev, fetch: false }));
    }
  };

  const validateSlot = (day, slot, allSlots, index) => {
    const start = dayjs(`2025-01-01 ${slot.startTime}`, 'YYYY-MM-DD HH:mm');
    const end = dayjs(`2025-01-01 ${slot.endTime}`, 'YYYY-MM-DD HH:mm');
    if (!start.isValid() || !end.isValid()) {
      console.log(`Invalid time format for ${day} slot ${index + 1}: startTime=${slot.startTime}, endTime=${slot.endTime}`);
      toast.error(`Invalid time format for ${day} slot ${index + 1}.`);
      return false;
    }

    const daysOfWeekIndices = daysOfWeek.reduce((acc, d, idx) => {
      acc[d] = idx;
      return acc;
    }, {});
    const startDayIdx = daysOfWeekIndices[slot.startDay.toLowerCase()];
    const endDayIdx = daysOfWeekIndices[slot.endDay.toLowerCase()];
    const startMinutes = parseInt(slot.startTime.split(':')[0]) * 60 + parseInt(slot.startTime.split(':')[1]);
    let endMinutes = parseInt(slot.endTime.split(':')[0]) * 60 + parseInt(slot.endTime.split(':')[1]);
    let adjustedEndMinutes = endMinutes;
    let daySpan = 0;

    console.log(`Validating slot for ${day}:`, {
      startDay: slot.startDay,
      endDay: slot.endDay,
      startDayIdx,
      endDayIdx,
      startMinutes,
      endMinutes,
    });

    if (endDayIdx < startDayIdx) {
      daySpan = 7 - startDayIdx + endDayIdx;
      adjustedEndMinutes += daySpan * 24 * 60;
      console.log(`End day is before start day, daySpan=${daySpan}, adjustedEndMinutes=${adjustedEndMinutes}`);
    } else if (endDayIdx === startDayIdx && endMinutes <= startMinutes) {
      daySpan = 1;
      adjustedEndMinutes += 24 * 60;
      console.log(`Same day but end time before start time, daySpan=${daySpan}, adjustedEndMinutes=${adjustedEndMinutes}`);
    } else {
      daySpan = endDayIdx - startDayIdx;
      if (endMinutes <= startMinutes) {
        adjustedEndMinutes += 24 * 60;
        daySpan += 1;
      }
      console.log(`Normal case, daySpan=${daySpan}, adjustedEndMinutes=${adjustedEndMinutes}`);
    }

    if (startMinutes === adjustedEndMinutes && daySpan === 0) {
      console.log(`Start time and end time are the same with no day span for ${day} slot ${index + 1}`);
      toast.error(`Start time and end time cannot be the same for ${day} slot ${index + 1}.`);
      return false;
    }

    // Simplified overlap detection
    for (let i = 0; i < allSlots.length; i++) {
      if (i === index) continue;
      const otherSlot = allSlots[i];
      const otherStartDayIdx = daysOfWeekIndices[otherSlot.startDay.toLowerCase()];
      const otherEndDayIdx = daysOfWeekIndices[otherSlot.endDay.toLowerCase()];
      const otherStartMinutes = parseInt(otherSlot.startTime.split(':')[0]) * 60 + parseInt(otherSlot.startTime.split(':')[1]);
      let otherEndMinutes = parseInt(otherSlot.endTime.split(':')[0]) * 60 + parseInt(otherSlot.endTime.split(':')[1]);
      let otherAdjustedEndMinutes = otherEndMinutes;
      let otherDaySpan = 0;

      if (otherEndDayIdx < otherStartDayIdx) {
        otherDaySpan = 7 - otherStartDayIdx + otherEndDayIdx;
        otherAdjustedEndMinutes += otherDaySpan * 24 * 60;
      } else if (otherEndDayIdx === otherStartDayIdx && otherEndMinutes <= otherStartMinutes) {
        otherDaySpan = 1;
        otherAdjustedEndMinutes += 24 * 60;
      } else {
        otherDaySpan = otherEndDayIdx - otherStartDayIdx;
        if (otherEndMinutes <= otherStartMinutes) {
          otherAdjustedEndMinutes += 24 * 60;
          otherDaySpan += 1;
        }
      }

      // Check if slots overlap on the same day
      if (startDayIdx === otherStartDayIdx) {
        const slotStart = startMinutes;
        const slotEnd = adjustedEndMinutes + (daySpan * 24 * 60);
        const otherSlotStart = otherStartMinutes;
        const otherSlotEnd = otherAdjustedEndMinutes + (otherDaySpan * 24 * 60);

        if (
          (slotStart > otherSlotStart && slotStart < otherSlotEnd) ||
          (slotEnd > otherSlotStart && slotEnd < otherSlotEnd) ||
          (slotStart <= otherSlotStart && slotEnd >= otherSlotEnd)
        ) {
          console.log(`Overlap detected for ${day} slot ${index + 1} with slot ${i}:`, {
            slotStart,
            slotEnd,
            otherSlotStart,
            otherSlotEnd,
          });
          toast.error(`Time slot overlaps with another slot on ${day}.`);
          return false;
        }
      }
    }

    const minEmployees = parseInt(slot.minEmployees);
    if (isNaN(minEmployees) || minEmployees < 1) {
      console.log(`Minimum employees invalid for ${day} slot ${index + 1}: minEmployees=${slot.minEmployees}`);
      toast.error(`Minimum employees must be at least 1 for ${day} slot ${index + 1}.`);
      return false;
    }

    return true;
  };

  const startAddingShiftSlot = (day) => {
    setAddingShift(day);
    setNewSlot({
      startDay: day,
      endDay: day,
      startTime: '',
      endTime: '',
      shiftType: 'Day',
      minEmployees: '',
    });
  };

  const cancelAddingShiftSlot = () => {
    setAddingShift(null);
    setNewSlot({
      startDay: '',
      endDay: '',
      startTime: '',
      endTime: '',
      shiftType: 'Day',
      minEmployees: '',
    });
  };

  const addShiftSlot = async (day) => {
    if (
      !newSlot.startTime ||
      !newSlot.endTime ||
      !newSlot.minEmployees ||
      !newSlot.startDay ||
      !newSlot.endDay ||
      !newSlot.shiftType
    ) {
      toast.error('Please fill in all fields for the new slot.');
      return;
    }

    const newSlotData = {
      startDay: newSlot.startDay,
      endDay: newSlot.endDay,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      shiftType: newSlot.shiftType,
      minEmployees: parseInt(newSlot.minEmployees),
    };
    console.log(`Adding shift slot for ${day}:`, newSlotData);

    const newSlots = [...shiftRequirements[day], newSlotData];

    if (!validateSlot(day, newSlotData, newSlots, newSlots.length - 1)) {
      return;
    }

    setLoading((prev) => ({ ...prev, save: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/availability/shift-requirements/${user.companyId}/${selectedDepartment}/add-slot`,
        { day, slot: newSlotData },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setSuccess(response.data.message);
      toast.success(response.data.message, { duration: 7000 });
      setShiftRequirements(response.data.data);
      setOriginalShiftRequirements(JSON.parse(JSON.stringify(response.data.data)));
      setAddingShift(null);
      setNewSlot({
        startDay: '',
        endDay: '',
        startTime: '',
        endTime: '',
        shiftType: 'Day',
        minEmployees: '',
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add slot. Please try again later.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const updateNewSlot = (field, value) => {
    if (field === 'minEmployees') {
      setNewSlot((prev) => ({
        ...prev,
        [field]: value === '' ? '' : parseInt(value),
      }));
    } else {
      setNewSlot((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const updateShiftSlot = (day, index, field, value) => {
    setShiftRequirements((prev) => {
      const newSlots = [...prev[day]];
      if (field === 'minEmployees') {
        newSlots[index] = { ...newSlots[index], [field]: value === '' ? '' : parseInt(value) };
      } else {
        newSlots[index] = { ...newSlots[index], [field]: value };
      }
      return {
        ...prev,
        [day]: newSlots,
      };
    });
  };

  const saveShiftSlot = async (day, index) => {
    const newSlots = [...shiftRequirements[day]];
    const slot = newSlots[index];
    console.log(`Saving shift slot for ${day}, index ${index}:`, slot);

    if (!slot.startDay || !slot.endDay) {
      toast.error(`Start Day and End Day are required for ${day} slot ${index + 1}.`);
      return false;
    }

    if (!validateSlot(day, slot, newSlots, index)) {
      return false;
    }

    setLoading((prev) => ({ ...prev, save: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/availability/shift-requirements/${user.companyId}/${selectedDepartment}/edit-slot`,
        { day, slotIndex: index, slot },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setSuccess(response.data.message);
      toast.success(response.data.message, { duration: 7000 });
      setShiftRequirements(response.data.data);
      setOriginalShiftRequirements(JSON.parse(JSON.stringify(response.data.data)));
      setEditingShiftId(null);
      return true;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update slot. Please try again later.';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setLoading((prev) => ({ ...prev, save: false }));
    }
  };

  const deleteShiftSlot = async (day, index) => {
  // Add confirmation prompt
  const confirmDelete = window.confirm(`Are you sure you want to delete the shift slot for ${day.charAt(0).toUpperCase() + day.slice(1)}?`);
  if (!confirmDelete) {
    console.log('Shift slot deletion cancelled by user');
    return;
  }

  setLoading((prev) => ({ ...prev, save: true }));
  try {
    const token = localStorage.getItem('token');
    console.log('Sending DELETE request:', {
      url: `${API_BASE_URL}/api/availability/${user.companyId}/${selectedDepartment}/shift-requirements`,
      companyId: user.companyId,
      departmentId: selectedDepartment,
      day,
      slotIndex: index,
      token: token ? token.slice(0, 20) + '...' : 'No token'
    });
    const response = await axios.delete(
      `${API_BASE_URL}/api/availability/${user.companyId}/${selectedDepartment}/shift-requirements`,
      {
        data: { day, slotIndex: index },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      }
    );
    console.log('DELETE response:', response.data);
    setSuccess(response.data.message);
    toast.success(response.data.message, { duration: 7000 });
    setShiftRequirements(response.data.data);
    setOriginalShiftRequirements(JSON.parse(JSON.stringify(response.data.data)));
  } catch (err) {
    const message = err.response?.data?.message || 'Failed to delete slot. Please try again later.';
    console.error('DELETE error:', {
      message,
      status: err.response?.status,
      response: err.response?.data
    });
    setError(message);
    toast.error(message);
  } finally {
    setLoading((prev) => ({ ...prev, save: false }));
  }
};

  const startEditingShiftSlot = (day, index) => {
    setEditingShiftId(`${day}-${index}`);
  };

  const cancelEditingShiftSlot = () => {
    setEditingShiftId(null);
    setShiftRequirements(JSON.parse(JSON.stringify(originalShiftRequirements)));
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <div className="max-w-5xl mx-auto bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Manage Shift Requirements</h2>

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

        {loading.departments ? (
          <div className="text-gray-400 text-center flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading departments...
          </div>
        ) : departments.length === 0 ? (
          <div className="text-gray-400 text-center">
            No departments found. Please create departments in your company settings to proceed.
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading.save || loading.fetch}
              >
                <option value="">Select a department</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name || dept.departmentName}
                  </option>
                ))}
              </select>
            </div>

            {loading.fetch ? (
              <div className="text-gray-400 text-center flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading shift requirements...
              </div>
            ) : selectedDepartment ? (
              <div className="space-y-8">
                {daysOfWeek.map((day) => (
                  <div key={day} className="bg-gray-700 p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white capitalize">{day}</h3>
                      <button
                        onClick={() => startAddingShiftSlot(day)}
                        className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 disabled:bg-gray-500"
                        disabled={loading.save}
                        title="Add a new shift slot"
                      >
                        <FaPlus className="mr-2" /> Add Slot
                      </button>
                    </div>
                    {Array.isArray(shiftRequirements[day]) && shiftRequirements[day].length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-gray-600 text-gray-200">
                              <th className="p-3">Start Day</th>
                              <th className="p-3">Start Time</th>
                              <th className="p-3">End Day</th>
                              <th className="p-3">End Time</th>
                              <th className="p-3">Shift Type</th>
                              <th className="p-3">Min Employees</th>
                              <th className="p-3">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shiftRequirements[day].map((slot, index) => {
                              const isEditing = editingShiftId === `${day}-${index}`;
                              const startTimeFormatted = slot.startTime
                                ? dayjs(`2025-01-01 ${slot.startTime}`, 'YYYY-MM-DD HH:mm').format('hh:mm A')
                                : 'Invalid Time';
                              const endTimeFormatted = slot.endTime
                                ? dayjs(`2025-01-01 ${slot.endTime}`, 'YYYY-MM-DD HH:mm').format('hh:mm A')
                                : 'Invalid Time';
                              const displayStartDay = slot.startDay || 'N/A';
                              const displayEndDay = slot.endDay || 'N/A';
                              return (
                                <tr key={index} className="border-b border-gray-600 hover:bg-gray-600">
                                  <td className="p-3">
                                    {isEditing ? (
                                      <select
                                        value={slot.startDay || ''}
                                        onChange={(e) => updateShiftSlot(day, index, 'startDay', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                        disabled={loading.save}
                                      >
                                        {daysOfWeek.map((d) => (
                                          <option key={d} value={d}>
                                            {d.charAt(0).toUpperCase() + d.slice(1)}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      displayStartDay.charAt(0).toUpperCase() + displayStartDay.slice(1)
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <input
                                        type="time"
                                        value={slot.startTime || ''}
                                        onChange={(e) => updateShiftSlot(day, index, 'startTime', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={loading.save}
                                      />
                                    ) : (
                                      startTimeFormatted
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <select
                                        value={slot.endDay || ''}
                                        onChange={(e) => updateShiftSlot(day, index, 'endDay', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                        disabled={loading.save}
                                      >
                                        {daysOfWeek.map((d) => (
                                          <option key={d} value={d}>
                                            {d.charAt(0).toUpperCase() + d.slice(1)}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      displayEndDay.charAt(0).toUpperCase() + displayEndDay.slice(1)
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <input
                                        type="time"
                                        value={slot.endTime || ''}
                                        onChange={(e) => updateShiftSlot(day, index, 'endTime', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={loading.save}
                                      />
                                    ) : (
                                      endTimeFormatted
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <select
                                        value={slot.shiftType || 'Day'}
                                        onChange={(e) => updateShiftSlot(day, index, 'shiftType', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                        disabled={loading.save}
                                      >
                                        <option value="Day">Day</option>
                                        <option value="Night">Night</option>
                                      </select>
                                    ) : (
                                      slot.shiftType || 'N/A'
                                    )}
                                  </td>
                                  <td className="p-3">
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        min="1"
                                        value={slot.minEmployees || ''}
                                        onChange={(e) => updateShiftSlot(day, index, 'minEmployees', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                        required
                                        disabled={loading.save}
                                      />
                                    ) : (
                                      slot.minEmployees || 'N/A'
                                    )}
                                  </td>
                                  <td className="p-3 flex gap-2">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={async () => {
                                            const saved = await saveShiftSlot(day, index);
                                            if (saved) setEditingShiftId(null);
                                          }}
                                          className="flex items-center bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition duration-200 disabled:bg-gray-500"
                                          disabled={loading.save}
                                          title="Save changes"
                                        >
                                          <FaSave className="mr-1" /> Save
                                        </button>
                                        <button
                                          onClick={cancelEditingShiftSlot}
                                          className="flex items-center bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg transition duration-200 disabled:bg-gray-500"
                                          disabled={loading.save}
                                          title="Cancel editing"
                                        >
                                          <FaTimes className="mr-1" /> Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => startEditingShiftSlot(day, index)}
                                          className="flex items-center bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg transition duration-200 disabled:bg-gray-500"
                                          disabled={loading.save}
                                          title="Edit slot"
                                        >
                                          <FaEdit className="mr-1" /> Edit
                                        </button>
                                        <button
                                          onClick={() => deleteShiftSlot(day, index)}
                                          className="flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition duration-200 disabled:bg-gray-500"
                                          disabled={loading.save}
                                          title="Delete slot"
                                        >
                                          <FaTrash className="mr-1" /> Delete
                                        </button>
                                      </>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">No shift requirements defined for this day.</p>
                    )}
                    {addingShift === day && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md text-white">
                          <h3 className="text-lg font-semibold text-white mb-4">
                            Add Shift Slot for {day.charAt(0).toUpperCase() + day.slice(1)}
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Start Day</label>
                              <select
                                value={newSlot.startDay}
                                onChange={(e) => updateNewSlot('startDay', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                disabled={loading.save}
                              >
                                {daysOfWeek.map((d) => (
                                  <option key={d} value={d}>
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                              <input
                                type="time"
                                value={newSlot.startTime}
                                onChange={(e) => updateNewSlot('startTime', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loading.save}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">End Day</label>
                              <select
                                value={newSlot.endDay}
                                onChange={(e) => updateNewSlot('endDay', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                disabled={loading.save}
                              >
                                {daysOfWeek.map((d) => (
                                  <option key={d} value={d}>
                                    {d.charAt(0).toUpperCase() + d.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                              <input
                                type="time"
                                value={newSlot.endTime}
                                onChange={(e) => updateNewSlot('endTime', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loading.save}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Shift Type</label>
                              <select
                                value={newSlot.shiftType}
                                onChange={(e) => updateNewSlot('shiftType', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                disabled={loading.save}
                              >
                                <option value="Day">Day</option>
                                <option value="Night">Night</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Min Employees</label>
                              <input
                                type="number"
                                min="1"
                                value={newSlot.minEmployees}
                                onChange={(e) => updateNewSlot('minEmployees', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                                required
                                disabled={loading.save}
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 mt-6">
                            <button
                              onClick={() => addShiftSlot(day)}
                              className="flex-1 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200 disabled:bg-gray-500"
                              disabled={loading.save}
                            >
                              {loading.save ? (
                                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : (
                                <FaSave className="mr-2" />
                              )}
                              Save
                            </button>
                            <button
                              onClick={cancelAddingShiftSlot}
                              className="flex-1 flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition duration-200 disabled:bg-gray-500"
                              disabled={loading.save}
                            >
                              <FaTimes className="mr-2" /> Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-center">
                Please select a department to manage shift requirements.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftRequirements;
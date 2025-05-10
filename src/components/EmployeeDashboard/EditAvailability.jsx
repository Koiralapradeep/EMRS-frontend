import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // Ensure UTC plugin is imported
import { FaPlus, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../Context/authContext';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

dayjs.extend(utc); // Enable UTC plugin

const EditAvailability = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { availabilityId } = useParams();
  console.log('Current URL:', window.location.pathname);
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
  const [fetchAttempts, setFetchAttempts] = useState(0);
  const [hasFetched, setHasFetched] = useState(false);
  const MAX_FETCH_ATTEMPTS = 3;
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  useEffect(() => {
    console.log('User data from useAuth:', user);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error('No token found, redirecting to login');
      navigate('/login');
      return;
    }

    if (user) {
      const id = user._id || user.id;
      console.log('Setting employeeId and companyId:', { id, companyId: user.companyId });
      if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        setError('Invalid user ID format. Please contact support.');
        toast.error('Invalid user ID format.', { duration: 7000 });
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
        toast.error('Account setup incomplete.', { duration: 7000 });
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
              toast.error('Invalid user ID format.', { duration: 7000 });
              return;
            }
            setEmployeeId(id);
            setCompanyId(userData.companyId);
          } else {
            console.error('User data fetch failed, clearing storage');
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigate('/login');
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate('/login');
        }
      };
      fetchUserData();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!availabilityId || !/^[0-9a-fA-F]{24}$/.test(availabilityId)) {
      console.error('Invalid or missing availabilityId:', availabilityId);
      setError('Invalid availability ID.');
      toast.error('Invalid availability ID.', { duration: 7000 });
      return;
    }

    if (!employeeId || !companyId) {
      console.log('Missing required data for fetch:', { employeeId, companyId, availabilityId });
      return;
    }

    const fetchAvailability = async () => {
      setLoading(true);
      setError('');
      setHasFetched(false);
      try {
        console.log(`Fetch attempt ${fetchAttempts + 1} for availability with params:`, { employeeId, companyId, availabilityId });
        const token = localStorage.getItem("token");
        const response = await axios.get(`${API_BASE_URL}/api/availability/${employeeId}`, {
          params: { companyId, availabilityId },
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        console.log('Fetched availability data:', JSON.stringify(response.data, null, 2));

        if (response.status === 200 && response.data && String(response.data._id) === String(availabilityId)) {
          const fetchedDays = response.data.days || {
            sunday: { available: false, slots: [], note: '' },
            monday: { available: false, slots: [], note: '' },
            tuesday: { available: false, slots: [], note: '' },
            wednesday: { available: false, slots: [], note: '' },
            thursday: { available: false, slots: [], note: '' },
            friday: { available: false, slots: [], note: '' },
            saturday: { available: false, slots: [], note: '' },
          };
          Object.keys(fetchedDays).forEach(day => {
            fetchedDays[day] = {
              available: !!fetchedDays[day].available,
              slots: Array.isArray(fetchedDays[day].slots) ? fetchedDays[day].slots.map(slot => ({
                startTime: slot.startTime || '09:00',
                endTime: slot.endTime || '17:00',
                startDay: slot.startDay || day,
                endDay: slot.endDay || day,
                shiftType: slot.shiftType || 'Day',
                preference: slot.preference !== undefined ? parseInt(slot.preference) : 0,
              })) : [],
              note: fetchedDays[day].note || '',
            };
          });
          console.log('Processed days for editing:', JSON.stringify(fetchedDays, null, 2));

          // Normalize to UTC midnight and adjust to the previous Sunday
          let weekStart = dayjs(response.data.weekStartDate).utc().startOf('day');
          console.log('Fetched weekStartDate (UTC midnight):', weekStart.toISOString(), 'Day of week (0=Sunday):', weekStart.day());

          if (weekStart.day() !== 0) {
            const daysSinceLastSunday = weekStart.day(); // e.g., 1 for Monday
            weekStart = weekStart.subtract(daysSinceLastSunday, 'day');
            console.log('Adjusted weekStartDate to previous Sunday:', weekStart.toISOString(), 'Day of week:', weekStart.day());
          }

          // Double-check the adjustment
          if (weekStart.day() !== 0) {
            console.error('Adjustment failed: Adjusted date is still not a Sunday:', weekStart.toISOString(), weekStart.day());
            setError('Failed to adjust week start date to a Sunday. Please select a Sunday manually.');
            toast.error('Failed to adjust week start date to a Sunday.', { duration: 7000 });
            setLoading(false);
            return;
          }

          setWeekStartDate(weekStart);
          setDays(fetchedDays);
          setIsRecurring(!!response.data.isRecurring);
          setOriginalData({
            weekStartDate: response.data.weekStartDate,
            days: fetchedDays,
            isRecurring: response.data.isRecurring,
          });
          setSuccess('Availability data loaded for editing.');
          toast.success('Availability loaded for editing!', { duration: 7000 });
        } else {
          console.log('No matching availability found or ID mismatch:', { fetchedId: response.data?._id, expectedId: availabilityId });
          throw new Error('Availability entry not found for the given ID.');
        }
      } catch (err) {
        console.error('Error fetching availability:', err.response?.data || err.message);
        const errorMessage = err.response?.data?.message || 'Failed to load availability data.';
        setError(errorMessage);
        toast.error(errorMessage, { duration: 7000 });
        if (fetchAttempts < MAX_FETCH_ATTEMPTS - 1) {
          setFetchAttempts(prev => prev + 1);
          console.log('Retrying fetch after 2 seconds...');
          setTimeout(() => fetchAvailability(), 2000);
        } else {
          console.error('Max fetch attempts reached');
          setHasFetched(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [employeeId, companyId, availabilityId, fetchAttempts, navigate]);

  useEffect(() => {
    if (!weekStartDate) return;
    const daysUntilSaturday = (6 - weekStartDate.day() + 7) % 7 || 7;
    const deadline = weekStartDate.add(daysUntilSaturday, 'day').endOf('day');
    setSubmissionDeadline(deadline);
  }, [weekStartDate]);

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
      const token = localStorage.getItem("token");
      console.log('Fetching previous week availability for:', prevWeek, 'employeeId:', employeeId, 'companyId:', companyId);
      const response = await axios.get(`${API_BASE_URL}/api/availability/${employeeId}`, {
        params: { companyId, weekStartDate: prevWeek },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      console.log('API Response for previous week:', response.data);

      if (response.status === 200 && response.data && response.data.days) {
        const defaultDays = {
          sunday: { available: false, slots: [], note: '' },
          monday: { available: false, slots: [], note: '' },
          tuesday: { available: false, slots: [], note: '' },
          wednesday: { available: false, slots: [], note: '' },
          thursday: { available: false, slots: [], note: '' },
          friday: { available: false, slots: [], note: '' },
          saturday: { available: false, slots: [], note: '' },
        };
        const copiedDays = { ...defaultDays, ...response.data.days };
        let hasAvailability = false;

        Object.keys(copiedDays).forEach(day => {
          if (!copiedDays[day].hasOwnProperty('available')) {
            copiedDays[day].available = false;
          }
          if (!copiedDays[day].hasOwnProperty('slots')) {
            copiedDays[day].slots = [];
          }
          if (!copiedDays[day].hasOwnProperty('note')) {
            copiedDays[day].note = '';
          }

          if (copiedDays[day].slots && copiedDays[day].slots.length > 0) {
            copiedDays[day].slots = copiedDays[day].slots.map(slot => ({
              startTime: slot.startTime || '09:00',
              endTime: slot.endTime || '17:00',
              startDay: slot.startDay || day,
              endDay: slot.endDay || day,
              shiftType: slot.shiftType || 'Day',
              preference: slot.preference !== undefined ? parseInt(slot.preference) : 0,
            }));
          }
          if (copiedDays[day].available && copiedDays[day].slots?.length > 0) {
            hasAvailability = true;
          }
        });

        console.log('Processed copied days:', copiedDays);

        if (!hasAvailability) {
          setError('Previous week has no availability to copy.');
          toast.error('Previous week has no availability.', { duration: 7000 });
          return;
        }

        setDays(copiedDays);
        setIsRecurring(response.data.isRecurring || false);
        setSuccess('Successfully copied availability from the previous week.');
        toast.success('Copied previous week’s availability!', { duration: 7000 });
      } else {
        setError('No availability found for the previous week.');
        toast.error('No previous week availability found.', { duration: 7000 });
      }
    } catch (err) {
      console.error('Error copying previous week:', err.response?.data || err.message);
      setError('Failed to copy availability from the previous week.');
      toast.error('Failed to copy previous week availability.', { duration: 7000 });
    }
  };

  const handleWeekChange = (e) => {
    let selectedDate = dayjs(e.target.value).utc().startOf('day');
    console.log('handleWeekChange - Selected date:', selectedDate.toISOString(), 'Day of week:', selectedDate.day());

    if (selectedDate.day() !== 0) {
      const daysSinceLastSunday = selectedDate.day();
      selectedDate = selectedDate.subtract(daysSinceLastSunday, 'day');
      console.log('handleWeekChange - Adjusted to Sunday:', selectedDate.toISOString(), 'Day of week:', selectedDate.day());
    }

    if (selectedDate.isBefore(dayjs().utc().startOf('day'))) {
      setError('Week start date must be in the future.');
      toast.error('Week start must be in the future.', { duration: 7000 });
      return;
    }

    setWeekStartDate(selectedDate);
    const daysUntilSaturday = (6 - selectedDate.day() + 7) % 7 || 7;
    const deadline = selectedDate.add(daysUntilSaturday, 'day').endOf('day');
    setSubmissionDeadline(deadline);
  };

  const toggleDay = (day) => {
    console.log(`Toggling availability for ${day}: Current state -`, JSON.stringify(days[day], null, 2));
    setDays((prev) => {
      const newState = {
        ...prev,
        [day]: {
          ...prev[day],
          available: !prev[day].available,
          slots: !prev[day].available ? [{ startTime: '05:00', endTime: '17:00', startDay: day, endDay: day, shiftType: 'Day', preference: 0 }] : [],
        },
      };
      console.log(`Updated state for ${day}:`, JSON.stringify(newState[day], null, 2));
      console.log('Full days state after toggle:', JSON.stringify(newState, null, 2));
      return newState;
    });
  };

  const addTimeSlot = (day) => {
    console.log(`Adding time slot for ${day}`);
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
      const newState = {
        ...prev,
        [day]: {
          ...prev[day],
          slots: updatedSlots,
        },
      };
      console.log(`Updated slots for ${day}:`, JSON.stringify(newState[day].slots, null, 2));
      return newState;
    });
  };

  const removeTimeSlot = (day, slotIndex) => {
    console.log(`Removing time slot at index ${slotIndex} for ${day}`);
    setDays((prev) => {
      const updatedSlots = prev[day].slots.filter((_, index) => index !== slotIndex);
      if (updatedSlots.length === 0 && prev[day].available) {
        setError(`At least one time slot is required for ${day}.`);
        toast.error(`At least one time slot is required for ${day}.`, { duration: 7000 });
        return prev;
      }
      const newState = {
        ...prev,
        [day]: {
          ...prev[day],
          slots: updatedSlots,
        },
      };
      console.log(`Updated slots for ${day} after removal:`, JSON.stringify(newState[day].slots, null, 2));
      return newState;
    });
    setError('');
  };

  const updateTimeSlot = (day, slotIndex, field, value) => {
    console.log(`Updating time slot for ${day} at index ${slotIndex}: ${field} = ${value}`);
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
      const newState = {
        ...prev,
        [day]: {
          ...prev[day],
          slots: updatedSlots,
        },
      };
      console.log(`Updated slots for ${day} after update:`, JSON.stringify(newState[day].slots, null, 2));
      return newState;
    });
  };

  const updateNote = (day, value) => {
    console.log(`Updating note for ${day}: ${value}`);
    setDays((prev) => {
      const newState = {
        ...prev,
        [day]: {
          ...prev[day],
          note: value,
        },
      };
      console.log(`Updated note for ${day}:`, JSON.stringify(newState[day].note, null, 2));
      return newState;
    });
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

    // Validate weekStartDate before submission
    if (!weekStartDate) {
      setError('Week start date is required.');
      toast.error('Week start date is required.', { duration: 7000 });
      setLoading(false);
      return;
    }

    // Normalize and force adjustment to a Sunday as a fail-safe
    let finalWeekStartDate = dayjs(weekStartDate).utc().startOf('day');
    console.log('handleSubmit - Initial weekStartDate:', finalWeekStartDate.toISOString(), 'Day of week:', finalWeekStartDate.day());

    if (finalWeekStartDate.day() !== 0) {
      const daysSinceLastSunday = finalWeekStartDate.day();
      finalWeekStartDate = finalWeekStartDate.subtract(daysSinceLastSunday, 'day');
      console.log('handleSubmit - Re-adjusted to Sunday:', finalWeekStartDate.toISOString(), 'Day of week:', finalWeekStartDate.day());
    }

    if (finalWeekStartDate.day() !== 0) {
      setError('Week start date must be a Sunday.');
      toast.error('Week start date must be a Sunday.', { duration: 7000 });
      setLoading(false);
      return;
    }

    if (dayjs().utc().isAfter(submissionDeadline)) {
      setError(`Submission deadline has passed (${submissionDeadline.format('MMMM D, YYYY HH:mm')}). Please submit for the next week.`);
      toast.error('Submission deadline passed.', { duration: 7000 });
      setLoading(false);
      return;
    }

    const totalHours = calculateTotalHours();
    console.log('Total hours calculated:', totalHours);
    if (totalHours < 10) {
      toast.warn('Total availability is less than 10 hours. You can still save, but ensure you meet minimum requirements.', { duration: 7000 });
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

    if (!employeeId || !companyId || !finalWeekStartDate) {
      setError('Required user data is missing. Please log in again.');
      toast.error('User data missing. Please log in.', { duration: 7000 });
      setLoading(false);
      return;
    }

    const payload = {
      employeeId,
      companyId,
      weekStartDate: finalWeekStartDate.format('YYYY-MM-DD'), // Send as YYYY-MM-DD
      weekEndDate: finalWeekStartDate.add(6, 'day').format('YYYY-MM-DD'),
      days,
      note: Object.values(days)
        .map(day => day.note)
        .filter(note => note)
        .join('; '),
      isRecurring,
    };

    console.log('Submitting payload:', JSON.stringify(payload, null, 2));
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(`${API_BASE_URL}/api/availability/${availabilityId}`, payload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        withCredentials: true,
      });
      console.log('Update response:', JSON.stringify(response.data, null, 2));
      setSuccess('Availability updated successfully!');
      toast.success('Availability updated!', { duration: 7000 });
      resetForm();
      setTimeout(() => navigate('/employee-dashboard/availability?refresh=true'), 1500);
    } catch (error) {
      const message = error.response?.data?.message || 'Submission failed. Please try again.';
      console.error('Update failed:', error.response?.data || error.message);
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
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <span className="mr-2">📅</span> Edit Availability
      </h2>

      {error && (
        <div className="bg-red-600 text-white p-3 rounded mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button
            onClick={() => navigate('/employee-dashboard/availability')}
            className="ml-4 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
          >
            Go Back
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-600 text-white p-3 rounded mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="text-gray-400 text-center flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2 text-gray-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading availability...
        </div>
      ) : hasFetched && !originalData ? (
        <div className="text-center text-gray-400">
          <p>Failed to load availability data after multiple attempts.</p>
          <button
            onClick={() => navigate('/employee-dashboard/availability')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Return to Availability Dashboard
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-gray-300">
              Total Availability: <span className="font-semibold">{calculateTotalHours().toFixed(2)} hours</span>
              {calculateTotalHours() < 10 && <span className="text-red-400"> (Minimum 10 hours recommended)</span>}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Week Start Date (Must be a Sunday):
            </label>
            <input
              type="date"
              value={weekStartDate ? weekStartDate.format('YYYY-MM-DD') : ''}
              onChange={handleWeekChange}
              min={dayjs().utc().format('YYYY-MM-DD')}
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
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition duration-200"
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
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition duration-200"
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition duration-200 disabled:bg-gray-600"
            >
              {loading ? 'Updating...' : 'Update Availability'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EditAvailability;
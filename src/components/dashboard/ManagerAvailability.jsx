import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../Context/authContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ScheduleCalendar from './ScheduleCalender';

dayjs.extend(utc);

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ManagerAvailability = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [availabilities, setAvailabilities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentsWithAvailabilities, setDepartmentsWithAvailabilities] = useState([]);
  const [shiftRequirements, setShiftRequirements] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = dayjs().utc();
    const daysToNextSunday = (7 - today.day()) % 7 || 7;
    return today.add(daysToNextSunday, 'day');
  });
  const [hasScheduledForWeek, setHasScheduledForWeek] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState({
    availabilities: false,
    analytics: false,
    schedule: false,
    shifts: false,
    departments: false,
    shiftRequirements: false,
  });
  const [isDataReady, setIsDataReady] = useState(false);

  // Search and filter states for employee availabilities
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState('');

  // Manual shift management states
  const [showManualShiftForm, setShowManualShiftForm] = useState(false);
  const [manualShiftData, setManualShiftData] = useState({
    employeeId: '',
    day: '',
    startTime: '',
    endTime: '',
    note: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  // Delete shift function
  const deleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    // Clear previous messages
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');

      console.log('Deleting shift with ID:', shiftId);

      // Find the shift being deleted for success message
      const shiftToDelete = shifts.find(shift => shift._id === shiftId);
      const employeeName = shiftToDelete?.employeeId?.name || 'Employee';
      const shiftDay = shiftToDelete?.day || 'day';
      const shiftTime = shiftToDelete ? `${shiftToDelete.startTime}-${shiftToDelete.endTime}` : 'time';

      const response = await axios.delete(`${API_BASE_URL}/api/availability/shift-schedule/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      console.log('Delete response:', response.data);
      
      const successMessage = `Shift deleted successfully! ${employeeName}'s ${shiftDay} shift (${shiftTime}) has been removed. Space is now available for manual scheduling.`;
      setSuccess(successMessage);
      setError('');
      toast.success('Shift deleted successfully!');
      
      // Update local state immediately for better UX
      setShifts(prevShifts => prevShifts.filter(shift => shift._id !== shiftId));
      
      // Check if we still have shifts after deletion
      const remainingShifts = shifts.filter(shift => shift._id !== shiftId);
      setHasScheduledForWeek(remainingShifts.length > 0);
      
      // Also refresh from server to ensure consistency
      fetchShifts();
    } catch (err) {
      console.error('Error deleting shift:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete shift.';
      setError(errorMessage);
      setSuccess('');
      toast.error('Failed to delete shift');
    }
  };

  // Manual shift creation
  const createManualShift = async () => {
  if (!manualShiftData.employeeId || !manualShiftData.day || !manualShiftData.startTime || !manualShiftData.endTime) {
    setError('Please fill in all required fields');
    setSuccess('');
    toast.error('Please fill in all required fields');
    return;
  }

  if (!selectedDepartment) {
    setError('Please select a department first before creating manual shifts');
    setSuccess('');
    toast.error('Please select a department first');
    return;
  }

  // Clear previous messages
  setError('');
  setSuccess('');

  // Check if employee already has a shift at this time
  const employeeExistingShifts = shifts.filter(shift => 
    shift.employeeId?._id === manualShiftData.employeeId && 
    shift.day === manualShiftData.day
  );

  if (employeeExistingShifts.length > 0) {
    const conflictingShift = employeeExistingShifts.find(shift => {
      const existingStart = shift.startTime;
      const existingEnd = shift.endTime;
      const newStart = manualShiftData.startTime;
      const newEnd = manualShiftData.endTime;
      
      // Check for time overlap
      return (newStart < existingEnd && newEnd > existingStart);
    });
    
    if (conflictingShift) {
      const errorMessage = `Employee already has a shift on ${manualShiftData.day} from ${conflictingShift.startTime} to ${conflictingShift.endTime}. Please delete the existing shift first or choose a different time.`;
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found.');

    // Calculate duration hours using proper time parsing
    const [startHours, startMinutes] = manualShiftData.startTime.split(':').map(Number);
    const [endHours, endMinutes] = manualShiftData.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;
    
    // Handle overnight shifts
    if (endTotalMinutes <= startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Add 24 hours
    }
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    const durationHours = durationMinutes / 60;
    
    // Validate that we have valid values
    if (!durationHours || durationHours <= 0) {
      setError('Invalid shift duration. Please check start and end times.');
      setSuccess('');
      return;
    }
    
    if (!user.companyId) {
      setError('Company ID is missing from user data.');
      setSuccess('');
      return;
    }
    
    // Create payload matching the backend expectation AND the schema
    const payload = {
      employeeId: manualShiftData.employeeId,
      companyId: user.companyId, // Include companyId in the body
      departmentId: selectedDepartment,
      weekStartDate: weekStartDate.format('YYYY-MM-DD'),
      day: manualShiftData.day,
      startTime: manualShiftData.startTime,
      endTime: manualShiftData.endTime,
      durationHours: Number(durationHours.toFixed(2)), // Include durationHours
      note: manualShiftData.note || 'Manual shift'
    };
    
    console.log('Creating manual shift with payload:', payload);

    // Use the correct endpoint for manual shift creation
    const response = await axios.post(`${API_BASE_URL}/api/availability/schedule/${user.companyId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true,
    });

    console.log('Manual shift creation response:', response.data);
    
    const selectedEmployee = availableEmployees.find(emp => emp._id === manualShiftData.employeeId);
    const successMessage = `Manual shift created successfully! Employee ${selectedEmployee?.name || 'Unknown'} has been assigned to ${manualShiftData.day} from ${manualShiftData.startTime} to ${manualShiftData.endTime}.`;
    
    setSuccess(successMessage);
    setError('');
    toast.success('Manual shift created successfully!');
    
    setShowManualShiftForm(false);
    setManualShiftData({
      employeeId: '',
      day: '',
      startTime: '',
      endTime: '',
      note: ''
    });
    
    // Refresh shifts to show the new one
    fetchShifts();
  } catch (err) {
    console.error('Error creating manual shift:', err);
    
    let errorMessage = 'Failed to create manual shift.';
    
    if (err.response) {
      console.log('Backend returned error:', err.response.status, err.response.data);
      
      if (err.response.status === 400) {
        errorMessage = err.response.data?.message || 'Invalid request data. Please check all fields.';
      } else if (err.response.status === 409) {
        errorMessage = 'Shift conflict detected. There is no available space for this time slot. Please delete an existing shift first or choose a different time.';
      } else if (err.response.status === 500) {
        errorMessage = err.response.data?.message || 'Server error occurred while creating shift.';
      } else {
        errorMessage = err.response.data?.message || `Server returned error: ${err.response.status}`;
      }
    } else if (err.request) {
      errorMessage = 'No response from server. Please check your connection.';
    } else {
      errorMessage = `Request error: ${err.message}`;
    }
    
    setError(errorMessage);
    setSuccess('');
    toast.error('Failed to create manual shift');
  }
};
  const fetchDepartments = useCallback(async () => {
    setIsLoadingData((prev) => ({ ...prev, departments: true }));
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      if (!user?.companyId) throw new Error('Company ID is missing from user data.');

      const response = await axios.get(`${API_BASE_URL}/api/departments/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
        timeout: 10000,
      });

      const deptData = response.data || [];
      if (!Array.isArray(deptData)) throw new Error('Invalid departments data format. Expected an array.');

      setDepartments(deptData);
      if (deptData.length > 0 && !selectedDepartment) {
        console.log('Setting default department to "All Departments"');
        setSelectedDepartment('');
      } else if (deptData.length === 0) {
        setSelectedDepartment('');
        toast('No departments found for your company. Please add a department.', { duration: 4000 });
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch departments.';
      setError(message);
      toast.error(message);
      setDepartments([]);
      setSelectedDepartment('');
    } finally {
      setIsLoadingData((prev) => ({ ...prev, departments: false }));
    }
  }, [user?.companyId]);

  const fetchDepartmentsWithAvailabilities = useCallback(async () => {
    if (!user?.companyId) {
      setError('Company ID is missing.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const utcWeekStartDate = weekStartDate.startOf('day').utc().format('YYYY-MM-DD');
      const response = await axios.get(`${API_BASE_URL}/api/availability/company/${user.companyId}`, {
        params: {
          weekStartDate: utcWeekStartDate,
          page: 1,
          limit: 100,
        },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const availabilitiesData = response.data.data || [];
      const departmentIdsWithAvailabilities = [...new Set(
        availabilitiesData
          .filter(avail => avail.employeeId && avail.employeeId.departmentId)
          .map(avail => avail.employeeId.departmentId?.toString())
          .filter(deptId => deptId)
      )];
      console.log('Departments with availabilities for week', utcWeekStartDate, ':', departmentIdsWithAvailabilities);
      setDepartmentsWithAvailabilities(departmentIdsWithAvailabilities);
    } catch (err) {
      console.error('Error fetching departments with availabilities:', err);
      setDepartmentsWithAvailabilities([]);
    }
  }, [user?.companyId, weekStartDate]);

  const fetchShiftRequirements = useCallback(async () => {
    if (!user?.companyId) {
      setError('Company ID is missing.');
      return;
    }

    setIsLoadingData((prev) => ({ ...prev, shiftRequirements: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const params = selectedDepartment ? { departmentId: selectedDepartment } : {};
      const response = await axios.get(`${API_BASE_URL}/api/availability/shift-requirements/${user.companyId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const requirements = response.data || [];
      console.log('Shift requirements fetched for department', selectedDepartment, ':', requirements);
      setShiftRequirements(requirements);
    } catch (err) {
      console.error('Error fetching shift requirements:', err);
      setShiftRequirements([]);
      toast.error('Failed to fetch shift requirements. Please try again.');
    } finally {
      setIsLoadingData((prev) => ({ ...prev, shiftRequirements: false }));
    }
  }, [user?.companyId, selectedDepartment]);

  const fetchAvailabilities = useCallback(async () => {
    if (!user?.companyId) {
      setError('Company ID is missing.');
      return;
    }

    setIsLoadingData((prev) => ({ ...prev, availabilities: true }));
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const utcWeekStartDate = weekStartDate.startOf('day').utc().format('YYYY-MM-DD');
      const params = {
        weekStartDate: utcWeekStartDate,
        page,
        limit: 50, // Increased limit for better search/filter experience
        ...(selectedDepartment && { departmentId: selectedDepartment }),
      };
      const response = await axios.get(`${API_BASE_URL}/api/availability/company/${user.companyId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      let fetchedAvailabilities = response.data.data || [];

      if (selectedDepartment) {
        fetchedAvailabilities = fetchedAvailabilities.filter((avail) => {
          const matchesDepartment = avail.employeeId?.departmentId?.toString() === selectedDepartment;
          if (!avail.employeeId?.departmentId) {
            console.warn(`Availability ${avail._id} for employee ${avail.employeeId?.name} has no departmentId`);
          }
          return matchesDepartment;
        });
      }

      console.log('Fetched availabilities for week', utcWeekStartDate, ':', fetchedAvailabilities);
      setAvailabilities(fetchedAvailabilities);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch availabilities.';
      setError(message);
      toast.error(message);
      setAvailabilities([]);
    } finally {
      setIsLoadingData((prev) => ({ ...prev, availabilities: false }));
    }
  }, [user?.companyId, weekStartDate, page, selectedDepartment]);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.companyId) {
      setError('Company ID is missing.');
      return;
    }

    setIsLoadingData((prev) => ({ ...prev, analytics: true }));
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const utcWeekStartDate = weekStartDate.startOf('day').utc().format('YYYY-MM-DD');
      const params = {
        weekStartDate: utcWeekStartDate,
        ...(selectedDepartment && { departmentId: selectedDepartment }),
      };
      const response = await axios.get(`${API_BASE_URL}/api/availability/analytics/${user.companyId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      let analyticsData = response.data || {
        totalEmployees: 0,
        totalHours: 0,
        days: {
          sunday: { employees: 0, hours: 0 },
          monday: { employees: 0, hours: 0 },
          tuesday: { employees: 0, hours: 0 },
          wednesday: { employees: 0, hours: 0 },
          thursday: { employees: 0, hours: 0 },
          friday: { employees: 0, hours: 0 },
          saturday: { employees: 0, hours: 0 },
        },
      };
      setAnalytics(analyticsData);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch analytics.';
      setError(message);
      toast.error(message);
      setAnalytics({
        totalEmployees: 0,
        totalHours: 0,
        days: {
          sunday: { employees: 0, hours: 0 },
          monday: { employees: 0, hours: 0 },
          tuesday: { employees: 0, hours: 0 },
          wednesday: { employees: 0, hours: 0 },
          thursday: { employees: 0, hours: 0 },
          friday: { employees: 0, hours: 0 },
          saturday: { employees: 0, hours: 0 },
        },
      });
    } finally {
      setIsLoadingData((prev) => ({ ...prev, analytics: false }));
    }
  }, [user?.companyId, weekStartDate, selectedDepartment]);

  const fetchShifts = useCallback(async () => {
    if (!user?.companyId) {
      setError('Company ID is missing.');
      return;
    }

    setIsLoadingData((prev) => ({ ...prev, shifts: true }));
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const utcWeekStartDate = weekStartDate.startOf('day').utc().format('YYYY-MM-DD');
      const utcWeekEndDate = weekStartDate.add(6, 'day').startOf('day').utc().format('YYYY-MM-DD');
      const params = {
        startDate: utcWeekStartDate,
        endDate: utcWeekEndDate,
        ...(selectedDepartment && { departmentId: selectedDepartment }),
      };
      console.log('Fetching shifts with params:', params);
      const response = await axios.get(`${API_BASE_URL}/api/availability/schedule/${user.companyId}`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      let fetchedShifts = response.data || [];

      fetchedShifts = fetchedShifts.filter(shift => {
        const shiftDeptId = shift.departmentId ? shift.departmentId.toString() : null;
        const shiftWeekStart = dayjs(shift.weekStartDate).format('YYYY-MM-DD');
        const isSameWeek = shiftWeekStart === utcWeekStartDate;
        const isSameDepartment = selectedDepartment ? shiftDeptId === selectedDepartment : true;
        if (!isSameWeek || !isSameDepartment) {
          console.log(`Filtering out shift for employee ${shift.employeeId?.email}: Week ${shiftWeekStart} (Expected ${utcWeekStartDate}), Department ${shiftDeptId} (Expected ${selectedDepartment})`);
        }
        return isSameWeek && isSameDepartment;
      });

      console.log('Filtered shifts:', JSON.stringify(fetchedShifts, null, 2));
      setShifts(fetchedShifts);
      const hasScheduled = fetchedShifts.length > 0;
      setHasScheduledForWeek(hasScheduled);
      console.log('Shifts fetched for week', utcWeekStartDate, ':', fetchedShifts);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch shifts.';
      setError(message);
      toast.error(message);
      setShifts([]);
      setHasScheduledForWeek(false);
    } finally {
      setIsLoadingData((prev) => ({ ...prev, shifts: false }));
    }
  }, [user?.companyId, weekStartDate, selectedDepartment]);

  useEffect(() => {
    if (!user) {
      setIsLoadingUser(true);
      return;
    }
    setIsLoadingUser(false);

    if (user.role.toLowerCase() !== 'manager') {
      toast.error('Unauthorized access. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    fetchDepartments();
  }, [user, navigate, fetchDepartments]);

  useEffect(() => {
    if (!user || !user.companyId) return;

    const today = dayjs().utc();
    const currentWeekStart = today.subtract(today.day(), 'day'); // Sunday of the current week
    const initialWeekStart = today.add((7 - today.day()) % 7 || 7, 'day'); // Next Sunday
    if (!weekStartDate.isSame(initialWeekStart, 'day') && weekStartDate.isBefore(currentWeekStart, 'day')) {
      setWeekStartDate(initialWeekStart);
      console.log('Updated weekStartDate to next Sunday:', initialWeekStart.format('YYYY-MM-DD'));
    }

    const fetchAllData = async () => {
      setIsDataReady(false);
      await Promise.all([
        fetchAvailabilities(),
        fetchAnalytics(),
        fetchShifts(),
        fetchDepartmentsWithAvailabilities(),
        fetchShiftRequirements(),
      ]);
      setIsDataReady(true);
    };

    fetchAllData();

    return () => {
      setError('');
      setSuccess('');
    };
  }, [fetchAvailabilities, fetchAnalytics, fetchShifts, fetchDepartmentsWithAvailabilities, fetchShiftRequirements, weekStartDate]);

  const handleDepartmentChange = (e) => {
    const newDepartment = e.target.value;
    setSelectedDepartment(newDepartment);
    setPage(1);
    console.log('Selected department changed to:', newDepartment);
  };

  const handleWeekStartDateChange = (dateValue) => {
    const selectedDate = dayjs(dateValue).utc();
    if (!selectedDate.isValid()) {
      toast.error('Please select a valid date.');
      return;
    }

    if (selectedDate.day() !== 0) {
      toast.error('Selected date must be a Sunday.');
      return;
    }

    const today = dayjs().utc();
    const currentWeekStart = today.subtract(today.day(), 'day'); // Sunday of the current week
    if (selectedDate.isBefore(currentWeekStart, 'day')) {
      toast.error('Cannot select a week before the current week.');
      return;
    }

    setWeekStartDate(selectedDate);
    setPage(1);
    toast(`Selected Sunday: ${selectedDate.format('YYYY-MM-DD')}`, { duration: 4000 });
  };

  const handlePreviousWeek = () => {
    const previousSunday = weekStartDate.subtract(7, 'day');
    const today = dayjs().utc();
    const currentWeekStart = today.subtract(today.day(), 'day'); // Sunday of the current week
    if (previousSunday.isBefore(currentWeekStart, 'day')) {
      toast.error('Cannot select a week before the current week.');
      return;
    }
    setWeekStartDate(previousSunday);
    setPage(1);
    toast(`Selected Sunday: ${previousSunday.format('YYYY-MM-DD')}`, { duration: 4000 });
  };

  const handleNextWeek = () => {
    const nextSunday = weekStartDate.add(7, 'day');
    setWeekStartDate(nextSunday);
    setPage(1);
    toast(`Selected Sunday: ${nextSunday.format('YYYY-MM-DD')}`, { duration: 4000 });
  };

  const generateSchedule = async () => {
    if (!user?.companyId) {
      setError('Company ID is missing.');
      return;
    }

    if (!isDataReady) {
      setError('Please wait until all data is loaded before generating the schedule.');
      toast.error('Please wait until all data is loaded.');
      return;
    }

    if (!selectedDepartment) {
      setError('Please select a department to generate the schedule.');
      toast.error('Please select a department.');
      return;
    }

    if (!departmentsWithAvailabilities.includes(selectedDepartment)) {
      setError('No availabilities found for the selected department. Please ensure employees have submitted their availability.');
      toast.error('No availabilities found for the selected department.');
      return;
    }

    if (!shiftRequirements.some(req => req.departmentId === selectedDepartment)) {
      setError('No shift requirements defined for the selected department. Please define shift requirements in "Manage Shift Requirements".');
      toast.error('No shift requirements defined for the selected department.');
      return;
    }

    if (hasScheduledForWeek) {
      setError('A schedule has already been generated for this week. You can only schedule once per week.');
      toast.error('A schedule has already been generated for this week.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoadingData((prev) => ({ ...prev, schedule: true }));
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');

      const utcWeekStartDate = weekStartDate.startOf('day').utc().format('YYYY-MM-DD');
      const utcWeekEndDate = weekStartDate.add(6, 'day').startOf('day').utc().format('YYYY-MM-DD');
      const payload = {
        startDate: utcWeekStartDate,
        endDate: utcWeekEndDate,
        departmentId: selectedDepartment,
      };
      console.log('Generating schedule with payload:', payload);

      const response = await axios.post(
        `${API_BASE_URL}/api/availability/auto-schedule/${user.companyId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setSuccess('Shift schedule generated successfully! Fairness metrics: ' + JSON.stringify(response.data.fairnessMetricsByDept));
      toast.success('Shift schedule generated successfully!');
      setHasScheduledForWeek(true);
      fetchShifts();
    } catch (err) {
      let message = err.response?.data?.message || 'Failed to generate schedule.';
      if (err.response?.data?.conflicts) {
        const conflictDetails = err.response.data.conflicts.map(conflict => (
          `Department: ${conflict.departmentName}, Day: ${conflict.day}, Time: ${conflict.startTime}-${conflict.endTime}, ` +
          `Required: ${conflict.required}, Assigned: ${conflict.assigned}, ` +
          `Available: ${conflict.availableEmployees?.length ? conflict.availableEmployees.map(emp => `${emp.name} (${emp.availableTime})`).join(', ') : 'None'}`
        )).join('; ');
        message += ` Conflicts: ${conflictDetails}. Ensure employees are assigned to the correct department.`;
      }
      setError(message);
      toast.error(message, { duration: 8000 });
    } finally {
      setIsLoadingData((prev) => ({ ...prev, schedule: false }));
    }
  };

  // Callback functions for ScheduleCalendar
  const handleDeleteShift = useCallback((shiftId) => {
    setShifts((prev) => prev.filter((shift) => shift._id !== shiftId));
    const remainingShifts = shifts.filter((shift) => shift._id !== shiftId);
    setHasScheduledForWeek(remainingShifts.length > 0);
  }, [shifts]);

  const handleUpdateShift = useCallback((shiftId, updatedShift) => {
    setShifts((prev) =>
      prev.map((shift) => (shift._id === shiftId ? { ...shift, ...updatedShift } : shift))
    );
  }, []);

  const renderAvailability = (days) => {
    if (!days || Object.keys(days).length === 0) {
      return <p className="text-gray-400">No availability data available.</p>;
    }
    return Object.entries(days)
      .filter(([_, day]) => day.available)
      .map(([day, { slots, note }]) => (
        <div key={day} className="mb-2">
          <strong className="text-teal-400">{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>{' '}
          {slots.length ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {slots.map((slot, i) => (
                <span key={i} className="bg-teal-600 text-white px-2 py-1 rounded text-xs">
                  {slot.startTime}–{slot.endTime} (Pref: {slot.preference})
                </span>
              ))}
            </div>
          ) : (
            <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">All day</span>
          )}
          {note && <p className="text-sm text-gray-400 mt-1">Note: {note}</p>}
        </div>
      ));
  };

  // Filter availabilities based on search and filters
  const filteredAvailabilities = useMemo(() => {
    return availabilities.filter(avail => {
      const matchesSearch = !searchTerm || 
        avail.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avail.employeeId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDay = !filterDay || (avail.days && avail.days[filterDay] && avail.days[filterDay].available);
      
      return matchesSearch && matchesDay;
    });
  }, [availabilities, searchTerm, filterDay]);

  // Get available employees for manual shift assignment
  const availableEmployees = useMemo(() => {
    if (!manualShiftData.day || !selectedDepartment) return [];
    
    return availabilities.filter(avail => {
      // Check if employee is in the selected department
      const isInDepartment = avail.employeeId?.departmentId?.toString() === selectedDepartment;
      
      // Check if employee is available on the selected day
      const dayAvail = avail.days?.[manualShiftData.day];
      const isAvailableOnDay = dayAvail && dayAvail.available;
      
      // Check if employee already has a shift on this day
      const hasExistingShift = shifts.some(shift => 
        shift.employeeId?._id === avail.employeeId?._id && 
        shift.day === manualShiftData.day
      );
      
      console.log(`Employee ${avail.employeeId?.name}:`, {
        isInDepartment,
        isAvailableOnDay,
        hasExistingShift,
        shouldShow: isInDepartment && isAvailableOnDay && !hasExistingShift
      });
      
      return isInDepartment && isAvailableOnDay && !hasExistingShift;
    }).map(avail => avail.employeeId);
  }, [availabilities, manualShiftData.day, selectedDepartment, shifts]);

  const employeesWithShifts = useMemo(() => {
    return shifts.reduce((acc, shift) => {
      const employeeId = shift.employeeId?._id;
      if (!employeeId) return acc;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: shift.employeeId,
          shiftsByDay: {
            sunday: [],
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
          },
        };
      }
      acc[employeeId].shiftsByDay[shift.day].push(shift);
      return acc;
    }, {});
  }, [shifts]);

  const chartData = useMemo(() => {
    return {
      labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      datasets: [
        {
          label: 'Employees Available',
          data: analytics ? Object.values(analytics.days).map((d) => d.employees) : [],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
        },
        {
          label: 'Total Hours',
          data: analytics ? Object.values(analytics.days).map((d) => d.hours) : [],
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };
  }, [analytics]);

  if (isLoadingUser) {
    return (
      <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-6xl mx-auto">
        <LoadingSpinner />
        <p className="text-gray-400 mt-2">Loading user data...</p>
      </div>
    );
  }

  const canGenerateSchedule = selectedDepartment && departmentsWithAvailabilities.includes(selectedDepartment) && shiftRequirements.some(req => req.departmentId === selectedDepartment) && !hasScheduledForWeek && isDataReady;
  console.log('Can generate schedule:', canGenerateSchedule, {
    selectedDepartment,
    departmentsWithAvailabilities,
    hasShiftRequirements: shiftRequirements.some(req => req.departmentId === selectedDepartment),
    hasScheduledForWeek,
    isDataReady,
  });

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Manager Availability Dashboard</h2>

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

      <div className="mb-4 flex justify-between">
        <Link
          to="/manager-dashboard/shift-requirements"
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded font-semibold transition"
        >
          Manage Shift Requirements
        </Link>
        <button
          onClick={() => setShowManualShiftForm(!showManualShiftForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold transition"
        >
          {showManualShiftForm ? 'Cancel Manual Shift' : 'Add Manual Shift'}
        </button>
      </div>

        {/* Manual Shift Form */}
      {showManualShiftForm && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Add Manual Shift</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Day:</label>
              <select
                value={manualShiftData.day}
                onChange={(e) => setManualShiftData(prev => ({ ...prev, day: e.target.value }))}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Day</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Start Time:</label>
              <input
                type="time"
                value={manualShiftData.startTime}
                onChange={(e) => setManualShiftData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">End Time:</label>
              <input
                type="time"
                value={manualShiftData.endTime}
                onChange={(e) => setManualShiftData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Available Employee:</label>
              <select
                value={manualShiftData.employeeId}
                onChange={(e) => setManualShiftData(prev => ({ ...prev, employeeId: e.target.value }))}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
                disabled={!manualShiftData.day || !selectedDepartment}
              >
                <option value="">
                  {!selectedDepartment 
                    ? "Select department first"
                    : !manualShiftData.day 
                      ? "Select day first" 
                      : availableEmployees.length === 0 
                        ? "No employees available" 
                        : "Select Available Employee"
                  }
                </option>
                {availableEmployees.map(emp => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
              {selectedDepartment && manualShiftData.day && availableEmployees.length === 0 && (
                <p className="text-yellow-400 text-xs mt-1">
                  No employees available for {manualShiftData.day} in the selected department without existing shifts
                </p>
              )}
              {!selectedDepartment && (
                <p className="text-red-400 text-xs mt-1">
                  Please select a department first
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Note (Optional):</label>
            <textarea
              value={manualShiftData.note}
              onChange={(e) => setManualShiftData(prev => ({ ...prev, note: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Add any notes about this shift..."
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={createManualShift}
              disabled={!manualShiftData.employeeId || availableEmployees.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold transition disabled:bg-gray-600 disabled:cursor-not-allowed"
              title={
                !manualShiftData.employeeId || availableEmployees.length === 0
                  ? "Select an available employee to create shift"
                  : "Create shift"
              }
            >
              Create Shift
            </button>
            <button
              onClick={() => setShowManualShiftForm(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-semibold transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Select Department:</label>
          {isLoadingData.departments ? (
            <LoadingSpinner />
          ) : (
            <select
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a Department</option>
              {departments.length === 0 ? (
                <option value="" disabled>
                  No departments found. Please add a department.
                </option>
              ) : (
                departments.map((dept) => (
                  <option
                    key={dept._id}
                    value={dept._id}
                    className={departmentsWithAvailabilities.includes(dept._id) ? '' : 'text-yellow-400'}
                    title={departmentsWithAvailabilities.includes(dept._id) ? '' : 'No availabilities submitted for this department'}
                  >
                    {dept.departmentName}
                    {!departmentsWithAvailabilities.includes(dept._id) && ' (No Availabilities)'}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Week Start Date (Sunday):
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousWeek}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
            >
              Previous Week
            </button>
            <input
              type="date"
              value={weekStartDate.format('YYYY-MM-DD')}
              onChange={(e) => handleWeekStartDateChange(e.target.value)}
              className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleNextWeek}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
            >
              Next Week
            </button>
          </div>
        </div>
        <button
          onClick={generateSchedule}
          disabled={isLoadingData.schedule || !canGenerateSchedule}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded font-semibold transition disabled:bg-gray-600"
          title={
            !canGenerateSchedule
              ? 'To generate a schedule, ensure: 1. A department is selected. 2. The department has availabilities. 3. Shift requirements are defined. 4. No schedule exists for this week. 5. All data is loaded.'
              : 'Click to generate the schedule.'
          }
        >
          {isLoadingData.schedule ? 'Generating...' : 'Generate Schedule'}
        </button>
      </div>

      {isLoadingData.analytics ? (
        <LoadingSpinner />
      ) : analytics ? (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Availability Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-teal-400 font-semibold">Total Employees: {analytics.totalEmployees}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="text-green-400 font-semibold">Total Hours: {analytics.totalHours.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4">
            {chartData.datasets[0].data.some((d) => d > 0) || chartData.datasets[1].data.some((d) => d > 0) ? (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Weekly Availability' },
                  },
                }}
              />
            ) : (
              <p className="text-gray-400">No analytics data available.</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-400">No analytics data available.</p>
      )}

      <ScheduleCalendar
        weekStartDate={weekStartDate}
        setWeekStartDate={setWeekStartDate}
        adjustToSunday={() => weekStartDate}
        shifts={shifts}
        onDeleteShift={handleDeleteShift}
        onUpdateShift={handleUpdateShift}
        onRefreshShifts={fetchShifts}
      />

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Shift Schedule Overview</h3>
        {isLoadingData.shifts ? (
          <LoadingSpinner />
        ) : Object.keys(employeesWithShifts).length === 0 ? (
          <p className="text-gray-400">No shifts assigned for this week.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm bg-gray-800 rounded-lg">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-3 font-semibold">Employee</th>
                  {daysOfWeek.map((day) => (
                    <th key={day} className="p-3 font-semibold">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </th>
                  ))}
                  <th className="p-3 font-semibold">Total Hours</th>
                  <th className="p-3 font-semibold">Shift Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(employeesWithShifts).map(({ employee, shiftsByDay }) => {
                  const totalHours = daysOfWeek.reduce((sum, day) => {
                    const dayShifts = shiftsByDay[day];
                    const shiftContributions = dayShifts.map(shift => {
                      const duration = shift.durationHours != null ? shift.durationHours : (() => {
                        const shiftDate = weekStartDate.add(daysOfWeek.indexOf(day), 'day').format('YYYY-MM-DD');
                        let endDateTime = dayjs(`${shiftDate} ${shift.endTime}`);
                        const startDateTime = dayjs(`${shiftDate} ${shift.startTime}`);
                        if (endDateTime.isBefore(startDateTime)) {
                          endDateTime = endDateTime.add(1, 'day');
                        }
                        return endDateTime.diff(startDateTime, 'hour', true);
                      })();
                      return duration;
                    });
                    const daySum = shiftContributions.reduce((acc, duration) => acc + duration, 0);
                    return sum + daySum;
                  }, 0);
                  return (
                    <tr key={employee._id} className="border-b border-gray-700 hover:bg-gray-750">
                      <td className="p-3">
                        <div>
                          <div className="font-semibold text-white">{employee.name}</div>
                          <div className="text-gray-400 text-xs">{employee.email}</div>
                          <div className="text-teal-400 text-xs">{employee.role}</div>
                        </div>
                      </td>
                      {daysOfWeek.map((day) => (
                        <td key={day} className="p-3">
                          <div className="space-y-1">
                            {shiftsByDay[day].map((shift) => (
                              <div key={shift._id} className="flex items-center gap-2">
                                <span className="bg-teal-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                                  {shift.startTime}–{shift.endTime}
                                </span>
                                <button
                                  onClick={() => deleteShift(shift._id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition"
                                  title="Delete this shift"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>
                      ))}
                      <td className="p-3">
                        <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-semibold">
                          {totalHours.toFixed(2)}h
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-gray-400 text-xs">
                          {Object.values(shiftsByDay).flat().length} shifts
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Employee Availabilities</h3>
          <div className="text-sm text-gray-400">
            {filteredAvailabilities.length} of {availabilities.length} employees
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="bg-gray-800 p-4 rounded-lg mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Employee:</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Day:</label>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Days</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day.charAt(0).toUpperCase() + day.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDay('');
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {isLoadingData.availabilities ? (
          <LoadingSpinner />
        ) : filteredAvailabilities.length === 0 ? (
          <div className="text-center py-8">
            {availabilities.length === 0 ? (
              <p className="text-gray-400">
                No availabilities found for the week of {weekStartDate.format('MM/DD/YYYY')}
                {selectedDepartment
                  ? ` in ${departments.find((dept) => dept._id === selectedDepartment)?.departmentName || 'the selected department'}`
                  : ''}.
                Employees can submit their availability for this week, or try selecting a different week or department.
              </p>
            ) : (
              <p className="text-gray-400">
                No employees match the current search and filter criteria.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAvailabilities.map((avail) => (
              <div key={avail._id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-md font-semibold text-white">
                      {avail.employeeId?.name || 'Unknown'}
                    </h4>
                    <p className="text-sm text-gray-400">{avail.employeeId?.email || 'N/A'}</p>
                    <span className="inline-block bg-blue-600 text-white px-2 py-1 rounded text-xs mt-1">
                      {avail.employeeId?.role || 'N/A'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Department</div>
                    <div className="text-sm text-teal-400">
                      {departments.find(dept => dept._id === avail.employeeId?.departmentId)?.departmentName || 'N/A'}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-700 pt-3">
                  {renderAvailability(avail.days)}
                </div>
                
                {avail.note && (
                  <div className="bg-gray-700 p-2 rounded mt-3">
                    <p className="text-sm text-gray-300">
                      <span className="font-semibold">General Note:</span> {avail.note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mb-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:bg-gray-800 transition"
        >
          Previous
        </button>
        <span className="flex items-center">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:bg-gray-800 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ManagerAvailability;
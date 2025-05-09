import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Bar } from 'react-chartjs-2';
import { useAuth } from '../../Context/authContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Modal from 'react-modal';
import { FaTimes } from 'react-icons/fa';
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

const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#1f2937',
    color: 'white',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '600px',
    width: '90%',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.75)' },
};

Modal.setAppElement('#root');

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
  const [editingShift, setEditingShift] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

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
        limit: 10,
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

  const handleEditShift = (shift) => {
    setEditingShift(shift);
    setModalIsOpen(true);
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      await axios.delete(`${API_BASE_URL}/api/availability/shift-schedule/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setShifts((prev) => prev.filter((shift) => shift._id !== shiftId));
      toast.success('Shift deleted successfully!');
      const remainingShifts = shifts.filter((shift) => shift._id !== shiftId);
      setHasScheduledForWeek(remainingShifts.length > 0);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete shift.';
      toast.error(message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');
      const response = await axios.put(
        `${API_BASE_URL}/api/availability/shift-schedule/${editingShift._id}`,
        { startTime, endTime },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      setShifts((prev) =>
        prev.map((shift) => (shift._id === editingShift._id ? response.data.data : shift))
      );
      toast.success('Shift updated successfully!');
      setModalIsOpen(false);
      setEditingShift(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update shift.';
      toast.error(message);
    }
  };

  const renderAvailability = (days) => {
    if (!days || Object.keys(days).length === 0) {
      return <p className="text-gray-400">No availability data available.</p>;
    }
    return Object.entries(days)
      .filter(([_, day]) => day.available)
      .map(([day, { slots, note }]) => (
        <div key={day} className="mb-2">
          <strong>{day.charAt(0).toUpperCase() + day.slice(1)}:</strong>{' '}
          {slots.length ? (
            slots.map((slot, i) => (
              <span key={i}>
                {slot.startTime}–{slot.endTime} (Pref: {slot.preference}){' '}
              </span>
            ))
          ) : (
            'All day'
          )}
          {note && <p className="text-sm text-gray-400">Note: {note}</p>}
        </div>
      ));
  };

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
      </div>

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
          <p>Total Employees: {analytics.totalEmployees}</p>
          <p>Total Hours: {analytics.totalHours.toFixed(2)}</p>
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
        onEditShift={handleEditShift}
        onDeleteShift={handleDeleteShift}
      />

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Shift Schedule Overview</h3>
        {isLoadingData.shifts ? (
          <LoadingSpinner />
        ) : Object.keys(employeesWithShifts).length === 0 ? (
          <p className="text-gray-400">No shifts assigned for this week.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-700">
                  <th className="p-2">Employee</th>
                  {daysOfWeek.map((day) => (
                    <th key={day} className="p-2">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </th>
                  ))}
                  <th className="p-2">Total Hours</th>
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
                      console.log(`Shift for ${employee.email} on ${day}: ${shift.startTime}-${shift.endTime}, Duration: ${duration} hours, WeekStart: ${dayjs(shift.weekStartDate).format('YYYY-MM-DD')}`);
                      return duration;
                    });
                    const daySum = shiftContributions.reduce((acc, duration) => acc + duration, 0);
                    return sum + daySum;
                  }, 0);
                  return (
                    <tr key={employee._id} className="border-b border-gray-700">
                      <td className="p-2">
                        {employee.name} ({employee.email})
                      </td>
                      {daysOfWeek.map((day) => (
                        <td key={day} className="p-2">
                          {shiftsByDay[day].map((shift) => (
                            <div key={shift._id} className="flex items-center gap-2 mb-1">
                              <span className="bg-teal-600 text-white px-2 py-1 rounded">
                                {shift.startTime}–{shift.endTime}
                              </span>
                              <button
                                onClick={() => handleEditShift(shift)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteShift(shift._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </td>
                      ))}
                      <td className="p-2">{totalHours.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Employee Availabilities</h3>
        {isLoadingData.availabilities ? (
          <LoadingSpinner />
        ) : availabilities.length === 0 ? (
          <p className="text-gray-400">
            No availabilities found for the week of {weekStartDate.format('MM/DD/YYYY')}
            {selectedDepartment
              ? ` in ${departments.find((dept) => dept._id === selectedDepartment)?.departmentName || 'the selected department'}`
              : ''}.
            Employees can submit their availability for this week, or try selecting a different week or department.
          </p>
        ) : (
          <div className="space-y-4">
            {availabilities.map((avail) => (
              <div key={avail._id} className="bg-gray-800 p-4 rounded">
                <h4 className="text-md font-semibold">
                  {avail.employeeId?.name || 'Unknown'} ({avail.employeeId?.email || 'N/A'})
                </h4>
                <p className="text-sm text-gray-400">Role: {avail.employeeId?.role || 'N/A'}</p>
                {renderAvailability(avail.days)}
                {avail.note && <p className="text-sm text-gray-400">General Note: {avail.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mb-6">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:bg-gray-800"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded disabled:bg-gray-800"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ManagerAvailability;
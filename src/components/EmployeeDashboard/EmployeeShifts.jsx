import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuth } from '../../Context/authContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EmployeeShifts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentDate = dayjs('2025-05-03');
  const currentDay = currentDate.day();
  const daysUntilNextSunday = (7 - currentDay) % 7 || 7;
  const upcomingSunday = currentDate.add(daysUntilNextSunday, 'day');

  const [shifts, setShifts] = useState([]);
  const [colleagues, setColleagues] = useState([]);
  const [selectedColleague, setSelectedColleague] = useState('');
  const [colleagueShifts, setColleagueShifts] = useState([]);
  const [swapRequests, setSwapRequests] = useState([]);
  const [weekStartDate, setWeekStartDate] = useState(upcomingSunday);
  const [isLoading, setIsLoading] = useState({ shifts: false, colleagues: false, colleagueShifts: false, requests: false });
  const [error, setError] = useState('');
  const [selectedMyShift, setSelectedMyShift] = useState(null);
  const [selectedColleagueShift, setSelectedColleagueShift] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!user) {
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    if (user.role.toLowerCase() !== 'employee') {
      toast.error('Unauthorized access. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }

    fetchShifts();
    fetchColleagues();
    fetchSwapRequests();
  }, [user, navigate, weekStartDate]);

  useEffect(() => {
    if (selectedColleague) {
      fetchColleagueShifts();
    } else {
      setColleagueShifts([]);
      setSelectedColleagueShift(null);
    }
  }, [selectedColleague, weekStartDate]);

  const fetchShifts = async () => {
    setIsLoading((prev) => ({ ...prev, shifts: true }));
    try {
      const token = localStorage.getItem('token');
      const startDateStr = weekStartDate.format('YYYY-MM-DD');
      const endDateStr = weekStartDate.add(6, 'day').format('YYYY-MM-DD');
      const response = await axios.get(`${API_BASE_URL}/api/availability/schedule/${user.companyId}`, {
        params: {
          startDate: startDateStr,
          endDate: endDateStr,
          departmentId: user.departmentId,
        },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const employeeShifts = response.data.filter((shift) => {
        const shiftDate = dayjs(shift.weekStartDate)
          .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day), 'day');
        return (
          shift.employeeId._id.toString() === user._id.toString() &&
          shiftDate.isAfter(weekStartDate.subtract(1, 'day')) &&
          shiftDate.isBefore(weekStartDate.add(7, 'day'))
        );
      });
      setShifts(employeeShifts || []);
    } catch (err) {
      const message = err.response?.status === 404 ? 'No shifts found for this week.' : (err.response?.data?.message || 'Failed to fetch shifts. Please try again later.');
      setError(message);
      if (err.response?.status !== 404) {
        toast.error(message);
      }
      setShifts([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, shifts: false }));
    }
  };

  const fetchColleagues = async () => {
    setIsLoading((prev) => ({ ...prev, colleagues: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/shift-swap/colleagues/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setColleagues(response.data || []);
    } catch (err) {
      const message = err.response?.status === 404 ? 'No colleagues found in your department.' : (err.response?.data?.message || 'Failed to fetch colleagues. Please try again later.');
      setError(message);
      if (err.response?.status !== 404) {
        toast.error(message);
      }
      setColleagues([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, colleagues: false }));
    }
  };

  const fetchColleagueShifts = async () => {
    setIsLoading((prev) => ({ ...prev, colleagueShifts: true }));
    try {
      const token = localStorage.getItem('token');
      const startDateStr = weekStartDate.format('YYYY-MM-DD');
      const endDateStr = weekStartDate.add(6, 'day').format('YYYY-MM-DD');
      const response = await axios.get(`${API_BASE_URL}/api/shift-swap/colleague-shifts/${user._id}/${selectedColleague}`, {
        params: {
          startDate: startDateStr,
          endDate: endDateStr,
        },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setColleagueShifts(response.data || []);
    } catch (err) {
      const message = err.response?.status === 404 ? 'No shifts found for this colleague.' : (err.response?.data?.message || 'Failed to fetch colleague shifts. Please try again later.');
      setError(message);
      if (err.response?.status !== 404) {
        toast.error(message);
      }
      setColleagueShifts([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, colleagueShifts: false }));
    }
  };

  const fetchSwapRequests = async () => {
    setIsLoading((prev) => ({ ...prev, requests: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/shift-swap/requests/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      console.log('Fetched swap requests:', response.data);
      setSwapRequests(response.data || []);
    } catch (err) {
      const message = err.response?.status === 404 ? 'No swap requests found.' : (err.response?.data?.message || 'Failed to fetch shift swap requests. Please try again later.');
      console.error('Error fetching swap requests:', err);
      setError(message);
      if (err.response?.status !== 404) {
        toast.error(message);
      }
      setSwapRequests([]);
    } finally {
      setIsLoading((prev) => ({ ...prev, requests: false }));
    }
  };

  const handleShiftSwapSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMyShift || !selectedColleagueShift) {
      toast.error('Please select both your shift and a colleague\'s shift to swap.');
      return;
    }

    // Client-side validation: Shifts must be on the same day
    if (selectedMyShift.day !== selectedColleagueShift.day) {
      toast.error('Selected shifts must be on the same day.');
      return;
    }

    // Client-side validation: Shifts must not have started
    const now = dayjs();
    const myShiftDateTime = dayjs(selectedMyShift.weekStartDate)
      .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(selectedMyShift.day), 'day')
      .set('hour', parseInt(selectedMyShift.startTime.split(':')[0]))
      .set('minute', parseInt(selectedMyShift.startTime.split(':')[1]));
    const colleagueShiftDateTime = dayjs(selectedColleagueShift.weekStartDate)
      .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(selectedColleagueShift.day), 'day')
      .set('hour', parseInt(selectedColleagueShift.startTime.split(':')[0]))
      .set('minute', parseInt(selectedColleagueShift.startTime.split(':')[1]));

    if (now.isAfter(myShiftDateTime) || now.isAfter(colleagueShiftDateTime)) {
      toast.error('Cannot swap shifts that have already started.');
      return;
    }

    // Client-side validation: Shifts must be at least 3 hours in the future
    const threeHoursBeforeMyShift = myShiftDateTime.subtract(3, 'hour');
    const threeHoursBeforeColleagueShift = colleagueShiftDateTime.subtract(3, 'hour');
    if (now.isAfter(threeHoursBeforeMyShift) || now.isAfter(threeHoursBeforeColleagueShift)) {
      toast.error('Shift swap request must be made at least 3 hours before the shift starts.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/shift-swap/request`,
        { requesterShiftId: selectedMyShift._id, colleagueShiftId: selectedColleagueShift._id },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedMyShift(null);
        setSelectedColleagueShift(null);
        setSelectedColleague('');
        setColleagueShifts([]);
        fetchShifts();
        fetchSwapRequests();
      } else {
        toast.error('Failed to submit shift swap request.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit shift swap request. Please try again later.';
      toast.error(message);
    }
  };

  const handleAcceptSwap = async (requestId) => {
    if (!window.confirm('Are you sure you want to accept this shift swap?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/shift-swap/accept/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      fetchShifts();
      fetchSwapRequests();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to accept shift swap. Please try again later.';
      toast.error(message);
    }
  };

  const handleRejectSwap = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this shift swap?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/shift-swap/reject/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      fetchShifts();
      fetchSwapRequests();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to reject shift swap. Please try again later.';
      toast.error(message);
    }
  };

  const handleCancelSwap = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this shift swap request?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/shift-swap/cancel/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success(response.data.message);
      fetchShifts();
      fetchSwapRequests();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel shift swap request. Please try again later.';
      toast.error(message);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-teal-400">Employee Shift Dashboard</h2>

      {error && (
        <div className="bg-red-500 text-white p-4 rounded-lg mb-6 animate-pulse">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Week Start Date (Sunday)
          </label>
          <input
            type="date"
            value={weekStartDate.format('YYYY-MM-DD')}
            onChange={(e) => {
              const selectedDate = dayjs(e.target.value);
              if (selectedDate.day() !== 0) {
                toast.error('Please select a Sunday.');
                return;
              }
              setWeekStartDate(selectedDate);
            }}
            className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-teal-500 transition-all duration-300"
          />
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-teal-300">My Shifts</h3>
        {isLoading.shifts ? (
          <div className="flex justify-center">
            <svg className="animate-spin h-6 w-6 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : shifts.length === 0 ? (
          <p className="text-gray-400 italic">No shifts assigned for this week.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-700 text-teal-300">
                  <th className="p-4">Date</th>
                  <th className="p-4">Day</th>
                  <th className="p-4">Shift</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => {
                  const shiftDate = dayjs(shift.weekStartDate)
                    .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day), 'day')
                    .format('YYYY-MM-DD');
                  return (
                    <tr key={shift._id} className="border-b border-gray-700 hover:bg-gray-600 transition-colors">
                      <td className="p-4">{shiftDate}</td>
                      <td className="p-4">{shift.day.charAt(0).toUpperCase() + shift.day.slice(1)}</td>
                      <td className="p-4">{`${shift.startTime}–${shift.endTime}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-teal-300">Request a Shift Swap</h3>
        <form onSubmit={handleShiftSwapSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select a Colleague to Swap With
            </label>
            {isLoading.colleagues ? (
              <div className="flex justify-center">
                <svg className="animate-spin h-6 w-6 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : colleagues.length === 0 ? (
              <p className="text-gray-400 italic">No colleagues available in your department. Please contact support.</p>
            ) : (
              <select
                value={selectedColleague}
                onChange={(e) => setSelectedColleague(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-teal-500 transition-all duration-300"
                required
              >
                <option value="">Select a colleague</option>
                {colleagues.map((colleague) => (
                  <option key={colleague.id} value={colleague.id}>
                    {`${colleague.fullName} (${colleague.email})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedColleague && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-teal-300 mb-3">Your Shifts</h4>
                {isLoading.shifts ? (
                  <div className="flex justify-center">
                    <svg className="animate-spin h-6 w-6 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : shifts.length === 0 ? (
                  <p className="text-gray-400 italic">No shifts available to swap.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {shifts.map((shift) => {
                      const shiftDate = dayjs(shift.weekStartDate)
                        .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day), 'day');
                      const shiftDateTime = shiftDate
                        .set('hour', parseInt(shift.startTime.split(':')[0]))
                        .set('minute', parseInt(shift.startTime.split(':')[1]));
                      const now = dayjs();
                      const isPastShift = now.isAfter(shiftDateTime);
                      const isTooClose = now.isAfter(shiftDateTime.subtract(3, 'hour'));

                      return (
                        <div
                          key={shift._id}
                          className={`p-3 rounded-lg cursor-pointer ${selectedMyShift?._id === shift._id ? 'bg-teal-500' : 'bg-gray-600'} ${isPastShift || isTooClose ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-400'} transition-all duration-200`}
                          onClick={() => {
                            if (isPastShift || isTooClose) return;
                            setSelectedMyShift(shift);
                          }}
                        >
                          <p className="font-medium">{`${shiftDate.format('YYYY-MM-DD')} (${shift.day.charAt(0).toUpperCase() + shift.day.slice(1)})`}</p>
                          <p className="text-gray-300">{`${shift.startTime}–${shift.endTime}`}</p>
                          {(isPastShift || isTooClose) && <p className="text-red-400 text-xs">Unavailable</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-teal-300 mb-3">Colleague's Shifts</h4>
                {isLoading.colleagueShifts ? (
                  <div className="flex justify-center">
                    <svg className="animate-spin h-6 w-6 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : colleagueShifts.length === 0 ? (
                  <p className="text-gray-400 italic">No shifts available for this colleague.</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {colleagueShifts.map((shift) => {
                      const shiftDate = dayjs(shift.weekStartDate)
                        .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day), 'day');
                      const shiftDateTime = shiftDate
                        .set('hour', parseInt(shift.startTime.split(':')[0]))
                        .set('minute', parseInt(shift.startTime.split(':')[1]));
                      const now = dayjs();
                      const isPastShift = now.isAfter(shiftDateTime);
                      const isTooClose = now.isAfter(shiftDateTime.subtract(3, 'hour'));

                      return (
                        <div
                          key={shift._id}
                          className={`p-3 rounded-lg cursor-pointer ${selectedColleagueShift?._id === shift._id ? 'bg-teal-500' : 'bg-gray-600'} ${isPastShift || isTooClose ? 'opacity-50 cursor-not-allowed' : 'hover:bg-teal-400'} transition-all duration-200`}
                          onClick={() => {
                            if (isPastShift || isTooClose) return;
                            setSelectedColleagueShift(shift);
                          }}
                        >
                          <p className="font-medium">{`${shiftDate.format('YYYY-MM-DD')} (${shift.day.charAt(0).toUpperCase() + shift.day.slice(1)})`}</p>
                          <p className="text-gray-300">{`${shift.startTime}–${shift.endTime}`}</p>
                          {(isPastShift || isTooClose) && <p className="text-red-400 text-xs">Unavailable</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading.colleagues || isLoading.colleagueShifts || !selectedMyShift || !selectedColleagueShift}
          >
            Submit Shift Swap Request
          </button>
        </form>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-teal-300">Shift Swap Requests</h3>
        {isLoading.requests ? (
          <div className="flex justify-center">
            <svg className="animate-spin h-6 w-6 text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : swapRequests.length === 0 ? (
          <p className="text-gray-400 italic">No swap requests at the moment.</p>
        ) : (
          <div className="space-y-6">
            {swapRequests.map((request) => {
              const requesterShift = request.requesterShiftId;
              const colleagueShift = request.colleagueShiftId;

              const requesterShiftDate = dayjs(requesterShift.weekStartDate)
                .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(requesterShift.day), 'day')
                .format('ddd DD MMM');
              const requesterShiftDay = requesterShift.day.charAt(0).toUpperCase() + requesterShift.day.slice(1);

              const colleagueShiftDate = dayjs(colleagueShift.weekStartDate)
                .add(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(colleagueShift.day), 'day')
                .format('ddd DD MMM');
              const colleagueShiftDay = colleagueShift.day.charAt(0).toUpperCase() + colleagueShift.day.slice(1);

              const isRequester = request.employeeId._id.toString() === user._id.toString();
              const colleagueName = request.colleagueId.fullName || request.colleagueId.name;
              const requesterName = request.employeeId.fullName || request.employeeId.name;

              const displayStatus = request.status.charAt(0).toUpperCase() + request.status.slice(1);

              return (
                <div key={request._id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
                  <h4 className="text-xl font-bold text-teal-400 mb-4">Shift Swap - {displayStatus}</h4>
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-6 mb-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-300">{isRequester ? 'Your Shift' : requesterName}</p>
                      <p className="text-sm text-gray-400">{requesterShiftDate}</p>
                      <p className="text-sm text-gray-400">{requesterShiftDay} {requesterShift.startTime}–{requesterShift.endTime}</p>
                      <p className="text-sm text-gray-400">At Floor staff</p>
                    </div>
                    <div className="text-teal-500 my-4 md:my-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m-12 6H4m0 0l4 4m-4-4l4-4"></path>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-300">{isRequester ? colleagueName : 'Your Shift'}</p>
                      <p className="text-sm text-gray-400">{colleagueShiftDate}</p>
                      <p className="text-sm text-gray-400">{colleagueShiftDay} {colleagueShift.startTime}–{colleagueShift.endTime}</p>
                      <p className="text-sm text-gray-400">At Floor staff</p>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    {request.status === 'pending' && isRequester && (
                      <button
                        onClick={() => handleCancelSwap(request._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                      >
                        Cancel
                      </button>
                    )}
                    {request.status === 'pending' && !isRequester && (
                      <>
                        <button
                          onClick={() => handleRejectSwap(request._id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleAcceptSwap(request._id)}
                          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300"
                        >
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeShifts;
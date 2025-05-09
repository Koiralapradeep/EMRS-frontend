import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Modal from 'react-modal';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../Context/authContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaTimes } from 'react-icons/fa';
import dayjs from 'dayjs';

// Setup moment localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Modal styling
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

const ScheduleCalendar = ({ weekStartDate, setWeekStartDate, adjustToSunday, shifts, onEditShift, onDeleteShift }) => {
  const { user } = useAuth();
  const today = dayjs('2025-04-28'); // Fixed date as per context
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/users/employees/${user.companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setEmployees(response.data || []);
      } catch (err) {
        toast.error('Failed to fetch employees.');
      }
    };

    if (user && user.companyId) {
      fetchEmployees();
    }
  }, [user]);

  // Convert shifts to calendar events
  const events = useMemo(() => {
    return shifts.map((shift) => {
      const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day);
      const start = dayjs(shift.weekStartDate)
        .add(dayIndex, 'day')
        .set('hour', parseInt(shift.startTime.split(':')[0]))
        .set('minute', parseInt(shift.startTime.split(':')[1]))
        .toDate();
      const end = dayjs(shift.weekStartDate)
        .add(dayIndex, 'day')
        .set('hour', parseInt(shift.endTime.split(':')[0]))
        .set('minute', parseInt(shift.endTime.split(':')[1]))
        .toDate();
      return {
        id: shift._id,
        title: `${shift.employeeId.name} (${shift.startTime}-${shift.endTime})`,
        start,
        end,
        resource: shift,
      };
    });
  }, [shifts]);

  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setModalIsOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedDate(event.start);
    setEditingShift(event.resource);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedDate(null);
    setEditingShift(null);
  };

  const handleAddShift = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const employeeId = formData.get('employee');
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');
    const dayIndex = dayjs(selectedDate).diff(weekStartDate, 'day');
    const day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex];

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/availability/shift-schedule`,
        {
          employeeId,
          companyId: user.companyId,
          weekStartDate: weekStartDate.format('YYYY-MM-DD'),
          day,
          startTime,
          endTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // Update shifts in parent component (ManagerAvailability.jsx)
      setShifts((prev) => [...prev, response.data.data]);
      toast.success('Shift added successfully!');
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add shift.');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/availability/shift-schedule/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Update shifts in parent component (ManagerAvailability.jsx)
      onDeleteShift(shiftId);
      toast.success('Shift deleted successfully!');
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete shift.');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/availability/shift-schedule/${editingShift._id}`,
        { startTime, endTime },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // Update shifts in parent component (ManagerAvailability.jsx)
      onEditShift(response.data.data);
      toast.success('Shift updated successfully!');
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update shift.');
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Shift Schedule Calendar</h3>

      {loading && <p className="text-gray-400">Loading shifts...</p>}

      <div className="bg-white p-4 rounded-lg">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          defaultView="week"
          views={['week', 'day']}
          min={new Date(2025, 3, 27, 0, 0, 0)} // Sunday (April 27, 2025)
          max={new Date(2025, 4, 10, 23, 59, 59)} // Saturday (May 10, 2025)
          date={weekStartDate.toDate()}
          onNavigate={(date) => {
            const newWeekStart = adjustToSunday(date);
            setWeekStartDate(newWeekStart);
          }}
          className="rounded-lg"
        />
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="Manage Shifts"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Manage Shifts for {selectedDate && dayjs(selectedDate).format('MMMM D, YYYY')}
          </h2>
          <button onClick={closeModal} className="text-gray-400 hover:text-white" aria-label="Close modal">
            <FaTimes />
          </button>
        </div>

        {selectedDate && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Existing Shifts</h3>
            {shifts
              .filter((shift) => {
                const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day);
                const shiftDate = dayjs(shift.weekStartDate).add(dayIndex, 'day').format('YYYY-MM-DD');
                return shiftDate === dayjs(selectedDate).format('YYYY-MM-DD');
              })
              .length > 0 ? (
              <div className="space-y-2">
                {shifts
                  .filter((shift) => {
                    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day);
                    const shiftDate = dayjs(shift.weekStartDate).add(dayIndex, 'day').format('YYYY-MM-DD');
                    return shiftDate === dayjs(selectedDate).format('YYYY-MM-DD');
                  })
                  .map((shift) => (
                    <div key={shift._id}>
                      {editingShift && editingShift._id === shift._id ? (
                        <form onSubmit={handleSaveEdit} className="bg-gray-700 p-2 rounded">
                          <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                            <input
                              type="time"
                              name="startTime"
                              defaultValue={shift.startTime}
                              className="w-full px-3 py-2 rounded bg-gray-600 border border-gray-500 text-white"
                              required
                            />
                          </div>
                          <div className="mb-2">
                            <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                            <input
                              type="time"
                              name="endTime"
                              defaultValue={shift.endTime}
                              className="w-full px-3 py-2 rounded bg-gray-600 border border-gray-500 text-white"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingShift(null)}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
                          <span>
                            {shift.employeeId.name}: {shift.startTime} - {shift.endTime}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingShift(shift)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteShift(shift._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-400">No shifts scheduled for this day.</p>
            )}
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-2">Add New Shift</h3>
          <form onSubmit={handleAddShift}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Employee</label>
              <select
                name="employee"
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                required
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
              <input
                type="time"
                name="startTime"
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
              <input
                type="time"
                name="endTime"
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded font-semibold"
            >
              Add Shift
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleCalendar;
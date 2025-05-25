import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import Modal from 'react-modal';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaTimes } from 'react-icons/fa';
import dayjs from 'dayjs';

// Setup moment localizer for react-big-calendar
const localizer = momentLocalizer(moment);

// Enhanced modal styling
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
    maxWidth: '700px',
    width: '95%',
    maxHeight: '80vh',
    overflow: 'auto',
    zIndex: 1000,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 999,
  },
};

Modal.setAppElement('#root');

// Helper to validate ObjectId format
const isValidObjectId = (id) => {
  const isHexString = id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
  if (!isHexString) return false;
  try {
    const timestampHex = id.substring(0, 8);
    const timestamp = parseInt(timestampHex, 16);
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    return year >= 1970 && year <= 2100;
  } catch (error) {
    return false;
  }
};

// Helper to get day color for better visual distinction
const getDayColor = (day) => {
  const colors = {
    sunday: '#ef4444',    // red
    monday: '#3b82f6',    // blue
    tuesday: '#10b981',   // green
    wednesday: '#f59e0b', // amber
    thursday: '#8b5cf6',  // purple
    friday: '#06b6d4',    // cyan
    saturday: '#f97316'   // orange
  };
  return colors[day] || '#6b7280';
};

const ScheduleCalendar = ({ 
  weekStartDate, 
  setWeekStartDate, 
  adjustToSunday, 
  shifts, 
  onDeleteShift, 
  onUpdateShift,
  onRefreshShifts
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageRef = useRef(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Auto-dismiss success and error messages after 5 seconds
  useEffect(() => {
    if (success || error) {
      console.log('Message state changed:', { success, error });
      if (messageRef.current) {
        console.log('Scrolling to message');
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const timer = setTimeout(() => {
        console.log('Clearing messages after 5 seconds');
        setSuccess('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Enhanced events with better day-by-day display
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
      
      const dayName = shift.day.charAt(0).toUpperCase() + shift.day.slice(1);
      const employeeName = shift.employeeId?.name || 'Unknown Employee';
      
      return {
        id: shift._id,
        title: `${dayName}: ${employeeName} (${shift.startTime}-${shift.endTime})`,
        start,
        end,
        resource: shift,
        style: {
          backgroundColor: getDayColor(shift.day),
          borderColor: getDayColor(shift.day),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold'
        }
      };
    });
  }, [shifts]);

  const EventComponent = ({ event }) => (
    <div style={{ 
      padding: '2px 4px', 
      fontSize: '11px', 
      lineHeight: '1.2',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}>
      <div style={{ fontWeight: 'bold' }}>
        {event.resource.day.charAt(0).toUpperCase() + event.resource.day.slice(1)}
      </div>
      <div>{event.resource.employeeId?.name || 'Unknown'}</div>
      <div>{event.resource.startTime}-{event.resource.endTime}</div>
    </div>
  );

  const handleSelectSlot = ({ start }) => {
    console.log('Slot selected:', start);
    setSelectedDate(start);
    setModalIsOpen(true);
    setError('');
    setSuccess('');
  };

  const handleSelectEvent = (event) => {
    const shift = event.resource;
    console.log('Selected shift event:', JSON.stringify(shift, null, 2));
    setSelectedDate(event.start);
    setEditingShift(shift);
    setModalIsOpen(true);
    setError('');
    setSuccess('');
  };

  const closeModal = () => {
    console.log('Closing modal');
    setModalIsOpen(false);
    setSelectedDate(null);
    setEditingShift(null);
    setIsLoading(false);
    setError('');
    setSuccess('');
  };

  const handleDeleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) return;

    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      console.log('Deleting shift:', shiftId);
      
      await axios.delete(`${API_BASE_URL}/api/availability/shift-schedule/${shiftId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Update parent component immediately
      if (onDeleteShift) {
        onDeleteShift(shiftId);
        console.log('Parent component updated via onDeleteShift');
      }
      
      console.log('Setting success message for delete');
      setSuccess('Shift deleted successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete shift.';
      console.error('Delete shift error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    console.log('Starting shift edit for shift:', editingShift._id);
    
    const formData = new FormData(e.target);
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');

    // Validation
    if (!startTime || !endTime || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      console.error('Invalid time format');
      setError('Invalid time format. Please use HH:mm format.');
      setIsLoading(false);
      return;
    }

    const start = dayjs(`2025-01-01 ${startTime}`, 'YYYY-MM-DD HH:mm');
    let end = dayjs(`2025-01-01 ${endTime}`, 'YYYY-MM-DD HH:mm');
    
    // Handle overnight shifts
    if (end.isBefore(start) || end.isSame(start)) {
      end = end.add(1, 'day');
    }
    
    if (start.isSame(end)) {
      console.error('Same start/end time');
      setError('Start time cannot be the same as end time.');
      setIsLoading(false);
      return;
    }

    const durationMinutes = end.diff(start, 'minute');
    const durationHours = durationMinutes / 60;
    
    if (durationHours <= 0) {
      console.error('Invalid duration');
      setError('Shift duration must be greater than 0 hours.');
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found.');

      // Get employee ID
      let employeeId;
      if (typeof editingShift.employeeId === 'object' && editingShift.employeeId._id) {
        employeeId = editingShift.employeeId._id;
      } else if (typeof editingShift.employeeId === 'string') {
        employeeId = editingShift.employeeId;
      } else {
        throw new Error('Cannot save shift: Missing or invalid employee ID.');
      }

      if (!employeeId || !isValidObjectId(employeeId)) {
        throw new Error(`Cannot save shift: Invalid employee ID format.`);
      }

      console.log('Updating shift with data:', {
        shiftId: editingShift._id,
        employeeId,
        employeeName: editingShift.employeeId?.name || 'Unknown',
        day: editingShift.day,
        oldTime: `${editingShift.startTime}–${editingShift.endTime}`,
        newTime: `${startTime}–${endTime}`,
        durationHours
      });

      // Send update request
      const response = await axios.put(
        `${API_BASE_URL}/api/availability/shift-schedule/${editingShift._id}`,
        { startTime, endTime, durationHours },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log('Shift updated on server successfully');
      
      // Update parent component immediately - this is the key fix
      if (onUpdateShift && typeof onUpdateShift === 'function') {
        const updatedShift = {
          ...editingShift,
          startTime,
          endTime,
          durationHours
        };
        onUpdateShift(editingShift._id, updatedShift);
        console.log('Parent component updated via onUpdateShift - shifts should refresh immediately');
      } else {
        console.warn('onUpdateShift not available, this may cause UI sync issues');
      }
      
      setSuccess('Shift updated successfully!');
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        closeModal();
      }, 1500);
      
    } catch (err) {
      console.error('Error updating shift:', err);
      const message = err.response?.data?.message || `Failed to update shift: ${err.message}`;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const groupShiftsByDay = (selectedDate) => {
    const dayGroups = {
      sunday: [],
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: []
    };

    shifts.forEach(shift => {
      const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(shift.day);
      const shiftDate = dayjs(shift.weekStartDate).add(dayIndex, 'day').format('YYYY-MM-DD');
      const selectedDateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      
      if (shiftDate === selectedDateStr) {
        dayGroups[shift.day].push(shift);
      }
    });

    return dayGroups;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4 text-white">Shift Schedule Calendar</h3>
      
      {/* Message display outside modal */}
      <div ref={messageRef}>
        {success && (
          <div className="bg-green-600 text-white p-3 rounded mb-4">
            <strong>Success:</strong> {success}
          </div>
        )}
        {error && (
          <div className="bg-red-600 text-white p-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Day color legend */}
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(day => (
          <div key={day} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded" 
              style={{ backgroundColor: getDayColor(day) }}
            ></div>
            <span className="text-gray-300 capitalize">{day}</span>
          </div>
        ))}
      </div>

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
          min={new Date(2025, 3, 27, 0, 0, 0)}
          max={new Date(2025, 4, 10, 23, 59, 59)}
          date={weekStartDate.toDate()}
          onNavigate={(date) => {
            const newWeekStart = adjustToSunday(date);
            setWeekStartDate(newWeekStart);
          }}
          className="rounded-lg"
          components={{
            event: EventComponent
          }}
          eventPropGetter={(event) => ({
            style: event.style
          })}
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
            Shifts for {selectedDate && dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
          </h2>
          <button 
            onClick={closeModal} 
            className="text-gray-400 hover:text-white transition-colors" 
            aria-label="Close modal"
            disabled={isLoading}
          >
            <FaTimes />
          </button>
        </div>

        {/* Messages inside modal */}
        <div>
          {success && (
            <div className="bg-green-600 text-white p-3 rounded mb-4">
              <strong>Success:</strong> {success}
            </div>
          )}
          {error && (
            <div className="bg-red-600 text-white p-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {isLoading && (
          <div className="bg-blue-600 text-white p-3 rounded mb-4">
            <strong>Processing...</strong> Please wait while we update the shift.
          </div>
        )}

        {selectedDate && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Scheduled Shifts</h3>
            {(() => {
              const dayGroups = groupShiftsByDay(selectedDate);
              const selectedDay = dayjs(selectedDate).format('dddd').toLowerCase();
              const shiftsForDay = dayGroups[selectedDay] || [];
              
              return shiftsForDay.length > 0 ? (
                <div className="space-y-3">
                  {shiftsForDay.map((shift) => (
                    <div key={shift._id} className="border border-gray-600 rounded-lg p-3">
                      {editingShift && editingShift._id === shift._id ? (
                        <form onSubmit={handleSaveEdit} className="bg-gray-700 p-3 rounded">
                          <div className="mb-3">
                            <h4 className="text-md font-semibold text-gray-200 mb-2">
                              Editing: {shift.employeeId?.name || 'Unknown Employee'} - {shift.day.charAt(0).toUpperCase() + shift.day.slice(1)}
                            </h4>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
                              <input
                                type="time"
                                name="startTime"
                                defaultValue={shift.startTime}
                                className="w-full px-3 py-2 rounded bg-gray-600 border border-gray-500 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                required
                                disabled={isLoading}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">End Time</label>
                              <input
                                type="time"
                                name="endTime"
                                defaultValue={shift.endTime}
                                className="w-full px-3 py-2 rounded bg-gray-600 border border-gray-500 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                                required
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="bg-teal-500 hover:bg-teal-600 disabled:bg-teal-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                              disabled={isLoading}
                            >
                              {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingShift(null)}
                              className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                              disabled={isLoading}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div 
                                className="w-3 h-3 rounded" 
                                style={{ backgroundColor: getDayColor(shift.day) }}
                              ></div>
                              <span className="font-semibold text-gray-200">
                                {shift.employeeId?.name || 'Unknown Employee'}
                              </span>
                              <span className="text-gray-400 text-sm">
                                ({shift.day.charAt(0).toUpperCase() + shift.day.slice(1)})
                              </span>
                            </div>
                            <div className="text-gray-300">
                              <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
                              <span className="text-gray-400 ml-2">
                                ({shift.durationHours?.toFixed(2) || 'N/A'} hours)
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingShift(shift)}
                              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-700 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                              disabled={isLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteShift(shift._id)}
                              className="bg-red-500 hover:bg-red-600 disabled:bg-red-700 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                              disabled={isLoading}
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
                <div className="text-center py-8 text-gray-400">
                  <p className="text-lg mb-2">No shifts scheduled for {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}</p>
                  <p className="text-sm">Click on the calendar to add a new shift, or use the auto-schedule feature.</p>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ScheduleCalendar;
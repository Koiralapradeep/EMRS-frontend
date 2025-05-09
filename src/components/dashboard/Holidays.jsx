import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Holidays = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [isSingleDay, setIsSingleDay] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  // Helper function to format YYYY-MM-DD to "EEEE d MMMM yyyy"
  const formatDateToString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName} ${day} ${month} ${year}`;
  };

  // Sync endDate with startDate if single-day is selected
  useEffect(() => {
    if (isSingleDay && startDate) {
      setEndDate(startDate);
    }
  }, [isSingleDay, startDate]);

  const addHoliday = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Validation 1: Ensure all fields are filled
      if (!startDate || !endDate || !holidayName) {
        throw new Error("Please select start date, end date, and enter a holiday name.");
      }

      // Convert dates to Date objects for comparison
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Validation 2: Ensure startDate is not after endDate
      if (end < start) {
        throw new Error("End date cannot be before start date.");
      }

      // Validation 3: Prevent past dates
      if (start < today) {
        throw new Error("Start date cannot be in the past.");
      }

      // Format dates for backend submission (include year)
      const formattedStartDate = formatDateToString(startDate);
      const formattedEndDate = formatDateToString(endDate);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage. Please log in again.");
      }

      const response = await fetch("http://localhost:3000/api/holidays", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate: formattedStartDate, endDate: formattedEndDate, name: holidayName }),
      });

      let errorData;
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
          throw new Error(errorData.error || `HTTP Error! Status: ${response.status}`);
        } else {
          const text = await response.text();
          console.error("Non-JSON response from server:", text);
          throw new Error(`Server returned an error (Status: ${response.status}). Please check if the server is running and the endpoint exists.`);
        }
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to add holiday");
      }

      setSuccess("Holiday added successfully! Redirecting to dashboard...");
      setStartDate("");
      setEndDate("");
      setHolidayName("");
      setIsSingleDay(false);

      setTimeout(() => {
        navigate("/manager-dashboard");
      }, 2000);
    } catch (error) {
      console.error("Error adding holiday:", error);
      setError(error.message);
      setSuccess(null);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Add Holiday</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500 text-green-500 rounded">
            {success}
          </div>
        )}

        <form onSubmit={addHoliday} className="space-y-4">
          <div>
            <label htmlFor="start-date" className="block text-gray-300 mb-1">
              Start Date:
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-teal-400"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="single-day"
              checked={isSingleDay}
              onChange={(e) => setIsSingleDay(e.target.checked)}
              className="h-4 w-4 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-400"
            />
            <label htmlFor="single-day" className="text-gray-300">
              Single-Day Holiday
            </label>
          </div>
          <div>
            <label htmlFor="end-date" className="block text-gray-300 mb-1">
              End Date:
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || new Date().toISOString().split("T")[0]}
              disabled={isSingleDay}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-teal-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="holiday-name" className="block text-gray-300 mb-1">
              Holiday Name:
            </label>
            <input
              type="text"
              id="holiday-name"
              value={holidayName}
              onChange={(e) => setHolidayName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-teal-400"
              placeholder="Enter holiday name"
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
            >
              Add Holiday
            </button>
            <button
              type="button"
              onClick={() => navigate("/manager-dashboard")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Holidays;
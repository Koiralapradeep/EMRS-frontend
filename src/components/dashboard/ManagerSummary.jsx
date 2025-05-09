import React, { useEffect, useState } from "react";
import SummaryCard from "./SummaryCard";
import { useAuth } from "../../Context/authContext";
import { useNavigate } from "react-router-dom";
import { faUsers, faBuilding, faClock, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { format, isValid } from "date-fns"; 

const ManagerSummary = () => {
  const { companyName } = useAuth();
  const [summaryData, setSummaryData] = useState([]);
  const [leaveDetails, setLeaveDetails] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found in localStorage. Please log in again.");
        }

        console.log("DEBUG - Fetching summary with token (truncated):", token.slice(0, 10) + "...");
        const response = await fetch("http://localhost:3000/api/manager/summary", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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
          throw new Error(data.error || "Failed to fetch summary");
        }

        if (!data.summary || !Array.isArray(data.summary) || data.summary.length < 2) {
          throw new Error("Invalid summary data structure");
        }
        if (!data.leaveDetails || !Array.isArray(data.leaveDetails) || data.leaveDetails.length < 3) {
          throw new Error("Invalid leave details data structure");
        }

        setSummaryData([
          { title: "Total Employees", value: data.summary[0].value, icon: faUsers, bgColor: "bg-blue-500" },
          { title: "Departments", value: data.summary[1].value, icon: faBuilding, bgColor: "bg-green-500" },
        ]);
        setLeaveDetails([
          { title: "Pending Leave", value: data.leaveDetails[0].value, icon: faClock, bgColor: "bg-yellow-500" },
          { title: "Approved Leave", value: data.leaveDetails[1].value, icon: faCheck, bgColor: "bg-green-500" },
          { title: "Rejected Leave", value: data.leaveDetails[2].value, icon: faTimes, bgColor: "bg-red-500" },
        ]);
      } catch (error) {
        console.error("Error fetching summary:", error);
        setError(error.message);
      }
    };

    const fetchHolidays = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No token found in localStorage. Please log in again.");
        }

        console.log("DEBUG - Fetching holidays with token (truncated):", token.slice(0, 10) + "...");
        const holidaysResponse = await fetch("http://localhost:3000/api/holidays", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        let errorData;
        if (!holidaysResponse.ok) {
          const contentType = holidaysResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            errorData = await holidaysResponse.json();
            console.log("DEBUG - Error response (holidays):", errorData);
            throw new Error(errorData.error || `HTTP Error! Status: ${holidaysResponse.status}`);
          } else {
            const text = await holidaysResponse.text();
            console.error("Non-JSON response from server (holidays):", text);
            throw new Error(`Server returned an error (Status: ${holidaysResponse.status}). Please check if the server is running and the endpoint exists.`);
          }
        }

        const holidaysData = await holidaysResponse.json();
        console.log("DEBUG - Holidays response:", holidaysData);

        if (!holidaysData.success) {
          throw new Error(holidaysData.error || "Failed to fetch holidays");
        }

        if (!Array.isArray(holidaysData.holidays)) {
          throw new Error("Invalid holidays data structure");
        }

        setHolidays(holidaysData.holidays);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setError(error.message);
      }
    };

    fetchSummary();
    fetchHolidays();
  }, []);

  if (error) {
    return (
      <div className="p-6 text-red-500">
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded">
          {error}
        </div>
        {(error.includes("token") || error.includes("Access denied")) && (
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
          >
            Log In Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h1>
        <h2 className="text-lg text-gray-300 mb-4">
          Company: <span className="text-teal-400">{companyName}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {summaryData.map((item, index) => (
            <SummaryCard key={index} {...item} />
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Leave Details</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leaveDetails.map((item, index) => (
            <SummaryCard key={index} {...item} />
          ))}
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Upcoming Holidays</h1>
          <button
            onClick={() => navigate("/manager-dashboard/holidays")}
            className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
          >
            Add Holiday
          </button>
        </div>
        <div>
          {holidays.length === 0 ? (
            <p className="text-gray-400">No upcoming holidays.</p>
          ) : (
            <div className="space-y-2">
              {holidays.map((holiday, index) => (
                <div key={index} className="flex justify-between items-center p-2 border-b border-gray-700">
                  <span className="text-gray-300">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        index % 2 === 0 ? "bg-orange-500" : "bg-teal-500"
                      }`}
                    ></span>
                    {holiday.startDate === holiday.endDate
                      ? format(new Date(holiday.startDate), "dd MMM yyyy")
                      : `${format(new Date(holiday.startDate), "dd MMM yyyy")} to ${format(new Date(holiday.endDate), "dd MMM yyyy")}`}
                  </span>
                  <span className="text-white font-semibold">{holiday.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerSummary;
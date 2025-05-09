import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isValid } from "date-fns";
import { faClock, faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import SummaryCard from "../dashboard/SummaryCard";

const Summary = () => {
  const [companyName, setCompanyName] = useState("Loading...");
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [leaveDetails, setLeaveDetails] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [errorHolidays, setErrorHolidays] = useState(null);
  const [errorLeaveDetails, setErrorLeaveDetails] = useState(null);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const fetchHolidays = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("ERROR - No token found in localStorage.");
      setAuthError("You are not authenticated. Please log in.");
      setCompanyName("Unknown Company");
      setLoadingHolidays(false);
      return;
    }

    try {
      setLoadingHolidays(true);
      const holidaysResponse = await fetch("http://localhost:3000/api/holidays", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!holidaysResponse.ok) {
        throw new Error(`HTTP error! Status: ${holidaysResponse.status}`);
      }
      const holidaysData = await holidaysResponse.json();
      console.log("DEBUG - Holidays response:", holidaysData);

      if (holidaysData.success) {
        setUpcomingHolidays(holidaysData.holidays);
      } else {
        setErrorHolidays("Failed to load holidays.");
      }
      setLoadingHolidays(false);
    } catch (error) {
      console.error("Failed to fetch holidays:", error);
      setErrorHolidays("An error occurred while fetching holidays.");
      setLoadingHolidays(false);
      if (error.message.includes("401")) {
        setAuthError("Authentication failed. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  const fetchLeaveDetails = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("ERROR - No token found in localStorage.");
      setAuthError("You are not authenticated. Please log in.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/manager/summary", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("DEBUG - Leave summary data received:", data);

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch summary");
      }

      if (!data.leaveDetails || !Array.isArray(data.leaveDetails) || data.leaveDetails.length < 3) {
        throw new Error("Invalid leave details data structure");
      }

      setLeaveDetails([
        { title: "Pending Leave", value: data.leaveDetails[0].value, icon: faClock, bgColor: "bg-yellow-500" },
        { title: "Approved Leave", value: data.leaveDetails[1].value, icon: faCheck, bgColor: "bg-green-500" },
        { title: "Rejected Leave", value: data.leaveDetails[2].value, icon: faTimes, bgColor: "bg-red-500" },
      ]);
      setErrorLeaveDetails(null);
    } catch (error) {
      console.error("Failed to fetch leave details:", error);
      setErrorLeaveDetails("An error occurred while fetching leave details. Retry");
    }
  };

  useEffect(() => {
    const fetchCompanyName = () => {
      const storedCompany = localStorage.getItem("companyName");
      setCompanyName(storedCompany || "Unknown Company");
    };

    fetchCompanyName();
    fetchHolidays();
    fetchLeaveDetails();
  }, [navigate]);

  if (authError) {
    return (
      <div className="bg-gray-900 text-white w-full h-full p-4">
        <p className="text-red-400">{authError}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>
      <h2 className="text-lg mb-4">
        Company: <span className="font-semibold text-teal-400">{companyName}</span>
      </h2>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Leave Details</h2>
        {errorLeaveDetails ? (
          <div className="text-red-400">
            {errorLeaveDetails}
            <button onClick={fetchLeaveDetails} className="ml-2 text-teal-400 hover:underline">
              Retry
            </button>
          </div>
        ) : leaveDetails.length === 0 ? (
          <p className="text-gray-400">Loading leave details...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveDetails.map((item, index) => (
              <SummaryCard key={index} {...item} />
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Holidays</h2>
        {loadingHolidays ? (
          <p className="text-gray-400">Loading holidays...</p>
        ) : errorHolidays ? (
          <div className="text-red-400">
            {errorHolidays}
            <button onClick={fetchHolidays} className="ml-2 text-teal-400 hover:underline">
              Retry
            </button>
          </div>
        ) : upcomingHolidays.length === 0 ? (
          <p className="text-gray-400">No upcoming holidays.</p>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="space-y-2">
              {upcomingHolidays.slice(0, 3).map((holiday, index) => (
                <div key={holiday.id} className="flex justify-between items-center p-2 border-b border-gray-700">
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
            {upcomingHolidays.length > 3 && (
              <button
                onClick={() => navigate("/holidays")}
                className="text-teal-400 hover:underline mt-4"
              >
                View All Holidays
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
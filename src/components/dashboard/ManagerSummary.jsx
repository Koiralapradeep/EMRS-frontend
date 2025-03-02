import React, { useEffect, useState } from "react";
import SummaryCard from "./SummaryCard";
import { useAuth } from "../../Context/authContext";
import { faUsers, faBuilding, faClock, faCheck } from "@fortawesome/free-solid-svg-icons";

const ManagerSummary = () => {
  const { companyName } = useAuth(); // Directly use companyName from Auth Context
  const [summaryData, setSummaryData] = useState([]);
  const [leaveDetails, setLeaveDetails] = useState([]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:3000/api/manager/summary", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

        const data = await response.json();
        if (data.success) {
          setSummaryData([
            { title: "Total Employees", value: data.summary.totalEmployees, icon: faUsers, bgColor: "bg-blue-500" },
            { title: "Departments", value: data.summary.departments, icon: faBuilding, bgColor: "bg-green-500" },
          ]);
          setLeaveDetails([
            { title: "Pending Leave", value: data.leaveDetails.pending, icon: faClock, bgColor: "bg-yellow-500" },
            { title: "Approved Leave", value: data.leaveDetails.approved, icon: faCheck, bgColor: "bg-green-500" },
          ]);
        }
      } catch (error) {
        console.error("Error fetching summary:", error);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h1>
        <h2 className="text-lg text-gray-300 mb-4">Company: {companyName}</h2>
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
    </div>
  );
};

export default ManagerSummary;

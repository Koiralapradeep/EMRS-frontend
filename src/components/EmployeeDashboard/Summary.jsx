import React, { useEffect, useState } from "react";

const Summary = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [companyName, setCompanyName] = useState("Loading..."); // Default to loading state

  useEffect(() => {
    const fetchSummary = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("ERROR - No token found in localStorage.");
        setCompanyName("Unknown Company");
        return;
      }

      try {
        const response = await fetch("/api/employees/summary", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        if (data.success) {
          setSummaryData(data.summary);
        }
      } catch (error) {
        console.error("Failed to fetch summary data:", error);
      }
    };

    const fetchCompanyName = () => {
      const storedCompany = localStorage.getItem("companyName");
      setCompanyName(storedCompany || "Unknown Company"); // Fallback if null
    };

    fetchCompanyName();
    fetchSummary();
  }, []);

  return (
    <div className="bg-gray-900 text-white w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>
      <h2 className="text-lg mb-4">
        Company: <span className="font-semibold text-teal-400">{companyName}</span>
      </h2> {/* Standardized Company Name */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryData.map((item, index) => (
          <div
            key={index}
            className="bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center justify-center hover:shadow-lg transition-shadow"
          >
            <div className="text-4xl text-teal-400 mb-4">{item.icon}</div>
            <h2 className="text-lg font-semibold">{item.value}</h2>
            <p className="text-gray-400 text-sm">{item.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Summary;

import React from "react";

const Summary = () => {
  const summaryData = [
    { title: "Total Tasks", value: 120, icon: "📋" },
    { title: "Completed Tasks", value: 95, icon: "✅" },
    { title: "Pending Tasks", value: 25, icon: "⏳" },
    { title: "Upcoming Shifts", value: 10, icon: "📅" },
  ];

  return (
    <div className="bg-gray-900 text-white w-full h-full p-4">
      <h1 className="text-2xl font-bold mb-8">Dashboard Overview</h1>

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

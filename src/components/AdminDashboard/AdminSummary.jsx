import React, { useEffect, useState } from "react";
import axios from "axios";
import { Briefcase, User, Users } from "lucide-react"; // Icons for a modern UI

const AdminSummary = () => {
  const [stats, setStats] = useState({
    companies: 0,
    managers: 0,
    employees: 0,
  });

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Admin Dashboard</h2>

      {/* Dashboard Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Companies */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Total Companies</h3>
            <p className="text-4xl font-bold text-teal-400 mt-2">{stats.companies}</p>
          </div>
          <Briefcase size={40} className="text-teal-400" />
        </div>

        {/* Total Managers */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Total Managers</h3>
            <p className="text-4xl font-bold text-blue-400 mt-2">{stats.managers}</p>
          </div>
          <User size={40} className="text-blue-400" />
        </div>

        {/* Total Employees */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Total Employees</h3>
            <p className="text-4xl font-bold text-yellow-400 mt-2">{stats.employees}</p>
          </div>
          <Users size={40} className="text-yellow-400" />
        </div>
      </div>
    </div>
  );
};

export default AdminSummary;

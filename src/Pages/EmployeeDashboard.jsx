import React from "react";
import EmployeeNavbar from "../components/employeeDashboard/EmployeeNavbar";
import Employeesidebar from "../components/employeeDashboard/Employeesidebar";
import { Outlet } from "react-router-dom";

const EmployeeDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800">
        <Employeesidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <EmployeeNavbar />

        {/* Content Area */}
        <div className="flex-1 p-6 mt-16 overflow-y-auto">
          {/* The `mt-16` ensures content starts below the navbar */}
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

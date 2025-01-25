import React, { useEffect } from "react";
import EmployeeNavbar from "../components/employeeDashboard/EmployeeNavbar";
import Employeesidebar from "../components/employeeDashboard/Employeesidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/authContext";

const EmployeeDashboard = () => {
  const user = useAuth();


  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="relative top-16 w-64 bg-gray-800">
        <Employeesidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-900 min-h-screen pt-16">
        <EmployeeNavbar />
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;

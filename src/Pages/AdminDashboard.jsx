import React from "react";
import AdminNavbar from "../components/AdminDashboard/AdminNavbar";
import AdminSidebar from "../components/AdminDashboard/AdminSidebar";
import { Outlet } from "react-router-dom";

const AdminDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <AdminNavbar />

        {/* Content Area */}
        <div className="flex-1 p-6 mt-16 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

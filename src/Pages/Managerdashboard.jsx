import React, { useState } from 'react';
import Managersidebar from '../components/dashboard/ManagerSidebar';
import Navbar from '../components/dashboard/Navbar';
import { Outlet } from 'react-router-dom';

const ManagerDashboard = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Managersidebar visible={sidebarVisible} toggleSidebar={toggleSidebar} />

        {/* Main Content */}
        <div
          className={`flex-1 p-6 bg-gray-900 text-white overflow-y-auto ${
            sidebarVisible ? 'lg:ml-64' : 'ml-0'
          } transition-all duration-300`}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

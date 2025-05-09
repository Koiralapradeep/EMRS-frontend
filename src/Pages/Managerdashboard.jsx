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
    <div className="flex flex-col h-screen">
      {/* Navbar - Fixed at the top */}
      <div className="fixed top-0 left-0 w-full z-30">
        <Navbar />
      </div>

      {/* Main Layout - Adjusted for Navbar height */}
      <div className="flex flex-1 pt-16"> {/* pt-16 to account for navbar height */}
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
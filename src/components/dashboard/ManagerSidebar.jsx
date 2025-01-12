import React from 'react';
import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTachometerAlt,
  faBuilding,
  faUsers,
  faCalendarAlt,
  faCog,
  faBars,
} from '@fortawesome/free-solid-svg-icons';

const Managersidebar = ({ visible, toggleSidebar }) => {
  const menuItems = [
    { name: 'Dashboard', icon: faTachometerAlt, path: '/manager-dashboard/summary' },
    { name: 'Department', icon: faBuilding, path: '/manager-dashboard/department' },
    { name: 'Employee', icon: faUsers, path: '/manager-dashboard/employee' },
    { name: 'Leave', icon: faCalendarAlt, path: '/manager-dashboard/leave' },
    { name: 'Setting', icon: faCog, path: '/manager-dashboard/setting' },
  ];

  return (
    <div
      className={`fixed h-full w-64 bg-gray-800 text-white shadow-lg flex flex-col transition-transform duration-300 ${
        visible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between bg-white-600 p-4">
        <h1 className="font-bold text-lg">Manager Panel</h1>
        <button
          onClick={toggleSidebar}
          className="text-white text-2xl focus:outline-none md:hidden"
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow overflow-y-auto">
        <ul className="mt-6 space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 space-x-3 ${
                    isActive ? 'bg-teal-500' : 'hover:bg-gray-700'
                  } transition-all duration-200 rounded-md`
                }
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <footer className="text-center py-4 text-sm bg-gray-900">
        © 2025 Rostering System
      </footer>
    </div>
  );
};

export default Managersidebar;

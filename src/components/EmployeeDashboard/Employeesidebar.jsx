import React from "react";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faUser,
  faCalendarAlt,
  faCog,
  faComments,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../Context/authContext";

const Employeesidebar = () => {
  const { user } = useAuth();
  const userId = user?._id; // Safely retrieve userId

  const menuItems = [
    { name: "Dashboard", path: "/employee-dashboard", icon: faTachometerAlt },
    {
      name: "My Profile",
      path: userId
        ? `/employee-dashboard/profile/${userId}`
        : "/employee-dashboard/profile",
      icon: faUser,
    },
    { name: "Leave", path: "/employee-dashboard/Leave", icon: faCalendarAlt },
    { name: "Feedback", path: "/employee-dashboard/feedback", icon: faComments },
    { name: "Shifts", path: "/employee-dashboard/shifts", icon: faClock },
    { name: "Settings", path: "/employee-dashboard/settings", icon: faCog },

  ];

  return (
    <div className="h-full bg-gray-800 text-white flex flex-col w-64">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="font-bold text-lg">Employee Panel</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow">
        <ul className="mt-6 space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                end
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 space-x-3 ${
                    isActive
                      ? "bg-teal-500 text-white"
                      : "hover:bg-gray-700 hover:text-white"
                  } transition duration-200 rounded-md`
                }
              >
                <FontAwesomeIcon icon={item.icon} className="text-base" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <footer className="text-center py-4 text-xs bg-gray-800 border-t border-gray-700">
        © 2025 Rostering System
      </footer>
    </div>
  );
};

export default Employeesidebar;

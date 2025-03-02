import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Users, Building, LogOut } from "lucide-react";

const AdminSidebar = () => {
  return (
    <aside className="w-64 h-screen bg-gray-800 text-white fixed left-0 top-0 flex flex-col">
      <div className="p-6 text-2xl font-bold text-center border-b border-gray-700">
        Admin Panel
      </div>
      <nav className="flex-1 px-4 mt-4">
        <NavLink to="/admin-dashboard" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
          <Home size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/admin-dashboard/companies" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
          <Building size={20} />
          Companies
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-700">
        <NavLink to="/logout" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700">
          <LogOut size={20} />
          Logout
        </NavLink>
      </div>
    </aside>
  );
};

export default AdminSidebar;

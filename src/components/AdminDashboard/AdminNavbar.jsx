import React from "react";
import { Link } from "react-router-dom";

const AdminNavbar = () => {
  return (
    <nav className="fixed top-0 left-64 right-0 bg-gray-800 text-white shadow-md h-16 flex items-center px-6 z-10">
      <h1 className="text-xl font-bold flex-1">Admin Dashboard</h1>
    </nav>
  );
};

export default AdminNavbar;

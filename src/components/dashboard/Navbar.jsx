import React from 'react';
import { useAuth } from '../../Context/authContext';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Welcome Section */}
        <h1 className="text-lg font-bold">
          Welcome, <span className="text-teal-400">{user?.name || 'User'}</span>
        </h1>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition duration-300"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { Briefcase, User, Users } from "lucide-react";

const AdminSummary = ({ apiEndpoint = "/api/admin/stats" }) => {
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalManagers: 0,
    totalUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(apiEndpoint);
        setStats(response.data);
      } catch (err) {
        setError("Failed to fetch dashboard statistics");
        console.error("Error fetching stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [apiEndpoint]);

  if (error) {
    return (
      <div className="p-6 text-red-400 text-center" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        Admin Dashboard
      </h2>

      {isLoading ? (
        <div className="text-center text-gray-400">Loading statistics...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total Companies */}
          <div
            className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between transition-transform hover:scale-105"
            aria-label="Total Companies"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Total Companies
              </h3>
              <p className="text-4xl font-bold text-teal-400 mt-2">
                {stats.totalCompanies}
              </p>
            </div>
            <Briefcase size={40} className="text-teal-400" aria-hidden="true" />
          </div>

          {/* Total Managers */}
          <div
            className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between transition-transform hover:scale-105"
            aria-label="Total Managers"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Total Managers
              </h3>
              <p className="text-4xl font-bold text-blue-400 mt-2">
                {stats.totalManagers}
              </p>
            </div>
            <User size={40} className="text-blue-400" aria-hidden="true" />
          </div>

          {/* Total Users */}
          <div
            className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-between transition-transform hover:scale-105"
            aria-label="Total Users"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-300">
                Total Users
              </h3>
              <p className="text-4xl font-bold text-blue-400 mt-2">
                {stats.totalUsers}
              </p>
            </div>
            <Users size={40} className="text-blue-400" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
};

AdminSummary.propTypes = {
  apiEndpoint: PropTypes.string.isRequired,
};

export default AdminSummary;
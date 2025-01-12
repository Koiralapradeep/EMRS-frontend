import React from 'react';
import SummaryCard from './SummaryCard';
import {
  faUsers,
  faBuilding,
  faFileAlt,
  faClock,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

const ManagerSummary = () => {
  const summaryData = [
    { icon: faUsers, title: 'Total Employees', value: '13', bgColor: '#4CAF50' },
    { icon: faBuilding, title: 'Total Departments', value: '5', bgColor: '#FFC107' },
  ];

  const leaveDetails = [
    { icon: faFileAlt, title: 'Leave Applied', value: '5', bgColor: '#2196F3' },
    { icon: faClock, title: 'Leave Pending', value: '4', bgColor: '#FF9800' },
    { icon: faCheck, title: 'Leave Approved', value: '2', bgColor: '#4CAF50' },
    { icon: faTimes, title: 'Leave Rejected', value: '1', bgColor: '#F44336' },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Dashboard Overview */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Dashboard Overview</h1>
        <div className="flex space-x-4">
          {summaryData.map((item, index) => (
            <SummaryCard
              key={index}
              icon={item.icon}
              title={item.title}
              value={item.value}
              bgColor={item.bgColor}
            />
          ))}
        </div>
      </div>

      {/* Leave Details */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Leave Details</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {leaveDetails.map((item, index) => (
            <SummaryCard
              key={index}
              icon={item.icon}
              title={item.title}
              value={item.value}
              bgColor={item.bgColor}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagerSummary;

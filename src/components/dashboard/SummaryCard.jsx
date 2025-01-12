import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const SummaryCard = ({ icon, title, value, bgColor }) => {
  return (
    <div
      className="bg-white/20 backdrop-blur-lg shadow-md rounded-lg p-4 flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105 hover:shadow-lg"
      style={{
        border: '1px solid rgba(255, 255, 255, 0.3)',
        width: '200px',
        height: '150px',
      }}
    >
      <div
        className="w-12 h-12 flex items-center justify-center rounded-full mb-4"
        style={{ backgroundColor: bgColor }}
      >
        <FontAwesomeIcon icon={icon} className="text-white text-2xl" />
      </div>
      <h3 className="text-gray-200 text-sm font-medium text-center">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
};

export default SummaryCard;

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const SummaryCard = ({ title, value, icon, bgColor }) => {
  return (
    <div className="flex items-center bg-white p-4 rounded-lg shadow-md">
      <div className={`flex items-center justify-center w-12 h-12 rounded-full ${bgColor} mr-4`}>
        <FontAwesomeIcon icon={icon} className="text-white text-xl" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faBuilding,
  faFileAlt,
  faClock,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";

const SummaryCard = ({ icon, title, value, bgColor }) => {
  return (
    <div className={`p-4 rounded-lg shadow-md ${bgColor}`}>
      <div className="flex items-center space-x-4">
        <FontAwesomeIcon icon={icon} className="text-white text-2xl" />
        <div>
          <h3 className="text-white text-lg font-semibold">{title}</h3>
          <p className="text-white text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

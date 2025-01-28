import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import ManagerDashboard from "./Pages/Managerdashboard";
import EmployeeDashboard from "./Pages/EmployeeDashboard";
import Unauthorized from "./Pages/Unauthorized";
import PrivateRoutes from "./utils/PrivateRoutes";
import RoleBasedRoute from "./utils/RoleBasedRoute";
import ManagerSummary from "./components/dashboard/ManagerSummary";
import Departments from "./components/department/Departments";
import AddDepartment from "./components/department/AddDepartment";
import EditDepartment from "./components/department/EditDepartment";
import List from "./components/employee/List";
import Add from "./components/employee/Add";
import EditEmployee from "./components/employee/EditEmployee";
import ViewEmployee from "./components/employee/ViewEmployee";
import Summary from "./components/EmployeeDashboard/Summary";
import View from './components/EmployeeDashboard/View';
import Settings from "./components/EmployeeDashboard/Settings";
import ManagerLeave from "./components/Leave/ManagerLeave";
import ManagerSettings from "./components/dashboard/ManagerSettings";
import LeaveList from './components/Leave/LeaveList';
import AddLeave from './components/Leave/AddLeave';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/manager-dashboard/*"
        element={
          <PrivateRoutes>
            <RoleBasedRoute requiredRoles={["Manager"]}>
              <ManagerDashboard />
            </RoleBasedRoute>
          </PrivateRoutes>
        }
      >
        {/* Nested Routes for Manager */}
        <Route path="" element={<ManagerSummary />} />
        <Route path="summary" element={<ManagerSummary />} />
        <Route path="department" element={<Departments />} />
        <Route path="add-department" element={<AddDepartment />} />
        <Route path="edit-department/:id" element={<EditDepartment />} />
        <Route path="employee" element={<List />} />
        <Route path="add-employee" element={<Add />} />
        <Route path="edit-employee/:id" element={<EditEmployee />} />
        <Route path="view-employee/:id" element={<ViewEmployee />} />
        <Route path="leave" element={<ManagerLeave/>} />
        <Route path="setting" element={<ManagerSettings />} />
        <Route path="*" element={<Navigate to="summary" />} />
      </Route>

      <Route
        path="/employee-dashboard/*"
        element={
          <PrivateRoutes>
            <RoleBasedRoute requiredRoles={["Employee"]}>
              <EmployeeDashboard />
            </RoleBasedRoute>
          </PrivateRoutes>
        }
      >
        {/* Nested Routes for Employee */}
        <Route path="" element={<Summary />} />
        <Route path="summary" element={<Summary />} />
        <Route path="profile/:userId" element={<View />} />
        <Route path="Leave" element={<LeaveList />} />
        <Route path="add-leave" element={<AddLeave />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="summary" />} />
      </Route>

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;

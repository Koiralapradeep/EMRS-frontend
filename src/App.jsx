import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import ManagerDashboard from "./Pages/ManagerDashboard";
import EmployeeDashboard from "./Pages/EmployeeDashboard";
import AdminDashboard from "./Pages/AdminDashboard";
import UnAuthorized from "./Pages/UnAuthorized";
import PrivateRoutes from "./utils/PrivateRoutes";
import RoleBasedRoute from "./utils/RoleBasedRoute";
import ManagerSummary from "./components/dashboard/ManagerSummary";
import Departments from "./components/department/Departments";
import AddDepartment from "./components/department/AddDepartment";
import EditDepartment from "./components/department/EditDepartment";
import EmployeeList from "./components/employee/List";
import AddEmployee from "./components/employee/Add";
import EditEmployee from "./components/employee/EditEmployee";
import ViewEmployee from "./components/employee/ViewEmployee";
import Summary from "./components/EmployeeDashboard/Summary";
import View from './components/EmployeeDashboard/View';
import EmployeeSettings from "./components/EmployeeDashboard/Settings";
import ManagerLeave from "./components/Leave/ManagerLeave";
import ManagerSettings from "./components/dashboard/ManagerSettings";
import LeaveList from "./components/Leave/LeaveList";
import AddLeave from "./components/Leave/AddLeave";
import LeaveDetail from "./components/Leave/Detail";
import ViewLeave from "./components/Leave/ViewLeave";
import EmployeeFeedback from "./components/EmployeeDashboard/Feedback";
import ManagerFeedback from "./components/dashboard/ManagerFeedback";
import AdminSummary from "./components/AdminDashboard/AdminSummary";
import Companies from "./components/AdminDashboard/Companies";
import AddCompany from "./components/AdminDashboard/AddCompany";
import EditCompany from './components/AdminDashboard/EditCompany';

function App() {
  return (
    <Routes>
      {/*  Login Page */}
      <Route path="/login" element={<Login />} />

      {/* Admin Routes (Protected) */}
      <Route
        path="/admin-dashboard/*"
        element={
          <PrivateRoutes>
            <RoleBasedRoute requiredRoles={["Admin"]}>
              <AdminDashboard />
            </RoleBasedRoute>
          </PrivateRoutes>
        }
      >
        <Route index element={<AdminSummary />} />
        <Route path="companies" element={<Companies />} />
        <Route path="add-company" element={<AddCompany />} />
        <Route path="edit-company/:id" element={<EditCompany />} />
        <Route path="*" element={<Navigate to="/admin-dashboard" />} />
      </Route>

      {/*  Manager Routes (Protected) */}
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
        {/*  Default Nested Route */}
        <Route index element={<ManagerSummary />} />
        <Route path="summary" element={<ManagerSummary />} />
        <Route path="department" element={<Departments />} />
        <Route path="add-department" element={<AddDepartment />} />
        <Route path="edit-department/:id" element={<EditDepartment />} />
        <Route path="employee" element={<EmployeeList />} />
        <Route path="add-employee" element={<AddEmployee />} />
        <Route path="edit-employee/:id" element={<EditEmployee />} />
        <Route path="view-employee/:id" element={<ViewEmployee />} />
        <Route path="leave" element={<ManagerLeave />} />
        <Route path="setting" element={<ManagerSettings />} />
        <Route path="detail" element={<LeaveDetail />} />
        <Route path="view-leave" element={<ViewLeave />} />
        <Route path="feedback" element={<ManagerFeedback />} />
        {/*  Redirect unknown routes to summary */}
        <Route path="*" element={<Navigate to="summary" />} />
      </Route>

      {/*  Employee Routes (Protected) */}
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
        {/*  Default Nested Route */}
        <Route index element={<Summary />} />
        <Route path="summary" element={<Summary />} />
        <Route path="profile/:userId" element={<View />} />
        <Route path="leave" element={<LeaveList />} />
        <Route path="add-leave" element={<AddLeave />} />
        <Route path="settings" element={<EmployeeSettings />} />
        <Route path="feedback" element={<EmployeeFeedback />} />
        {/*  Redirect unknown routes to summary */}
        <Route path="*" element={<Navigate to="summary" />} />
      </Route>

      {/* Unauthorized Page */}
      <Route path="/unauthorized" element={<UnAuthorized />} />

      {/*  Catch-all Redirect to Login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;

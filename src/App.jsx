import { Routes, Route, Navigate } from "react-router-dom";
import React from 'react';
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
import View from "./components/EmployeeDashboard/View";
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
import EditCompany from "./components/AdminDashboard/EditCompany";
import { NotificationProvider } from "./Context/NotificationContext";
import AvailabilityForm from "./components/EmployeeDashboard/AvailabilityForm";
import Availability from './components/EmployeeDashboard/Availability';
import ManagerAvailability from "./components/dashboard/ManagerAvailability";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from './Pages/ResetPassword';
import Holidays from "./components/dashboard/Holidays";
import EditAvailabilities from "./components/EmployeeDashboard/EditAvailability";
import ShiftRequirements from "./components/EmployeeDashboard/ShiftRequirements";
import EmployeeShifts from './components/EmployeeDashboard/EmployeeShifts';
import ManagerMessage from "./components/dashboard/ManagerMessage";
import Message from "./components/EmployeeDashboard/Message";

function App() {
  return (
    <Routes>
      {/* Login Page */}
      <Route path="/login" element={<Login />} />

       {/* Forgot Password Page */}
       <Route path="/forgot-password" element={<ForgotPassword />} />

       <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin Routes (Protected) */}
      <Route
        path="/admin-dashboard/*"
        element={
          <PrivateRoutes>
            <RoleBasedRoute requiredRoles={["Admin"]}>
              <NotificationProvider>
                <AdminDashboard />
              </NotificationProvider>
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

      {/* Manager Routes (Protected) */}
      <Route
        path="/manager-dashboard/*"
        element={
          <PrivateRoutes>
            <RoleBasedRoute requiredRoles={["Manager"]}>
              <NotificationProvider>
                <ManagerDashboard />
              </NotificationProvider>
            </RoleBasedRoute>
          </PrivateRoutes>
        }
      >
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
        <Route path="availability" element={<ManagerAvailability />} />
        <Route path="Holidays" element={<Holidays />} />
        <Route path="shift-requirements" element={<ShiftRequirements />} />
        <Route path="messages" element={<ManagerMessage/>} />
        <Route path="*" element={<Navigate to="summary" />} />
      </Route>

      {/* Employee Routes (Protected) */}
      <Route
        path="/employee-dashboard/*"
        element={
          <PrivateRoutes>
            <RoleBasedRoute requiredRoles={["Employee"]}>
              <NotificationProvider>
                <EmployeeDashboard />
              </NotificationProvider>
            </RoleBasedRoute>
          </PrivateRoutes>
        }
      >
        <Route index element={<Summary />} />
        <Route path="summary" element={<Summary />} />
        <Route path="profile/:userId" element={<View />} />
        <Route path="leave" element={<LeaveList />} />
        <Route path="add-leave" element={<AddLeave />} />
        <Route path="settings" element={<EmployeeSettings />} />
        <Route path="feedback" element={<EmployeeFeedback />} />
        <Route path="availability" element={<Availability/>} />
        <Route path="add-availability" element={<AvailabilityForm />} /> 
        <Route path="edit-availability/:availabilityId" element={<EditAvailabilities />} />
        <Route path="shifts" element={<EmployeeShifts />} />
         <Route path="messages" element={<Message />} />
        <Route path="*" element={<Navigate to="summary" />} />
      </Route>

      {/* Unauthorized Page */}
      <Route path="/unauthorized" element={<UnAuthorized />} />

      {/* Catch-all Redirect to Login */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { LawyersPage } from './pages/LawyersPage';
import { ClientsPage } from './pages/ClientsPage';
import { StagesPage } from './pages/StagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import TasksKanbanPage from './pages/TasksKanbanPage';
import ReportsPageNew from './pages/ReportsPageNew';
import InvoicesPage from './pages/InvoicesPage';
import AdminsPage from './pages/AdminsPage';
import AdminManagementPage from './pages/AdminManagementPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/tasks/:id" element={<TaskDetailsPage />} />
                    <Route path="/tasks-kanban" element={<TasksKanbanPage />} />
                    <Route path="/stages" element={<StagesPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/activity-log" element={<ActivityLogPage />} />
                    <Route path="/reports" element={<ReportsPageNew />} />
                    <Route path="/invoices" element={<InvoicesPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/departments" element={<DepartmentsPage />} />
                    <Route path="/lawyers" element={<LawyersPage />} />
                    <Route path="/clients" element={<ClientsPage />} />
                    <Route path="/admins" element={<AdminsPage />} />
                    <Route path="/admin-management" element={<AdminManagementPage />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="/" element={<PrivateRoute><Layout><DashboardPage /></Layout></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

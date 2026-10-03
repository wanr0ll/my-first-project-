
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import AssetInventory from './pages/AssetInventory';
import AssetHistory from './pages/AssetHistory';
import MaintenanceSchedule from './pages/MaintenanceSchedule';
import ReportsAnalytics from './pages/ReportsAnalytics';
import Settings from './pages/Settings';
import DisposedAssets from './pages/DisposedAssets';
import CategorySummary from './pages/CategorySummary';
import NotificationsPage from './pages/NotificationsPage';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import UserManagement from './pages/UserManagement';
import ArchivedAssets from './pages/ArchivedAssets';
import ProtectedRoute from './components/ProtectedRoute';

import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import { AssetProvider } from './context/AssetContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <Router>
      <ToastProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AssetProvider>
                <MaintenanceProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<Dashboard />} />
                      <Route path="assets" element={<AssetInventory />} />
                      <Route path="history" element={<AssetHistory />} />
                      <Route path="maintenance" element={<MaintenanceSchedule />} />
                      <Route path="disposed" element={<DisposedAssets />} />
                      <Route path="category-summary" element={<CategorySummary />} />
                      <Route path="notifications" element={<NotificationsPage />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="archived" element={<ArchivedAssets />} />
                      <Route path="reports" element={<ReportsAnalytics />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MaintenanceProvider>
              </AssetProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;

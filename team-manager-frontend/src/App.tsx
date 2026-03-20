import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SuperviseurDashboardPage from './pages/SuperviseurDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import OperateurDashboardPage from './pages/OperateurDashboardPage';
import TeamPage from './pages/TeamPage';
import CalendarPage from './pages/CalendarPage';
import HolidaysPage from './pages/HolidaysPage';
import EgyptDutyPage from './pages/EgyptDutyPage';
import HistoryPage from './pages/HistoryPage';
import ExportsPage from './pages/ExportsPage';
import SettingsPage from './pages/SettingsPage';

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Role check wrapper for specific routes
function RoleRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[] 
}) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Dashboard router based on role
function DashboardRouter() {
  const { user, isAdmin, isSuperviseur, isOperateur } = useAuth();
  
  // Add safety check for user
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Role-based dashboard rendering
  if (isAdmin) {
    return <AdminDashboardPage />;
  }
  
  if (isSuperviseur) {
    return <SuperviseurDashboardPage />;
  }
  
  if (isOperateur) {
    return <OperateurDashboardPage />;
  }
  
  // Fallback for unknown roles
  return <DashboardPage />;
}

// Main routes component
function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      
      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Dashboard - redirects to role-specific dashboard */}
        <Route index element={<DashboardRouter />} />
        
        {/* Admin only routes */}
        <Route 
          path="users" 
          element={
            <RoleRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </RoleRoute>
          } 
        />
        <Route 
          path="exports" 
          element={
            <RoleRoute allowedRoles={['admin']}>
              <ExportsPage />
            </RoleRoute>
          } 
        />
        
        {/* Admin and Superviseur routes */}
        <Route 
          path="holidays" 
          element={
            <RoleRoute allowedRoles={['admin', 'superviseur']}>
              <HolidaysPage />
            </RoleRoute>
          } 
        />
        <Route 
          path="egypt-duty" 
          element={
            <RoleRoute allowedRoles={['admin', 'superviseur']}>
              <EgyptDutyPage />
            </RoleRoute>
          } 
        />
        
        {/* All authenticated users */}
        <Route path="team" element={<TeamPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Main App component
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

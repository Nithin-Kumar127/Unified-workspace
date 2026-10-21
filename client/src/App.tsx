import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Navbar from './components/Navbar';

// Layout for standard pages (includes the Navbar)
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen bg-[#0E0E11]">
      <Navbar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
};

// Security wrapper (ensures user is logged in)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const auth = useContext(AuthContext);
  if (auth?.isLoading) return null;
  if (!auth?.user) return <Navigate to="/login" />;
  return <>{children}</>;
};

export default function App() {
  const auth = useContext(AuthContext);

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/auth/callback"
        element={
          auth?.isLoading ? (
            <div className="flex min-h-screen items-center justify-center bg-[#0E0E11] text-zinc-300">
              Completing sign-in…
            </div>
          ) : (
            <Navigate to={auth?.user ? "/dashboard" : "/login"} replace />
          )
        }
      />
      <Route path="/login" element={auth?.user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={auth?.user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Dashboard Route (Includes standard Navbar layout) */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Workspace IDE Route (Full Screen, No Navbar) */}
      <Route path="/workspace/:id" element={
        <ProtectedRoute>
          <Workspace />
        </ProtectedRoute>
      } />
      
      {/* Fallback alias in case your Dashboard links to /project/:id instead */}
      <Route path="/project/:id" element={
        <ProtectedRoute>
          <Workspace />
        </ProtectedRoute>
      } />
      
      {/* Default Catch-All Redirect */}
      <Route path="*" element={<Navigate to={auth?.user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}
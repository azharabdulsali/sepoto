import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages — Public
import Login                from './pages/Login';
import AdminLogin           from './pages/AdminLogin';
import PhotographerLogin    from './pages/PhotographerLogin';

// Pages — User Peserta
import GalleryPage          from './pages/GalleryPage';
import CartPage             from './pages/CartPage';
import OrderHistory         from './pages/OrderHistory';

// Pages — Dashboards
import AdminDashboard       from './pages/AdminDashboard';
import PhotographerDashboard from './pages/PhotographerDashboard';

// ─── Protected Route Wrapper ──────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    // Redirect ke home yang sesuai role
    if (currentUser?.role === 'user')        return <Navigate to="/gallery" replace />;
    if (currentUser?.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
    if (currentUser?.role === 'photographer') return <Navigate to="/photographer/dashboard" replace />;
  }

  return children;
};

// ─── App: Root Routing ────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, currentUser } = useAuth();

  return (
    <Routes>
      {/* ─── Public: Login Pages ─── */}
      <Route
        path="/"
        element={
          isAuthenticated && currentUser?.role === 'user'
            ? <Navigate to="/gallery" replace />
            : <Login />
        }
      />
      <Route
        path="/admin/login"
        element={
          isAuthenticated && currentUser?.role === 'super_admin'
            ? <Navigate to="/admin/dashboard" replace />
            : <AdminLogin />
        }
      />
      <Route
        path="/photographer/login"
        element={
          isAuthenticated && currentUser?.role === 'photographer'
            ? <Navigate to="/photographer/dashboard" replace />
            : <PhotographerLogin />
        }
      />

      {/* ─── Protected: User Peserta ─── */}
      <Route
        path="/gallery"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <GalleryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <CartPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <OrderHistory />
          </ProtectedRoute>
        }
      />

      {/* ─── Protected: Admin ─── */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ─── Protected: Fotografer ─── */}
      <Route
        path="/photographer/dashboard"
        element={
          <ProtectedRoute allowedRoles={['photographer']}>
            <PhotographerDashboard />
          </ProtectedRoute>
        }
      />

      {/* ─── 404 Fallback ─── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
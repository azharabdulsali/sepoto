import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages — Public (Eagerly Loaded)
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';

// Pages — Lazy Loaded Chunks
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PhotographerDashboard = lazy(() => import('./pages/PhotographerDashboard'));

import IdleTimeoutHandler from './components/IdleTimeoutHandler';

const PageLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// ─── Protected Route Wrapper ──────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(currentUser?.role)) {
    if (currentUser?.role === 'user') return <Navigate to="/gallery" replace />;
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (currentUser?.role === 'photographer') return <Navigate to="/photographer/dashboard" replace />;
  }

  return children;
};

// ─── App: Root Routing ────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, currentUser } = useAuth();

  // Helper redirect jika sudah login
  const getAuthenticatedRedirect = () => {
    if (currentUser?.role === 'user') return <Navigate to="/gallery" replace />;
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (currentUser?.role === 'photographer') return <Navigate to="/photographer/dashboard" replace />;
    return <Navigate to="/" replace />;
  };

  return (
    <>
      <IdleTimeoutHandler />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ─── Public Maintenance Route ─── */}
          <Route path="/maintenance" element={<MaintenancePage />} />

          {/* ─── Public Root: Landing Page / Public Dashboard ─── */}
          <Route
            path="/"
            element={
              isAuthenticated
                ? getAuthenticatedRedirect()
                : <LandingPage />
            }
          />

          {/* ─── Unified Login Route ─── */}
          <Route
            path="/login"
            element={
              isAuthenticated
                ? getAuthenticatedRedirect()
                : <Login />
            }
          />

          {/* ─── Legacy login routes → redirect to unified /login ─── */}
          <Route path="/admin/login" element={<Navigate to="/login" replace />} />
          <Route path="/photographer/login" element={<Navigate to="/login" replace />} />

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
              <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
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
      </Suspense>
    </>
  );
}
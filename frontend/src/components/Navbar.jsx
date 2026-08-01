import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, LogOut, Camera, Menu, X, User,
  ClipboardList, Home, LayoutDashboard, Aperture
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// ─── Navbar — Mobile-First, Sticky, Glassmorphism ─────────────────────
export default function Navbar() {
  const { currentUser, logout, isAuthenticated, isAdmin, isPhotographer } = useAuth();
  const { itemCount } = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const roleLabel = isAdmin ? 'Super Admin' : isPhotographer ? 'Fotografer' : null;
  const roleColor = isAdmin
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : isPhotographer
    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    : '';

  const isUser = currentUser?.role === 'user';

  return (
    <>
      {/* ─── Top Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass border-b border-[#E5E7EB]">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link
            to={isAuthenticated ? (isUser ? '/gallery' : isAdmin ? '/admin/dashboard' : '/photographer/dashboard') : '/'}
            className="flex items-center gap-2 shrink-0 group"
            aria-label="Sepoto - Home"
          >
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Camera className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-sans font-semibold text-[#111827] tracking-tight text-base">
              Sepoto
            </span>
            {/* Label GALERI hanya di sm+ */}
            <span className="hidden sm:inline text-xs font-bib text-brand opacity-70 mt-0.5">
              GALERI
            </span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1">

            {/* Role badge (sm+) */}
            {isAuthenticated && roleLabel && (
              <span className={`hidden sm:flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bib uppercase mr-1 ${roleColor}`}>
                {roleLabel}
              </span>
            )}

            {/* User info (sm+) — hanya user peserta */}
            {isAuthenticated && isUser && (
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-[#4B5563] mr-1">
                <User className="w-3.5 h-3.5" />
                <span className="font-medium text-[#111827] max-w-[100px] truncate">
                  {currentUser.name.split(' ')[0]}
                </span>
                {currentUser.bibNumber && (
                  <span className="font-bib text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                    #{currentUser.bibNumber}
                  </span>
                )}
              </div>
            )}

            {/* Riwayat Pesanan (sm+) — user peserta */}
            {isAuthenticated && isUser && (
              <Link
                to="/orders"
                id="nav-orders-btn"
                className={`hidden sm:flex tap-target items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  location.pathname === '/orders' ? 'bg-brand/10 text-brand' : 'hover:bg-gray-100 text-[#111827]'
                }`}
                aria-label="Riwayat Pesanan"
                title="Riwayat Pesanan"
              >
                <ClipboardList className="w-5 h-5" />
              </Link>
            )}

            {/* Cart icon — user peserta (SELALU tampil, bukan hidden) */}
            {isAuthenticated && isUser && (
              <Link
                to="/cart"
                id="nav-cart-btn"
                className={`relative tap-target flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                  location.pathname === '/cart' ? 'bg-brand/10 text-brand' : 'hover:bg-gray-100 text-[#111827]'
                }`}
                aria-label={`Keranjang (${itemCount} foto)`}
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[17px] min-h-[17px] leading-none px-0.5 animate-fade-in">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Logout */}
            {isAuthenticated && (
              <button
                id="nav-logout-btn"
                onClick={handleLogout}
                className="tap-target flex items-center justify-center w-10 h-10 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-[#4B5563]"
                aria-label="Keluar"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Hamburger — hanya di halaman publik (belum login) */}
            {!isAuthenticated && (
              <button
                id="nav-menu-toggle"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="tap-target flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen
                  ? <X className="w-5 h-5 text-[#111827]" />
                  : <Menu className="w-5 h-5 text-[#111827]" />
                }
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown — halaman publik */}
        {mobileMenuOpen && !isAuthenticated && (
          <div className="border-t border-[#E5E7EB] bg-white/95 backdrop-blur-md animate-fade-in-up">
            <nav className="px-4 py-3 flex flex-col gap-1">
              <Link
                to="/admin/login"
                id="mobile-admin-link"
                className="flex items-center gap-2.5 px-3 py-3 text-sm text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" />
                Login Admin
              </Link>
              <Link
                to="/photographer/login"
                id="mobile-photographer-link"
                className="flex items-center gap-2.5 px-3 py-3 text-sm text-[#4B5563] hover:text-[#111827] hover:bg-gray-50 rounded-lg transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Aperture className="w-4 h-4" />
                Login Fotografer
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ─── Mobile Bottom Navigation Bar (user peserta saja) ──────── */}
      {isAuthenticated && isUser && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-md border-t border-[#E5E7EB]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Navigasi bawah"
        >
          <div className="flex items-stretch">
            {[
              { to: '/gallery',  label: 'Galeri',  Icon: Home },
              { to: '/orders',   label: 'Pesanan', Icon: ClipboardList },
              {
                to:    '/cart',
                label: 'Keranjang',
                Icon:  ShoppingCart,
                badge: itemCount > 0 ? itemCount : null,
              },
            ].map(({ to, label, Icon, badge }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  id={`bottom-nav-${to.replace('/', '')}`}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-colors ${
                    active ? 'text-brand' : 'text-[#4B5563]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${active ? 'text-brand' : 'text-[#4B5563]'}`} />
                    {badge && (
                      <span className="absolute -top-1 -right-1.5 bg-brand text-white text-[9px] font-bold rounded-full min-w-[15px] min-h-[15px] flex items-center justify-center leading-none px-0.5">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold ${active ? 'text-brand' : 'text-[#4B5563]'}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* Logout di bottom nav */}
            <button
              onClick={handleLogout}
              id="bottom-nav-logout"
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[#4B5563]"
              aria-label="Keluar"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Keluar</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}

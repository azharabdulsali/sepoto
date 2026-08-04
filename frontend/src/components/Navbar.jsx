import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart, LogOut, Menu, X, User,
  ClipboardList, Home, LayoutDashboard, Aperture, ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SepotoLogo from './SepotoLogo';

// ─── Navbar — Mobile-First, Sticky, Glassmorphism ─────────────────────
export default function Navbar() {
  const { currentUser, logout, isAuthenticated, isAdmin, isPhotographer } = useAuth();
  const { itemCount } = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const triggerLogoutConfirm = () => {
    setShowLogoutDialog(true);
  };

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isEventAdmin = currentUser?.role === 'admin';

  const roleLabel = isSuperAdmin ? 'Super Admin' : isEventAdmin ? 'Event Admin' : isPhotographer ? 'Fotografer' : null;
  const roleColor = isSuperAdmin
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : isEventAdmin
    ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
    : isPhotographer
    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    : '';

  const isUser = currentUser?.role === 'user';

  return (
    <>
      {/* ─── Top Navbar ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full glass border-b border-[#E5E7EB]">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between md:h-16">

          {/* Logo */}
          <Link
            to={isAuthenticated ? (isUser ? '/gallery' : isAdmin ? '/admin/dashboard' : '/photographer/dashboard') : '/'}
            className="flex items-center shrink-0 hover:opacity-90 transition-opacity"
            aria-label="Sepoto - Home"
          >
            <SepotoLogo size="md" />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">

            {/* ─── Non-Authenticated (Public Nav Links) ──────────── */}
            {!isAuthenticated && (
              <div className="hidden md:flex items-center gap-1.5">
                <Link
                  to="/login"
                  id="nav-public-user-login"
                  className={`inline-flex flex-row items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/login'
                      ? 'bg-brand/10 text-brand'
                      : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0 text-brand" />
                  <span className="whitespace-nowrap">Peserta Login</span>
                </Link>

                <Link
                  to="/photographer/login"
                  id="nav-public-photographer-login"
                  className={`inline-flex flex-row items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/photographer/login'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-[#4B5563] hover:text-blue-600 hover:bg-blue-50/60'
                  }`}
                >
                  <Aperture className="w-4 h-4 shrink-0 text-blue-600" />
                  <span className="whitespace-nowrap">Fotografer</span>
                </Link>

                <Link
                  to="/admin/login"
                  id="nav-public-admin-login"
                  className={`inline-flex flex-row items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/admin/login'
                      ? 'bg-red-50 text-red-600'
                      : 'text-[#4B5563] hover:text-red-600 hover:bg-red-50/60'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-red-600" />
                  <span className="whitespace-nowrap">Admin</span>
                </Link>
              </div>
            )}

            {/* ─── Authenticated Navigation Controls ───────────── */}
            {/* Role badge (sm+) */}
            {isAuthenticated && roleLabel && (
              <Badge variant="outline" className={`hidden sm:flex items-center px-2.5 py-1 rounded-full text-[10px] font-bib uppercase mr-1 ${roleColor}`}>
                {roleLabel}
              </Badge>
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

            {/* Cart icon — user peserta */}
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
                onClick={triggerLogoutConfirm}
                className="tap-target flex items-center justify-center w-10 h-10 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-[#4B5563]"
                aria-label="Keluar"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}

            {/* Hamburger — di halaman publik (mobile) */}
            {!isAuthenticated && (
              <button
                id="nav-menu-toggle"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="md:hidden tap-target flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
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
          <div className="md:hidden border-t border-[#E5E7EB] bg-white/95 backdrop-blur-md animate-fade-in-up">
            <nav className="px-4 py-3 flex flex-col gap-1.5">
              <Link
                to="/login"
                id="mobile-user-link"
                className="flex items-center justify-between px-3 py-3 text-sm text-[#111827] bg-brand/5 border border-brand/10 rounded-xl font-semibold"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center gap-2 text-brand">
                  <User className="w-4 h-4" />
                  <span>Login Peserta</span>
                </div>
                <ArrowRight className="w-4 h-4 text-brand" />
              </Link>

              <Link
                to="/photographer/login"
                id="mobile-photographer-link"
                className="flex items-center gap-2.5 px-3 py-3 text-sm text-[#4B5563] hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Aperture className="w-4 h-4 text-blue-600" />
                <span>Login Fotografer</span>
              </Link>

              <Link
                to="/admin/login"
                id="mobile-admin-link"
                className="flex items-center gap-2.5 px-3 py-3 text-sm text-[#4B5563] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4 text-red-600" />
                <span>Login Admin</span>
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

            <button
              onClick={triggerLogoutConfirm}
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

      {/* ─── Shadcn UI Alert Dialog Konfirmasi Logout ───────────────────── */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-[#191C21] border border-white/10 text-white rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-500 shrink-0" />
              <span>Konfirmasi Keluar Sesi</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-2">
              {isAdmin ? (
                <>Apakah Anda yakin ingin keluar dari <strong className="text-red-400">Sesi Super Admin</strong> Sepoto?</>
              ) : isPhotographer ? (
                <>Apakah Anda yakin ingin keluar dari <strong className="text-blue-400">Sesi Fotografer</strong> Sepoto?</>
              ) : (
                <>Apakah Anda yakin ingin keluar dari akun <strong className="text-brand font-bib font-bold">Sepoto</strong> Anda?</>
              )}
              <br />
              <span className="text-gray-400 text-xs mt-2 block">
                Anda akan diarahkan kembali ke Halaman Utama / Landing Page.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl text-xs font-bold h-10 mt-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              id="confirm-logout-action-btn"
              onClick={() => {
                logout();
                setShowLogoutDialog(false);
                navigate('/');
              }}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-10 px-5 shadow-md shadow-red-600/30"
            >
              Ya, Keluar Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import React from 'react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';

// ─── AppShell: layout wrapper dengan padding bottom untuk bottom nav ──
export default function AppShell({ children, hideNavbar = false }) {
  const { currentUser } = useAuth();
  const isUser = currentUser?.role === 'user';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!hideNavbar && <Navbar />}
      <main
        className="flex-1 w-full"
        // Padding bawah agar konten tidak tertutup bottom nav bar (hanya user di mobile)
        style={isUser ? { paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' } : undefined}
      >
        {children}
      </main>
    </div>
  );
}

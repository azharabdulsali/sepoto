import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── AuthContext: menyimpan state user yang sedang login ───────────────
// Mendukung 3 role: 'user' | 'photographer' | 'super_admin'

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    // Cek jika ada sesi tersimpan di localStorage
    const saved = localStorage.getItem('sepoto_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login: simpan data user + token ke state + localStorage
  const login = useCallback((userData, token = null) => {
    const user = {
      id:       userData.id ?? null,
      name:     userData.name,
      bibNumber: userData.bibNumber ?? userData.bib_number ?? null,
      role:     userData.role, // 'user' | 'photographer' | 'super_admin'
      eventId:  userData.eventId ?? userData.event_id ?? null,
    };
    setCurrentUser(user);
    localStorage.setItem('sepoto_user', JSON.stringify(user));

    // Simpan JWT token jika ada
    if (token) {
      localStorage.setItem('sepoto_token', token);
    }
  }, []);

  // Logout: bersihkan state + localStorage (user, token, cart)
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('sepoto_user');
    localStorage.removeItem('sepoto_token');
    localStorage.removeItem('sepoto_cart');
  }, []);

  const isAuthenticated = Boolean(currentUser);
  const isAdmin        = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const isSuperAdmin   = currentUser?.role === 'super_admin';
  const isEventAdmin   = currentUser?.role === 'admin';
  const isPhotographer = currentUser?.role === 'photographer';
  const isUser         = currentUser?.role === 'user';

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      isEventAdmin,
      isPhotographer,
      isUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook kustom
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
};

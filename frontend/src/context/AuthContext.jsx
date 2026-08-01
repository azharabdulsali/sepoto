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

  // Login: simpan data user ke state + localStorage
  const login = useCallback((userData) => {
    const user = {
      id:       userData.id ?? null,
      name:     userData.name,
      bibNumber: userData.bibNumber ?? null,
      role:     userData.role, // 'user' | 'photographer' | 'super_admin'
      eventId:  userData.eventId ?? null,
    };
    setCurrentUser(user);
    localStorage.setItem('sepoto_user', JSON.stringify(user));
  }, []);

  // Logout: bersihkan state + localStorage
  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('sepoto_user');
    localStorage.removeItem('sepoto_cart');
  }, []);

  const isAuthenticated = Boolean(currentUser);
  const isAdmin        = currentUser?.role === 'super_admin';
  const isPhotographer = currentUser?.role === 'photographer';
  const isUser         = currentUser?.role === 'user';

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      isAuthenticated,
      isAdmin,
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

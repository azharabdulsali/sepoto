import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

// ─── CartContext: kelola keranjang foto ────────────────────────────────
// Cart disimpan per-user di localStorage (key: sepoto_cart_{userId})
// sehingga cart tetap ada setelah logout & login kembali dengan akun yang sama.

const CartContext = createContext(null);

const getCartKey = (userId) => (userId ? `sepoto_cart_${userId}` : null);

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const prevUserIdRef = useRef(currentUser?.id ?? null);

  // Hydrate cart dari localStorage untuk user yang sedang login
  const loadCartForUser = (userId) => {
    const key = getCartKey(userId);
    if (!key) return [];
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [items, setItems] = useState(() => loadCartForUser(currentUser?.id));

  // Simpan ke localStorage setiap kali items berubah (per-user key)
  const saveToStorage = useCallback((newItems, userId) => {
    const key = getCartKey(userId ?? currentUser?.id);
    if (key) {
      localStorage.setItem(key, JSON.stringify(newItems));
    }
  }, [currentUser?.id]);

  // Kosongkan cart (setelah checkout selesai)
  const clearCart = useCallback(() => {
    setItems([]);
    const key = getCartKey(currentUser?.id);
    if (key) localStorage.removeItem(key);
  }, [currentUser?.id]);

  // Deteksi pergantian user:
  // - Jika user BERBEDA login → kosongkan cart dan load cart milik user baru
  // - Jika user SAMA login kembali → load cart-nya dari localStorage
  useEffect(() => {
    const currentId = currentUser?.id ?? null;
    const prevId = prevUserIdRef.current;

    if (currentId !== prevId) {
      // User berganti atau logout/login — load cart milik user baru (atau array kosong jika logout)
      const newItems = loadCartForUser(currentId);
      setItems(newItems);
      prevUserIdRef.current = currentId;
    }
  }, [currentUser]);

  // Sync: hapus foto yang sudah di-approve dari cart secara otomatis
  const syncApprovedPhotos = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'user') return;
    try {
      const res = await api.getUserTransactions();
      if (res.success && Array.isArray(res.transactions)) {
        const approvedPhotoIds = new Set();
        res.transactions.forEach((tx) => {
          if (tx.status === 'approved' && Array.isArray(tx.items)) {
            tx.items.forEach((item) => {
              if (item.photoId) approvedPhotoIds.add(item.photoId);
            });
          }
        });

        if (approvedPhotoIds.size > 0) {
          setItems((prev) => {
            const updated = prev.filter((item) => !approvedPhotoIds.has(item.id));
            if (updated.length !== prev.length) {
              saveToStorage(updated);
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.error('Failed to sync approved photos with cart:', err);
    }
  }, [currentUser, saveToStorage]);

  useEffect(() => {
    if (currentUser?.role === 'user') {
      syncApprovedPhotos();
    }
  }, [currentUser, syncApprovedPhotos]);

  // Tambah foto ke cart (cegah duplikat)
  const addItem = useCallback((photo) => {
    setItems((prev) => {
      if (prev.find((item) => item.id === photo.id)) return prev;
      const updated = [...prev, photo];
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Hapus foto dari cart berdasarkan ID
  const removeItem = useCallback((photoId) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== photoId);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Cek apakah foto sudah ada di cart
  const isInCart = useCallback(
    (photoId) => items.some((item) => item.id === photoId),
    [items]
  );

  // Hitung total harga
  const totalPrice = items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  // Format total sebagai Rupiah
  const formattedTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(totalPrice);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      isInCart,
      clearCart,
      syncApprovedPhotos,
      totalPrice,
      formattedTotal,
      itemCount: items.length,
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook kustom
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart harus digunakan di dalam CartProvider');
  return ctx;
};

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

// ─── CartContext: kelola keranjang foto ────────────────────────────────
// Menyimpan array foto yang dipilih user untuk dibeli

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'sepoto_cart';

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const prevUserIdRef = useRef(currentUser?.id);

  const [items, setItems] = useState(() => {
    // Hydrate dari localStorage agar cart persist saat refresh (hanya jika ada user login)
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    const savedUser = localStorage.getItem('sepoto_user');
    return (saved && savedUser) ? JSON.parse(saved) : [];
  });

  // Simpan ke localStorage setiap kali items berubah
  const saveToStorage = (newItems) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
  };

  // Kosongkan cart (setelah checkout selesai / logout)
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // 1. Apabila user logout (currentUser null) atau berganti user: Kosongkan cart secara instan!
  useEffect(() => {
    const currentId = currentUser?.id ?? null;
    if (!currentId || currentId !== prevUserIdRef.current) {
      clearCart();
    }
    prevUserIdRef.current = currentId;
  }, [currentUser, clearCart]);

  // 2. Apabila user memiliki transaksi yang SUDAH DISETUJUI (approved), hapus foto tersebut dari cart secara otomatis
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
  }, [currentUser]);

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
  }, []);

  // Hapus foto dari cart berdasarkan ID
  const removeItem = useCallback((photoId) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== photoId);
      saveToStorage(updated);
      return updated;
    });
  }, []);

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

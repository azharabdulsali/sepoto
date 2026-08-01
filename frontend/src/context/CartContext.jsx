import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── CartContext: kelola keranjang foto ────────────────────────────────
// Menyimpan array foto yang dipilih user untuk dibeli

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'sepoto_cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    // Hydrate dari localStorage agar cart persist saat refresh
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Simpan ke localStorage setiap kali items berubah
  const saveToStorage = (newItems) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
  };

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

  // Kosongkan cart (setelah checkout selesai)
  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

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

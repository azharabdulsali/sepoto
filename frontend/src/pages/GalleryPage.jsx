import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, ShoppingCart, X, Check, Camera } from 'lucide-react';

import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// ─── Data dummy foto untuk demo UI ────────────────────────────────────
const DUMMY_PHOTOS = Array.from({ length: 18 }, (_, i) => ({
  id:            i + 1,
  watermarkedUrl: `https://picsum.photos/seed/sepoto${i + 1}/400/500`,
  price:         i % 3 === 0 ? 25000 : i % 3 === 1 ? 35000 : 15000,
  bibTags:       i % 4 === 0 ? String(100 + (i % 10)) : null,
  photographerName: i % 2 === 0 ? 'Reza Foto' : 'Dian Lens',
}));

// Format harga Rupiah
const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

// ─── PhotoCard ─────────────────────────────────────────────────────────
const PhotoCard = ({ photo }) => {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = isInCart(photo.id);

  return (
    <div className="group relative bg-[#191C21] rounded-xl overflow-hidden border border-white/5 hover:border-brand/30 transition-all duration-200 hover:shadow-lg hover:shadow-orange-900/10">
      {/* Foto */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#22262E]">
        <img
          src={photo.watermarkedUrl}
          alt={`Foto event BIB ${photo.bibTags ?? 'umum'}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* BIB tag overlay */}
        {photo.bibTags && (
          <div className="absolute top-2 left-2">
            <span className="font-bib text-[10px] bg-brand text-white px-2 py-0.5 rounded-full shadow-md">
              #{photo.bibTags}
            </span>
          </div>
        )}

        {/* Cart toggle overlay — muncul saat hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            id={`cart-toggle-${photo.id}`}
            onClick={() => inCart ? removeItem(photo.id) : addItem(photo)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all active:scale-95 shadow-lg ${
              inCart
                ? 'bg-white text-[#111827] hover:bg-red-50 hover:text-red-500'
                : 'bg-brand text-white hover:bg-[#C2410C]'
            }`}
            aria-label={inCart ? 'Hapus dari keranjang' : 'Tambah ke keranjang'}
          >
            {inCart ? (
              <><Check className="w-3.5 h-3.5" /><span>Ditambahkan</span></>
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5" /><span>Tambah</span></>
            )}
          </button>
        </div>
      </div>

      {/* Info bawah */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-gray-500 truncate">{photo.photographerName}</span>
        <span className="font-bib text-xs text-brand font-semibold">{formatRupiah(photo.price)}</span>
      </div>

      {/* Indikator sudah di cart */}
      {inCart && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-brand rounded-full flex items-center justify-center shadow-md animate-fade-in">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

// ─── Gallery Page ──────────────────────────────────────────────────────
export default function GalleryPage() {
  const { currentUser } = useAuth();
  const { items, formattedTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();

  const [searchBib, setSearchBib] = useState('');
  const [showCartBar, setShowCartBar] = useState(false);

  // Auto-filter: jika user peserta, tampilkan foto BIB mereka dulu
  const filteredPhotos = useMemo(() => {
    const bib = searchBib.trim().toLowerCase();
    if (!bib) {
      // Tanpa filter: tampilkan semua, tapi foto BIB user ada di atas
      if (currentUser?.bibNumber) {
        const userBib = String(currentUser.bibNumber);
        const myPhotos    = DUMMY_PHOTOS.filter((p) => p.bibTags === userBib);
        const otherPhotos = DUMMY_PHOTOS.filter((p) => p.bibTags !== userBib);
        return [...myPhotos, ...otherPhotos];
      }
      return DUMMY_PHOTOS;
    }
    return DUMMY_PHOTOS.filter((p) =>
      p.bibTags?.toLowerCase().includes(bib)
    );
  }, [searchBib, currentUser]);

  return (
    <AppShell>
      <div className="max-w-screen-xl mx-auto px-4 pb-40">

        {/* ─── Header Galeri ───────────────────────────── */}
        <div className="py-6 md:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-[#111827] tracking-tight">
                Galeri Foto Event
              </h1>
              {currentUser?.name && (
                <p className="text-sm text-[#4B5563] mt-1">
                  Selamat datang,{' '}
                  <span className="font-medium text-[#111827]">{currentUser.name}</span>
                  {currentUser.bibNumber && (
                    <> · BIB <span className="font-bib text-brand">#{currentUser.bibNumber}</span></>
                  )}
                </p>
              )}
            </div>
            {/* Total foto */}
            <div className="text-right shrink-0">
              <p className="text-2xl font-semibold text-[#111827]">{DUMMY_PHOTOS.length}</p>
              <p className="text-xs text-[#4B5563]">foto tersedia</p>
            </div>
          </div>
        </div>

        {/* ─── Search & Filter bar ─────────────────────── */}
        <div className="sticky top-14 md:top-16 z-40 bg-white/90 backdrop-blur-md py-3 -mx-4 px-4 border-b border-[#E5E7EB] mb-4">
          <div className="flex gap-2">
            {/* Search BIB */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563] pointer-events-none" />
              <input
                id="gallery-search-bib"
                type="text"
                inputMode="numeric"
                value={searchBib}
                onChange={(e) => setSearchBib(e.target.value)}
                placeholder="Cari Nomor BIB..."
                className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] font-bib focus:outline-none focus:border-brand/50 transition-colors"
              />
              {searchBib && (
                <button
                  onClick={() => setSearchBib('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#111827]"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter button (placeholder — akan dikembangkan) */}
            <button
              id="gallery-filter-btn"
              className="tap-target flex items-center gap-1.5 px-3.5 py-2.5 border border-[#E5E7EB] rounded-xl text-sm text-[#4B5563] hover:border-brand/40 hover:text-brand transition-all bg-white"
              aria-label="Filter foto"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </button>
          </div>

          {/* Result count jika sedang search */}
          {searchBib && (
            <p className="text-xs text-[#4B5563] mt-2 animate-fade-in">
              {filteredPhotos.length > 0
                ? `${filteredPhotos.length} foto ditemukan untuk BIB "${searchBib}"`
                : `Tidak ada foto dengan BIB "${searchBib}"`}
            </p>
          )}
        </div>

        {/* ─── My Photos section ───────────────────────── */}
        {!searchBib && currentUser?.bibNumber && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-semibold text-[#111827]">Foto Anda (BIB #{currentUser.bibNumber})</h2>
              <span className="text-[10px] font-bib bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                {DUMMY_PHOTOS.filter((p) => p.bibTags === String(currentUser.bibNumber)).length} foto
              </span>
            </div>
            {DUMMY_PHOTOS.filter((p) => p.bibTags === String(currentUser.bibNumber)).length === 0 && (
              <p className="text-sm text-[#4B5563] bg-gray-50 border border-[#E5E7EB] rounded-xl px-4 py-3">
                Belum ada foto yang ditag dengan BIB #{currentUser.bibNumber}. Fotografer masih mungkin mengunggah foto Anda.
              </p>
            )}
          </div>
        )}

        {/* ─── Photo Grid (Mobile-First: 2 col → 3 col → 4-5 col) ─── */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
            {filteredPhotos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <Camera className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-[#111827] font-medium">Foto tidak ditemukan</p>
            <p className="text-sm text-[#4B5563] mt-1">Coba kata kunci BIB yang berbeda</p>
          </div>
        )}
      </div>

      {/* ─── Sticky Cart Bar (di atas bottom nav mobile) ─────────────── */}
      {itemCount > 0 && (
        <div
          className="fixed left-0 right-0 z-40 px-4 pb-2 animate-fade-in-up"
          style={{
            // Di mobile: di atas bottom nav (64px) + safe area
            // Di sm+: langsung dari bottom
            bottom: 'calc(64px + env(safe-area-inset-bottom))',
          }}
        >
          <div className="max-w-lg mx-auto sm:hidden">
            {/* Compact di mobile */}
            <div className="bg-[#191C21] rounded-2xl border border-white/10 shadow-2xl shadow-black/40 px-4 py-3 flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{itemCount} foto · <span className="text-brand">{formattedTotal}</span></p>
              </div>
              <button
                id="cart-clear-btn-mobile"
                onClick={clearCart}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:text-red-400 transition-all shrink-0"
                aria-label="Kosongkan keranjang"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                id="cart-checkout-btn-mobile"
                onClick={() => navigate('/cart')}
                className="flex items-center gap-1.5 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm px-4 py-2 rounded-xl transition-all active:scale-[0.97] shrink-0"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Checkout</span>
              </button>
            </div>
          </div>

          {/* Desktop: lebih besar */}
          <div className="hidden sm:block max-w-lg mx-auto" style={{ bottom: 0 }}>
            <div className="bg-[#191C21] rounded-2xl border border-white/10 shadow-2xl shadow-black/30 p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">{itemCount} foto dipilih</p>
                <p className="text-brand font-bib text-xs mt-0.5">{formattedTotal}</p>
              </div>
              <button
                id="cart-clear-btn"
                onClick={clearCart}
                className="tap-target w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all"
                aria-label="Kosongkan keranjang"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                id="cart-checkout-btn"
                onClick={() => navigate('/cart')}
                className="tap-target flex items-center gap-2 bg-brand hover:bg-[#C2410C] text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Checkout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

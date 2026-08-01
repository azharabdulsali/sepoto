import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ShoppingCart, X, Check, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const DUMMY_PHOTOS = [
  { id: 1,  watermarkedUrl: 'https://picsum.photos/seed/sepoto1/400/500',  price: 25000, bibTags: '101',  photographerName: 'Reza Foto' },
  { id: 2,  watermarkedUrl: 'https://picsum.photos/seed/sepoto2/400/500',  price: 35000, bibTags: null,   photographerName: 'Dian Lens' },
  { id: 3,  watermarkedUrl: 'https://picsum.photos/seed/sepoto3/400/500',  price: 0,     bibTags: '102',  photographerName: 'Reza Foto' },
  { id: 4,  watermarkedUrl: 'https://picsum.photos/seed/sepoto4/400/500',  price: 25000, bibTags: '101',  photographerName: 'Dian Lens' },
  { id: 5,  watermarkedUrl: 'https://picsum.photos/seed/sepoto5/400/500',  price: 20000, bibTags: '',     photographerName: 'Reza Foto' },
  { id: 6,  watermarkedUrl: 'https://picsum.photos/seed/sepoto6/400/500',  price: 30000, bibTags: '205',  photographerName: 'Dian Lens' },
  { id: 7,  watermarkedUrl: 'https://picsum.photos/seed/sepoto7/400/500',  price: 0,     bibTags: null,   photographerName: 'Reza Foto' },
  { id: 8,  watermarkedUrl: 'https://picsum.photos/seed/sepoto8/400/500',  price: 25000, bibTags: '101',  photographerName: 'Reza Foto' },
  { id: 9,  watermarkedUrl: 'https://picsum.photos/seed/sepoto9/400/500',  price: 35000, bibTags: null,   photographerName: 'Dian Lens' },
  { id: 10, watermarkedUrl: 'https://picsum.photos/seed/sepoto10/400/500', price: 15000, bibTags: '312',  photographerName: 'Reza Foto' },
  { id: 11, watermarkedUrl: 'https://picsum.photos/seed/sepoto11/400/500', price: 25000, bibTags: null,   photographerName: 'Dian Lens' },
  { id: 12, watermarkedUrl: 'https://picsum.photos/seed/sepoto12/400/500', price: 25000, bibTags: '101',  photographerName: 'Reza Foto' },
];

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const PhotoCard = ({ photo }) => {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = isInCart(photo.id);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="group relative bg-[#191C21] rounded-2xl overflow-hidden border border-white/5 hover:border-brand/40 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-orange-900/20"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#22262E]">
        <img
          src={photo.watermarkedUrl}
          alt={`Foto event ${photo.bibTags ? `BIB ${photo.bibTags}` : 'Umum'}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {photo.bibTags && (
          <div className="absolute top-2.5 left-2.5">
            <Badge className="font-bib text-[10px] bg-brand text-white border-0 shadow-md px-2 py-0.5">
              #{photo.bibTags}
            </Badge>
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              id={`cart-toggle-${photo.id}`}
              onClick={() => inCart ? removeItem(photo.id) : addItem(photo)}
              size="sm"
              className={`rounded-full transition-all active:scale-95 shadow-xl font-bold ${
                inCart
                  ? 'bg-white text-[#111827] hover:bg-red-50 hover:text-red-500'
                  : 'bg-brand text-white hover:bg-[#C2410C]'
              }`}
              aria-label={inCart ? 'Hapus dari keranjang' : 'Tambah ke keranjang'}
            >
              {inCart ? (
                <><Check className="w-3.5 h-3.5 mr-1 text-green-600" /><span>Ditambahkan</span></>
              ) : (
                <><ShoppingCart className="w-3.5 h-3.5 mr-1" /><span>Tambah ke Cart</span></>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="px-3.5 py-3 flex items-center justify-between bg-[#191C21]">
        <span className="text-[11px] text-gray-400 truncate">{photo.photographerName}</span>
        <span className="font-bib text-xs text-brand font-bold">{formatRupiah(photo.price)}</span>
      </div>

      {inCart && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2.5 right-2.5 w-6 h-6 bg-brand rounded-full flex items-center justify-center shadow-lg"
        >
          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default function GalleryPage() {
  const { currentUser } = useAuth();
  const { formattedTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();

  const [searchBib, setSearchBib] = useState('');

  const pricedPhotos = useMemo(() => {
    return DUMMY_PHOTOS.filter((p) => p.price != null && Number(p.price) > 0);
  }, []);

  const filteredPhotos = useMemo(() => {
    const bib = searchBib.trim().toLowerCase();

    if (!bib) {
      if (currentUser?.bibNumber) {
        const userBib = String(currentUser.bibNumber);
        const myPhotos    = pricedPhotos.filter((p) => p.bibTags === userBib);
        const otherPhotos = pricedPhotos.filter((p) => p.bibTags !== userBib);
        return [...myPhotos, ...otherPhotos];
      }
      return pricedPhotos;
    }

    return pricedPhotos.filter((p) =>
      p.bibTags ? p.bibTags.toLowerCase().includes(bib) : false
    );
  }, [searchBib, currentUser, pricedPhotos]);

  const userPhotoCount = useMemo(() => {
    if (!currentUser?.bibNumber) return 0;
    return pricedPhotos.filter((p) => p.bibTags === String(currentUser.bibNumber)).length;
  }, [currentUser, pricedPhotos]);

  return (
    <AppShell>
      <div className="max-w-screen-xl mx-auto px-4 pb-40">

        {/* Header Galeri */}
        <div className="py-6 md:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">
                Galeri Foto Event
              </h1>
              {currentUser?.name && (
                <p className="text-sm text-[#4B5563] mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Selamat datang,</span>
                  <span className="font-semibold text-[#111827]">{currentUser.name}</span>
                  {currentUser.bibNumber && (
                    <Badge variant="outline" className="font-bib text-brand border-brand/20 bg-brand/10 px-2 py-0.5">
                      BIB #{currentUser.bibNumber}
                    </Badge>
                  )}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 bg-white border border-[#E5E7EB] rounded-2xl px-4 py-2 shadow-sm">
              <p className="text-2xl font-bold text-[#111827] font-bib">{pricedPhotos.length}</p>
              <p className="text-[11px] text-[#4B5563]">foto dijual</p>
            </div>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div className="sticky top-14 md:top-16 z-40 bg-white/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-[#E5E7EB] mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563] pointer-events-none z-10" />
              <Input
                id="gallery-search-bib"
                type="text"
                inputMode="numeric"
                value={searchBib}
                onChange={(e) => setSearchBib(e.target.value)}
                placeholder="Cari Nomor BIB (misal: 101)..."
                className="pl-10 pr-8 h-11 bg-white border-[#E5E7EB] rounded-xl text-sm font-bib text-[#111827] focus-visible:border-brand/50 focus-visible:ring-brand/20"
              />
              {searchBib && (
                <button
                  onClick={() => setSearchBib('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563] hover:text-[#111827]"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Button
              id="gallery-filter-btn"
              variant="outline"
              size="default"
              className="h-11 border-[#E5E7EB] rounded-xl text-[#4B5563] hover:border-brand/40 hover:text-brand bg-white font-semibold"
              aria-label="Filter foto"
            >
              <SlidersHorizontal className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
          </div>

          {searchBib && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-[#4B5563] mt-2 font-medium"
            >
              {filteredPhotos.length > 0
                ? `${filteredPhotos.length} foto ditemukan untuk BIB "${searchBib}"`
                : `Tidak ada foto dengan BIB "${searchBib}"`}
            </motion.p>
          )}
        </div>

        {/* My Photos section badge */}
        {!searchBib && currentUser?.bibNumber && userPhotoCount > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Camera className="w-4 h-4 text-brand" />
              <h2 className="text-sm font-bold text-[#111827]">Foto Anda (BIB #{currentUser.bibNumber})</h2>
              <Badge variant="secondary" className="font-bib bg-brand/10 text-brand text-[10px] px-2 py-0.5">
                {userPhotoCount} foto
              </Badge>
            </div>
          </div>
        )}

        {/* Grid Foto dengan Framer Motion Stagger */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        >
          {filteredPhotos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} />
          ))}
        </motion.div>

        {/* Empty state */}
        {filteredPhotos.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-bold text-[#111827]">Foto Tidak Ditemukan</p>
            <p className="text-sm text-[#4B5563] mt-1">Coba kata kunci BIB yang berbeda atau hapus filter pencarian.</p>
          </div>
        )}
      </div>

      {/* Sticky Cart Bar (Framer Motion AnimatePresence) */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed left-0 right-0 z-40 px-4 pb-2"
            style={{
              bottom: 'calc(64px + env(safe-area-inset-bottom))',
            }}
          >
            {/* Mobile */}
            <div className="max-w-lg mx-auto sm:hidden">
              <div className="bg-[#191C21]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/40 px-4 py-3 flex items-center gap-2.5 text-white">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{itemCount} foto · <span className="text-brand font-bold">{formattedTotal}</span></p>
                </div>
                <Button
                  id="cart-clear-btn-mobile"
                  onClick={clearCart}
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 border border-white/10 text-gray-400 hover:text-red-400 shrink-0 rounded-xl"
                  aria-label="Kosongkan keranjang"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    id="cart-checkout-btn-mobile"
                    onClick={() => navigate('/cart')}
                    className="bg-brand hover:bg-[#C2410C] text-white font-bold text-sm px-4 h-9 rounded-xl shrink-0 shadow-lg shadow-orange-600/30"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    <span>Checkout</span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:block max-w-lg mx-auto" style={{ bottom: 0 }}>
              <div className="bg-[#191C21]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/30 p-4 flex items-center gap-3 text-white">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{itemCount} foto dipilih</p>
                  <p className="text-brand font-bib text-sm font-bold">{formattedTotal}</p>
                </div>
                <Button
                  id="cart-clear-btn"
                  onClick={clearCart}
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 border border-white/10 text-gray-400 hover:text-red-400 rounded-xl"
                  aria-label="Kosongkan keranjang"
                >
                  <X className="w-4 h-4" />
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    id="cart-checkout-btn"
                    onClick={() => navigate('/cart')}
                    className="bg-brand hover:bg-[#C2410C] text-white font-bold text-sm px-6 h-11 rounded-xl shadow-xl shadow-orange-600/30"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    <span>Checkout Sekarang</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

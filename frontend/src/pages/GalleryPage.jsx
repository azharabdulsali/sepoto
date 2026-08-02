import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, ShoppingCart, X, Check, Camera, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AppShell from '../components/AppShell';
import ProtectedPhoto from '../components/ProtectedPhoto';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

const _DUMMY_PHOTOS = [
  { id: 1,  watermarkedUrl: 'https://picsum.photos/seed/sepoto1/600/400',  orientation: 'landscape', price: 25000, bibTags: '101',  photographerName: 'Reza Foto' },
  { id: 2,  watermarkedUrl: 'https://picsum.photos/seed/sepoto2/400/500',  orientation: 'portrait',  price: 35000, bibTags: null,   photographerName: 'Dian Lens' },
  { id: 3,  watermarkedUrl: 'https://picsum.photos/seed/sepoto3/600/400',  orientation: 'landscape', price: 0,     bibTags: '102',  photographerName: 'Reza Foto' },
  { id: 4,  watermarkedUrl: 'https://picsum.photos/seed/sepoto4/400/500',  orientation: 'portrait',  price: 25000, bibTags: '101',  photographerName: 'Dian Lens' },
  { id: 5,  watermarkedUrl: 'https://picsum.photos/seed/sepoto5/600/400',  orientation: 'landscape', price: 20000, bibTags: '',     photographerName: 'Reza Foto' },
  { id: 6,  watermarkedUrl: 'https://picsum.photos/seed/sepoto6/400/500',  orientation: 'portrait',  price: 30000, bibTags: '205',  photographerName: 'Dian Lens' },
  { id: 7,  watermarkedUrl: 'https://picsum.photos/seed/sepoto7/600/400',  orientation: 'landscape', price: 0,     bibTags: null,   photographerName: 'Reza Foto' },
  { id: 8,  watermarkedUrl: 'https://picsum.photos/seed/sepoto8/400/500',  orientation: 'portrait',  price: 25000, bibTags: '101',  photographerName: 'Reza Foto' },
  { id: 9,  watermarkedUrl: 'https://picsum.photos/seed/sepoto9/600/400',  orientation: 'landscape', price: 35000, bibTags: null,   photographerName: 'Dian Lens' },
  { id: 10, watermarkedUrl: 'https://picsum.photos/seed/sepoto10/400/500', orientation: 'portrait',  price: 15000, bibTags: '312',  photographerName: 'Reza Foto' },
  { id: 11, watermarkedUrl: 'https://picsum.photos/seed/sepoto11/600/400', orientation: 'landscape', price: 25000, bibTags: null,   photographerName: 'Dian Lens' },
  { id: 12, watermarkedUrl: 'https://picsum.photos/seed/sepoto12/400/500', orientation: 'portrait',  price: 25000, bibTags: '101',  photographerName: 'Reza Foto' },
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

const PhotoCard = ({ photo, onPreview }) => {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = isInCart(photo.id);
  const [loaded, setLoaded] = useState(false);

  const handleCartClick = (e) => {
    e.stopPropagation(); // Mencegah membuka modal preview saat tombol cart diklik
    if (inCart) {
      removeItem(photo.id);
    } else {
      addItem(photo);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => onPreview(photo)}
      className="group relative bg-[#191C21] rounded-2xl overflow-hidden border border-white/5 hover:border-brand/40 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-orange-900/20 cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#22262E]">
        {!loaded && (
          <Skeleton className="absolute inset-0 w-full h-full bg-white/5 animate-pulse rounded-2xl z-0" />
        )}
        <ProtectedPhoto
          src={photo.watermarkedUrl}
          alt={`Foto event ${photo.bibTags ? `BIB ${photo.bibTags}` : 'Umum'}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {photo.bibTags && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge className="font-bib text-[10px] bg-brand text-white border-0 shadow-md px-2 py-0.5">
              #{photo.bibTags}
            </Badge>
          </div>
        )}

        {/* Eye Preview Hint Badge di pojok kanan atas */}
        <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Hover Overlay Desktop */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3 text-center">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              id={`cart-toggle-${photo.id}`}
              onClick={handleCartClick}
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
          <span className="text-[10px] text-gray-300 font-medium hidden sm:inline">Klik foto untuk Pratinjau / Zoom</span>
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
          className="absolute top-2.5 right-2.5 z-10 w-6 h-6 bg-brand rounded-full flex items-center justify-center shadow-lg"
        >
          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
        </motion.div>
      )}
    </motion.div>
  );
};

// ─── Component Skeleton Loading Grid ─────────────────────────────────────
function GallerySkeletonGrid({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#191C21] rounded-2xl overflow-hidden border border-white/5 p-0 space-y-3 shadow-sm">
          <Skeleton className="aspect-[4/5] w-full bg-[#22262E] rounded-2xl animate-pulse" />
          <div className="px-3.5 pb-3 flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-24 bg-white/10 rounded-md" />
            <Skeleton className="h-4 w-12 bg-brand/20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Lightbox Modal Preview Foto (Mobile & Desktop Responsive) ───────────
function PhotoPreviewModal({ photo, onClose }) {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = photo ? isInCart(photo.id) : false;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-[#191C21] rounded-3xl overflow-hidden border border-white/10 shadow-2xl text-white flex flex-col max-h-[90vh]"
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Camera className="w-4 h-4 text-brand" />
            <span className="text-sm font-bold truncate max-w-[180px] sm:max-w-xs">{photo.photographerName}</span>
            {photo.bibTags && (
              <Badge className="font-bib text-[10px] bg-brand text-white border-0 px-2 py-0.5">
                BIB #{photo.bibTags}
              </Badge>
            )}
            {photo.orientation && (
              <Badge variant="outline" className="font-bib text-[9px] bg-white/10 text-white border-white/20 uppercase px-1.5 py-0.5">
                {photo.orientation}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Tutup pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Image Container */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] max-h-[60vh] p-2">
          <ProtectedPhoto
            src={photo.watermarkedUrl}
            alt={`Preview Foto ${photo.bibTags ? `BIB ${photo.bibTags}` : ''}`}
            className="w-full h-full max-h-[58vh] flex items-center justify-center"
            imgClassName="w-full h-full object-contain max-h-[58vh] rounded-xl select-none"
          />
        </div>

        {/* Footer / Mobile Action Bar */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#191C21] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bib uppercase tracking-widest text-gray-400">Harga Foto HD</p>
            <p className="font-bib text-xl font-bold text-brand">{formatRupiah(photo.price)}</p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              id={`modal-cart-toggle-${photo.id}`}
              onClick={() => inCart ? removeItem(photo.id) : addItem(photo)}
              className={`flex-1 sm:flex-none h-12 px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-lg transition-all ${
                inCart
                  ? 'bg-white text-[#111827] hover:bg-red-50 hover:text-red-500'
                  : 'bg-brand hover:bg-[#C2410C] text-white shadow-orange-600/30'
              }`}
            >
              {inCart ? (
                <><Check className="w-4 h-4 mr-2 text-green-600" /><span>Sudah Ada di Keranjang</span></>
              ) : (
                <><ShoppingCart className="w-4 h-4 mr-2" /><span>Tambah ke Keranjang</span></>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              className="h-12 px-4 rounded-2xl border-white/20 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-bold shrink-0"
            >
              Tutup
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GalleryPage() {
  const { currentUser } = useAuth();
  const { formattedTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();

  const PAGE_SIZE = 10;
  const [searchBib, setSearchBib]           = useState('');
  const [previewPhoto, setPreviewPhoto]     = useState(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [visibleLimit, setVisibleLimit]     = useState(PAGE_SIZE);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [realPhotos, setRealPhotos]         = useState([]);
  const [activeEvent, setActiveEvent]       = useState(null);

  // Ambil event aktif & foto galeri dari backend API
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setVisibleLimit(PAGE_SIZE);
      try {
        const [eventRes, photoRes] = await Promise.all([
          api.getActiveEvent(),
          api.getPhotos(searchBib),
        ]);
        if (isMounted) {
          if (eventRes.success && eventRes.event) setActiveEvent(eventRes.event);
          if (photoRes.success && photoRes.photos && photoRes.photos.length > 0) {
            setRealPhotos(photoRes.photos);
          } else {
            setRealPhotos([]);
          }
        }
      } catch (err) {
        console.error('Gallery fetch error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [searchBib]);

  const pricedPhotos = useMemo(() => {
    return realPhotos.filter((p) => p.price != null && Number(p.price) > 0);
  }, [realPhotos]);

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

  const displayedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleLimit);
  }, [filteredPhotos, visibleLimit]);

  const userPhotoCount = useMemo(() => {
    if (!currentUser?.bibNumber) return 0;
    return pricedPhotos.filter((p) => p.bibTags === String(currentUser.bibNumber)).length;
  }, [currentUser, pricedPhotos]);

  const handleLoadMore = () => {
    setIsBatchLoading(true);
    setTimeout(() => {
      setVisibleLimit((prev) => prev + PAGE_SIZE);
      setIsBatchLoading(false);
    }, 400);
  };

  return (
    <AppShell>
      <div className="max-w-screen-xl mx-auto px-4 pb-40">

        {/* Header Galeri */}
        <div className="py-6 md:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">
                {activeEvent?.title || 'Galeri Foto Event'}
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

        {/* Grid Foto dengan Skeleton State & Incremental Batching */}
        {isLoading ? (
          <GallerySkeletonGrid count={10} />
        ) : displayedPhotos.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-[#E5E7EB] rounded-3xl shadow-xs my-6">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#111827]">Belum Ada Foto Galeri</h3>
            <p className="text-xs text-[#4B5563] mt-1 max-w-md mx-auto leading-relaxed">
              {searchBib
                ? `Tidak ditemukan foto untuk Nomor BIB #${searchBib}. Pastikan nomor BIB sesuai.`
                : 'Belum ada foto yang diunggah oleh fotografer untuk event ini.'}
            </p>
          </Card>
        ) : (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.05 } },
              }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
            >
              {displayedPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} onPreview={(p) => setPreviewPhoto(p)} />
              ))}
            </motion.div>

            {/* Skeleton Loading Batch Tambahan saat Load More */}
            {isBatchLoading && (
              <div className="mt-4">
                <GallerySkeletonGrid count={5} />
              </div>
            )}

            {/* Tombol Load More untuk Meringankan Aplikasi */}
            {visibleLimit < filteredPhotos.length && (
              <div className="mt-8 text-center">
                <Button
                  id="load-more-photos-btn"
                  onClick={handleLoadMore}
                  disabled={isBatchLoading}
                  variant="outline"
                  className="h-11 px-8 rounded-2xl border-[#E5E7EB] hover:border-brand/40 text-xs font-bold text-[#111827] bg-white shadow-sm"
                >
                  {isBatchLoading ? (
                    <span className="flex items-center gap-2">
                      <Skeleton className="w-3.5 h-3.5 rounded-full bg-brand animate-ping" />
                      <span>Memuat Foto Berikutnya...</span>
                    </span>
                  ) : (
                    `Tampilkan Lebih Banyak Foto (${filteredPhotos.length - visibleLimit} Tersisa)`
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {filteredPhotos.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-base font-bold text-[#111827]">Foto Tidak Ditemukan</p>
            <p className="text-sm text-[#4B5563] mt-1">Coba kata kunci BIB yang berbeda atau hapus filter pencarian.</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal Preview (Jika foto dipilih) */}
      <AnimatePresence>
        {previewPhoto && (
          <PhotoPreviewModal photo={previewPhoto} onClose={() => setPreviewPhoto(null)} />
        )}
      </AnimatePresence>

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

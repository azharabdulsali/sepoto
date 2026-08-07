import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  X,
  Check,
  Camera,
  Eye,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppShell from "../components/AppShell";
import ProtectedPhoto from "../components/ProtectedPhoto";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../services/api";

const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

const PhotoCard = ({ photo, onPreview }) => {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = isInCart(photo.id);
  const [loaded, setLoaded] = useState(false);

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (inCart) {
      removeItem(photo.id);
    } else {
      addItem(photo);
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={() => onPreview(photo)}
      className="group relative bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-700/70 hover:border-brand/50 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#0F172A]">
        {!loaded && (
          <Skeleton className="absolute inset-0 w-full h-full bg-slate-800 animate-pulse rounded-2xl z-0" />
        )}
        <ProtectedPhoto
          src={photo.watermarkedUrl}
          alt={`Foto event ${photo.bibTags ? `BIB ${photo.bibTags}` : "Umum"}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`w-full h-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
          imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {photo.bibTags && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge className="font-bib text-[10px] bg-brand text-white border-0 shadow-md px-2 py-0.5 font-bold">
              #{photo.bibTags}
            </Badge>
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-7 h-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-3 text-center">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              id={`cart-toggle-${photo.id}`}
              onClick={handleCartClick}
              size="sm"
              className={`rounded-full transition-all active:scale-95 shadow-lg font-bold min-h-[48px] px-5 ${
                inCart
                  ? "bg-white text-[#0F172A] hover:bg-red-50 hover:text-red-500"
                  : "bg-brand text-white hover:bg-[#C2410C]"
              }`}
              aria-label={
                inCart ? "Hapus dari keranjang" : "Tambah ke keranjang"
              }
            >
              {inCart ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                  <span>Ditambahkan</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                  <span>Tambah ke Cart</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="p-3.5 flex items-center justify-between gap-2 border-t border-slate-700/60 bg-[#1E293B]">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-300 font-medium truncate">
            {photo.photographerName || "Fotografer"}
          </p>
          <p className="font-bib text-sm font-bold text-brand mt-0.5">
            {formatRupiah(photo.price)}
          </p>
        </div>

        <Button
          id={`cart-btn-${photo.id}`}
          onClick={handleCartClick}
          size="sm"
          variant="outline"
          className={`h-9 px-3 rounded-xl border-slate-700 text-xs font-bold shrink-0 transition-all ${
            inCart
              ? "bg-white text-[#0F172A] hover:bg-red-50 hover:text-red-500 border-white"
              : "hover:border-brand/40 hover:bg-brand/10 text-slate-300 hover:text-white"
          }`}
        >
          {inCart ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
};

// ─── Component Skeleton Loading Grid ─────────────────────────────────────
function GallerySkeletonGrid({ count = 10 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-700/60 p-0 space-y-3 shadow-sm"
        >
          <Skeleton className="aspect-[4/5] w-full bg-slate-800 rounded-2xl animate-pulse" />
          <div className="px-3.5 pb-3 flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-24 bg-slate-700/50 rounded-md" />
            <Skeleton className="h-4 w-12 bg-brand/20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

const PhotoPreviewModal = ({ photo, onClose }) => {
  const { addItem, removeItem, isInCart } = useCart();
  const inCart = photo ? isInCart(photo.id) : false;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!photo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-[#1E293B] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl text-white flex flex-col max-h-[90vh]"
      >
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Camera className="w-4 h-4 text-brand" />
            <span className="text-sm font-bold truncate max-w-[180px] sm:max-w-xs">
              {photo.photographerName}
            </span>
            {photo.bibTags && (
              <Badge className="font-bib text-[10px] bg-brand text-white border-0 px-2 py-0.5 font-bold">
                BIB #{photo.bibTags}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
            aria-label="Tutup pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] max-h-[60vh] p-2">
          <ProtectedPhoto
            src={photo.watermarkedUrl}
            alt={`Preview Foto ${photo.bibTags ? `BIB ${photo.bibTags}` : ""}`}
            className="w-full h-full max-h-[58vh] flex items-center justify-center"
            imgClassName="w-full h-full object-contain max-h-[58vh] rounded-xl select-none"
          />
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-700 bg-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bib uppercase tracking-widest text-slate-400 font-semibold">
              Harga Foto HD
            </p>
            <p className="font-bib text-xl font-bold text-brand">
              {formatRupiah(photo.price)}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              id={`modal-cart-toggle-${photo.id}`}
              onClick={() => (inCart ? removeItem(photo.id) : addItem(photo))}
              className={`flex-1 sm:flex-none min-h-[48px] px-6 rounded-2xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 ${
                inCart
                  ? "bg-white text-[#0F172A] hover:bg-red-50 hover:text-red-500"
                  : "bg-brand hover:bg-[#C2410C] text-white shadow-orange-600/30"
              }`}
            >
              {inCart ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  <span>Sudah Ada di Keranjang</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  <span>Tambah ke Keranjang</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function GalleryPage() {
  const { currentUser, login } = useAuth();
  const { formattedTotal, itemCount, clearCart } = useCart();
  const navigate = useNavigate();

  const PAGE_SIZE = 10;
  const [searchBib, setSearchBib] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [isBatchLoading, setIsBatchLoading] = useState(false);
  const [realPhotos, setRealPhotos] = useState([]);
  const [activeEvent, setActiveEvent] = useState(null);

  const handleSwitchEvent = async (targetEventId) => {
    if (!currentUser?.name || !currentUser?.bibNumber) return;
    try {
      setIsLoading(true);
      const res = await api.loginUnified(
        currentUser.name,
        currentUser.bibNumber,
        targetEventId,
      );
      if (res.success && res.user && res.token) {
        login(res.user, res.token, res.availableEvents);
      }
    } catch (err) {
      console.error("Gagal berpindah event:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setVisibleLimit(PAGE_SIZE);
      try {
        const userEventId = currentUser?.eventId || "";
        const [eventRes, photoRes] = await Promise.all([
          api.getActiveEvent(userEventId),
          api.getPhotos(searchBib, userEventId),
        ]);
        if (isMounted) {
          if (eventRes.success && eventRes.event)
            setActiveEvent(eventRes.event);
          if (
            photoRes.success &&
            photoRes.photos &&
            photoRes.photos.length > 0
          ) {
            setRealPhotos(photoRes.photos);
          } else {
            setRealPhotos([]);
          }
        }
      } catch (err) {
        console.error("Gallery fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [searchBib, currentUser?.eventId]);

  const isBibMatch = (tags, bib) => {
    if (!tags || !bib) return false;
    const target = String(bib).trim().toLowerCase();
    const tagList = String(tags)
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());
    return (
      tagList.includes(target) || String(tags).toLowerCase().includes(target)
    );
  };

  const pricedPhotos = useMemo(() => {
    return realPhotos.filter((p) => p.price != null && Number(p.price) > 0);
  }, [realPhotos]);

  const filteredPhotos = useMemo(() => {
    const bib = searchBib.trim().toLowerCase();

    if (!bib) {
      if (currentUser?.bibNumber) {
        const userBib = String(currentUser.bibNumber);
        const myPhotos = pricedPhotos.filter((p) =>
          isBibMatch(p.bibTags, userBib),
        );
        const otherPhotos = pricedPhotos.filter(
          (p) => !isBibMatch(p.bibTags, userBib),
        );
        return [...myPhotos, ...otherPhotos];
      }
      return pricedPhotos;
    }

    return pricedPhotos.filter((p) => isBibMatch(p.bibTags, bib));
  }, [searchBib, currentUser, pricedPhotos]);

  const displayedPhotos = useMemo(() => {
    return filteredPhotos.slice(0, visibleLimit);
  }, [filteredPhotos, visibleLimit]);

  const userPhotoCount = useMemo(() => {
    if (!currentUser?.bibNumber) return 0;
    return pricedPhotos.filter((p) =>
      isBibMatch(p.bibTags, currentUser.bibNumber),
    ).length;
  }, [currentUser, pricedPhotos]);

  const currentActiveEventObj = useMemo(() => {
    return currentUser?.availableEvents?.find(
      (evt) => Number(evt.eventId) === Number(currentUser?.eventId),
    );
  }, [currentUser]);

  const observerTargetRef = React.useRef(null);

  const handleLoadMore = React.useCallback(() => {
    if (isBatchLoading) return;
    setIsBatchLoading(true);
    setTimeout(() => {
      setVisibleLimit((prev) => prev + PAGE_SIZE);
      setIsBatchLoading(false);
    }, 300);
  }, [isBatchLoading]);

  // Infinite Scroll Trigger
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleLimit < filteredPhotos.length && !isBatchLoading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [visibleLimit, filteredPhotos.length, isBatchLoading, handleLoadMore]);

  return (
    <AppShell>
      <div className="max-w-screen-xl mx-auto px-4 pb-40 font-sans antialiased">
        {currentUser?.availableEvents &&
          currentUser.availableEvents.length > 1 && (
            <div className="mt-5 mb-2 p-4 bg-[#1E293B] text-white rounded-3xl border border-slate-700 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand/20 text-brand border border-brand/30 flex items-center justify-center shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">
                      Terdaftar di {currentUser.availableEvents.length} Event
                    </p>
                    <Badge className="font-bib text-[9px] bg-brand text-white border-0 px-2 py-0.2 font-bold">
                      MULTI-EVENT
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Pilih event untuk menampilkan galeri foto event tersebut:
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto shrink-0">
                <Select
                  value={String(currentUser.eventId)}
                  onValueChange={(val) => handleSwitchEvent(Number(val))}
                >
                  <SelectTrigger className="w-full sm:w-auto h-11 bg-slate-900/60 hover:bg-slate-800 text-white text-xs font-bold rounded-2xl px-4 border-slate-700 focus:ring-brand">
                    <SelectValue>
                      {currentActiveEventObj
                        ? `${currentActiveEventObj.eventName} (BIB #${currentActiveEventObj.bibNumber})`
                        : activeEvent?.title || "Pilih Event"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E293B] border border-slate-700 text-white rounded-2xl p-1 z-50">
                    {currentUser.availableEvents.map((evt) => (
                      <SelectItem
                        key={evt.eventId}
                        value={String(evt.eventId)}
                        className="hover:bg-brand/20 text-xs py-2.5 px-3 rounded-xl cursor-pointer text-white focus:bg-brand/20 focus:text-white"
                      >
                        {evt.eventName} (BIB #{evt.bibNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

        <div className="py-6 md:py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                {activeEvent?.title || "Galeri Foto Event"}
              </h1>
              {currentUser?.name && (
                <p className="text-sm text-[#475569] mt-1 flex items-center gap-1.5 flex-wrap">
                  <span>Selamat datang,</span>
                  <span className="font-semibold text-[#0F172A]">
                    {currentUser.name}
                  </span>
                  {currentUser.bibNumber && (
                    <Badge
                      variant="outline"
                      className="font-bib text-brand border-brand/30 bg-brand/10 px-2 py-0.5 font-bold"
                    >
                      BIB #{currentUser.bibNumber}
                    </Badge>
                  )}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 bg-white border border-[#E2E8F0] rounded-2xl px-4 py-2 shadow-xs">
              <p className="text-2xl font-extrabold text-[#0F172A] font-bib">
                {pricedPhotos.length}
              </p>
              <p className="text-[11px] text-[#475569] font-medium">foto dijual</p>
            </div>
          </div>
        </div>

        <div className="sticky top-14 md:top-16 z-40 bg-white/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-[#E2E8F0] mb-6">
          <div className="flex gap-2">
            <InputGroup className="h-12 bg-white border-[#E2E8F0] rounded-xl flex-1">
              <InputGroupAddon align="inline-start">
                <Search className="w-4 h-4 text-[#94A3B8]" />
              </InputGroupAddon>
              <InputGroupInput
                id="gallery-search-bib"
                type="text"
                value={searchBib}
                onChange={(e) => setSearchBib(e.target.value)}
                placeholder="Cari Nomor BIB (misal: 101, 36, 2424)..."
                className="text-sm font-bib text-[#0F172A]"
              />
              {searchBib && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    onClick={() => setSearchBib("")}
                    title="Bersihkan pencarian"
                  >
                    <X className="w-4 h-4 text-[#64748B] hover:text-[#0F172A]" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>

            <Button
              id="gallery-filter-btn"
              variant="outline"
              size="default"
              className="h-12 border-[#E2E8F0] rounded-xl text-[#475569] hover:border-brand/40 hover:text-brand bg-white font-semibold min-h-[48px] px-4"
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
              className="text-xs text-[#475569] mt-2 font-medium"
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
              <h2 className="text-sm font-bold text-[#0F172A]">
                Foto Anda (BIB #{currentUser.bibNumber})
              </h2>
              <Badge
                variant="secondary"
                className="font-bib bg-brand/10 text-brand text-[10px] px-2 py-0.5 font-bold"
              >
                {userPhotoCount} foto
              </Badge>
            </div>
          </div>
        )}

        {/* Grid Foto dengan Skeleton State & Incremental Batching */}
        {isLoading ? (
          <GallerySkeletonGrid count={10} />
        ) : displayedPhotos.length === 0 ? (
          <Card className="p-12 text-center bg-white border border-[#E2E8F0] rounded-3xl shadow-xs my-6">
            <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F172A]">
              Belum Ada Foto Galeri
            </h3>
            <p className="text-xs text-[#475569] mt-1 max-w-md mx-auto leading-relaxed">
              {searchBib
                ? `Tidak ditemukan foto untuk Nomor BIB #${searchBib}. Pastikan nomor BIB sesuai.`
                : "Belum ada foto yang diunggah oleh fotografer untuk event ini."}
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
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onPreview={(p) => setPreviewPhoto(p)}
                />
              ))}
            </motion.div>

            {/* Skeleton Loading Batch Tambahan saat Load More */}
            {isBatchLoading && (
              <div className="mt-4">
                <GallerySkeletonGrid count={5} />
              </div>
            )}

            {/* Sentinel Element untuk Infinite Scroll */}
            {visibleLimit < filteredPhotos.length && (
              <div ref={observerTargetRef} className="mt-8 text-center min-h-[60px] flex items-center justify-center">
                <Button
                  id="load-more-photos-btn"
                  onClick={handleLoadMore}
                  disabled={isBatchLoading}
                  variant="outline"
                  className="h-11 px-8 rounded-2xl border-[#E2E8F0] hover:border-brand/40 text-xs font-bold text-[#0F172A] bg-white shadow-xs"
                >
                  {isBatchLoading ? (
                    <span className="flex items-center gap-2">
                      <Skeleton className="w-3.5 h-3.5 rounded-full bg-brand animate-ping" />
                      <span>Memuat Foto...</span>
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
            <p className="text-base font-bold text-[#0F172A]">
              Foto Tidak Ditemukan
            </p>
            <p className="text-sm text-[#475569] mt-1">
              Coba kata kunci BIB yang berbeda atau hapus filter pencarian.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal Preview */}
      <AnimatePresence>
        {previewPhoto && (
          <PhotoPreviewModal
            photo={previewPhoto}
            onClose={() => setPreviewPhoto(null)}
          />
        )}
      </AnimatePresence>

      {/* Sticky Cart Bar */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed left-0 right-0 z-40 px-4 pb-2"
            style={{
              bottom: "calc(64px + env(safe-area-inset-bottom))",
            }}
          >
            {/* Mobile */}
            <div className="max-w-lg mx-auto sm:hidden">
              <div className="bg-[#1E293B]/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl px-4 py-3 flex items-center gap-2.5 text-white">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">
                    {itemCount} foto ·{" "}
                    <span className="text-brand font-bold font-bib">
                      {formattedTotal}
                    </span>
                  </p>
                </div>
                <Button
                  id="cart-clear-btn-mobile"
                  onClick={clearCart}
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 border border-slate-700 text-slate-300 hover:text-red-400 shrink-0 rounded-xl"
                  aria-label="Kosongkan keranjang"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    id="cart-checkout-btn-mobile"
                    onClick={() => navigate("/cart")}
                    className="bg-brand hover:bg-[#C2410C] text-white font-bold text-xs px-4 h-9 rounded-xl shrink-0 shadow-md min-h-[40px]"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    <span>Checkout</span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Desktop */}
            <div
              className="hidden sm:block max-w-lg mx-auto"
              style={{ bottom: 0 }}
            >
              <div className="bg-[#1E293B]/95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl p-4 flex items-center gap-3 text-white">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300">
                    {itemCount} foto dipilih
                  </p>
                  <p className="text-brand font-bib text-sm font-bold">
                    {formattedTotal}
                  </p>
                </div>
                <Button
                  id="cart-clear-btn"
                  onClick={clearCart}
                  variant="ghost"
                  size="icon"
                  className="w-10 h-10 border border-slate-700 text-slate-300 hover:text-red-400 rounded-xl"
                  aria-label="Kosongkan keranjang"
                >
                  <X className="w-4 h-4" />
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    id="cart-checkout-btn"
                    onClick={() => navigate("/cart")}
                    className="bg-brand hover:bg-[#C2410C] text-white font-bold text-sm px-6 h-11 rounded-xl shadow-lg shadow-orange-600/30"
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

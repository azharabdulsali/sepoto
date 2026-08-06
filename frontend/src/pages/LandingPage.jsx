import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  ArrowRight,
  Sparkles,
  QrCode,
  Download,
  Image as ImageIcon,
  ChevronRight,
  Search,
  LogIn,
  Calendar,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AppShell from "../components/AppShell";
import ProtectedPhoto from "../components/ProtectedPhoto";
import SepotoLogo from "../components/SepotoLogo";
import { api } from "../services/api";

// ─── Animation Variants (Framer Motion) ────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Sample photos for preview showcase
const SAMPLE_PHOTOS = [
  {
    id: 1,
    url: "/images/sample-1.jpg",
    bib: "36",
    price: "Rp 30.000",
    author: "Robi Syianturi",
  },
  {
    id: 2,
    url: "/images/sample-2.jpg",
    bib: "2424",
    price: "Rp 10.000",
    author: "Cigul",
  },
  {
    id: 3,
    url: "/images/sample-3.jpg",
    bib: "108",
    price: "Rp 25.000",
    author: "Ibnu Jamil",
  },
  {
    id: 4,
    url: "/images/sample-4.jpg",
    bib: "20084",
    price: "Rp 10.000",
    author: "dr. Tirta",
  },
];

const formatDate = (dateStr) => {
  if (!dateStr) return "Tanggal belum ditentukan";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [demoBib, setDemoBib] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedInactiveEvent, setSelectedInactiveEvent] = useState(null);
  const [carouselApi, setCarouselApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await api.getAllEvents();
        if (res.success && res.events) {
          setEvents(res.events);
        }
      } catch (err) {
        console.error("Failed to load events on landing page:", err);
      }
    }
    loadEvents();
  }, []);

  return (
    <AppShell>
      <div className="relative overflow-hidden bg-white text-[#111827]">
        {/* Decorative ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] sm:h-[520px] bg-gradient-to-b from-orange-500/12 via-amber-500/5 to-transparent pointer-events-none blur-3xl" />

        {/* ─── 1. HERO SECTION ────────────────────────────────────────── */}
        <section className="relative pt-6 pb-10 sm:pt-16 sm:pb-20 px-3.5 sm:px-4 max-w-screen-xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 sm:space-y-6"
          >
            {/* Top Badge */}
            <motion.div variants={itemVariants}>
              <Badge className="font-bib text-[10px] sm:text-xs tracking-wider sm:tracking-widest bg-brand/10 text-brand border border-brand/20 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-sm max-w-full truncate">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 text-brand shrink-0" />
                <span>PLATFORM FOTO EVENT & UNDUH DIGITAL</span>
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#111827] leading-[1.2] sm:leading-[1.15]"
            >
              Abadikan Setiap Momen Terbaik di{" "}
              <SepotoLogo size="inherit" variant="gradient" />
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-xs sm:text-lg text-[#4B5563] max-w-2xl leading-relaxed font-medium px-2"
            >
              Temukan foto maraton, bersepeda, & olahraga Anda secara instan
              dengan sistem pencarian{" "}
              <span className="font-bold text-[#111827]">
                Nomor BIB (Nomor Dada)
              </span>
              . Pembayaran QRIS praktis & unduh kualitas HD tanpa watermark.
            </motion.p>

            {/* Main Hero Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-1 sm:pt-2 w-full sm:w-auto px-2"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                <Button
                  id="hero-cta-login"
                  onClick={() => navigate("/login")}
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-13 px-6 sm:px-8 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-orange-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Masuk ke Sepoto</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
                </Button>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto"
              >
                {/* <Button
                  id="hero-cta-photographer"
                  onClick={() => navigate("/photographer/login")}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-13 px-6 sm:px-7 border-[#E5E7EB] hover:border-blue-500/40 text-[#111827] hover:text-blue-600 bg-white font-bold text-xs sm:text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2"
                >
                  <Aperture className="w-4 h-4 text-blue-600" />
                  <span>Portal Fotografer</span>
                </Button> */}
              </motion.div>
            </motion.div>

            {/* Live Search Mockup Input Bar */}
            <motion.div
              variants={itemVariants}
              className="w-full max-w-md pt-2 sm:pt-4 px-2"
            >
              <Card className="bg-white border border-[#E5E7EB] shadow-lg rounded-2xl p-1.5 sm:p-2 flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={demoBib}
                    onChange={(e) => setDemoBib(e.target.value)}
                    placeholder="Ketik Nomor BIB ..."
                    className="pl-9 h-10 border-0 bg-transparent text-xs sm:text-sm font-bib focus-visible:ring-0"
                  />
                </div>
                <Button
                  onClick={() => navigate("/login")}
                  size="sm"
                  className="bg-brand text-white font-bold text-xs h-9 px-3.5 sm:px-4 rounded-xl shrink-0"
                >
                  Cari
                </Button>
              </Card>
              <p className="text-[10px] sm:text-[11px] text-[#9CA3AF] mt-1.5">
                Contoh: Ketik <strong>101</strong> atau <strong>205</strong>{" "}
                untuk melihat contoh foto
              </p>
            </motion.div>
          </motion.div>

          {/* ─── 2. EVENT CAROUSEL SECTION ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 sm:mt-20"
          >
            <div className="text-center max-w-md mx-auto mb-6 sm:mb-10 px-2">
              <Badge
                variant="outline"
                className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-1.5"
              >
                Event Sepoto
              </Badge>
              <h2 className="text-xl sm:text-3xl font-bold text-[#111827]">
                Jelajahi Event Fotografi
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                Pilih event yang aktif untuk masuk ke portal login atau lihat event yang telah selesai.
              </p>
            </div>

            <div className="max-w-3xl mx-auto px-1.5 sm:px-4 relative group">
              {/* Outer Ambient Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400/20 via-amber-400/15 to-orange-500/20 rounded-[28px] sm:rounded-[36px] blur-xl opacity-60 pointer-events-none" />

              {events.length > 0 ? (
                <div className="bg-[#F9FAFB]/95 border border-[#E5E7EB] rounded-[24px] sm:rounded-[32px] p-3.5 sm:p-8 shadow-xl shadow-gray-200/50 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
                  
                  {/* Decorative ambient internal light */}
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-32 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

                  <Carousel
                    setApi={setCarouselApi}
                    opts={{
                      align: "center",
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 4500,
                        stopOnInteraction: false,
                      }),
                    ]}
                    className="w-full relative px-0 sm:px-12"
                  >
                    <CarouselContent>
                      {events.map((evt) => {
                        const isActive = evt.isActive ?? evt.is_active;
                        const eventDateFormatted = formatDate(evt.eventDate || evt.event_date);
                        return (
                          <CarouselItem
                            key={evt.id}
                            className="basis-full flex justify-center py-1 sm:py-2 px-1 sm:px-0"
                          >
                            <motion.div
                              whileHover={{ y: -4, scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => {
                                if (isActive) {
                                  navigate("/login", { state: { selectedEventId: evt.id } });
                                } else {
                                  setSelectedInactiveEvent(evt);
                                }
                              }}
                              className="w-full max-w-[340px] sm:max-w-md cursor-pointer"
                            >
                              {/* Sleek Dark Event Card */}
                              <Card className="h-full bg-gradient-to-b from-[#181B22] to-[#12141A] border border-white/10 hover:border-brand/60 shadow-2xl hover:shadow-orange-950/30 transition-all rounded-2xl sm:rounded-3xl p-5 sm:p-7 flex flex-col justify-between group/card relative overflow-hidden">
                                <div className="space-y-3 sm:space-y-4">
                                  {/* Top Header Row: Icon + Badge Status */}
                                  <div className="flex items-center justify-between">
                                    <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover/card:scale-105 transition-transform shrink-0">
                                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </div>
                                    {isActive ? (
                                      <Badge className="font-bib text-[9px] sm:text-[10px] uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1.5 tracking-wider">
                                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        EVENT AKTIF
                                      </Badge>
                                    ) : (
                                      <Badge className="font-bib text-[9px] sm:text-[10px] uppercase bg-white/5 text-gray-400 border border-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider">
                                        EVENT SELESAI
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Event Name & Date */}
                                  <div className="pt-1 sm:pt-2">
                                    <h3 className="text-lg sm:text-2xl font-bold text-white group-hover/card:text-amber-400 transition-colors leading-snug line-clamp-2">
                                      {evt.title || evt.name}
                                    </h3>
                                    <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 text-[11px] sm:text-xs text-gray-300 mt-2 sm:mt-3 font-medium">
                                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand shrink-0" />
                                      <span>{eventDateFormatted}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Button CTA */}
                                <Button
                                  variant={isActive ? "default" : "outline"}
                                  className={`w-full mt-5 sm:mt-6 font-bold text-xs sm:text-sm h-11 sm:h-13 rounded-xl sm:rounded-2xl transition-all flex items-center justify-between px-4 sm:px-5 shadow-lg ${
                                    isActive
                                      ? "bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25"
                                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  <span>{isActive ? "Masuk Portal Event" : "Lihat Informasi Event"}</span>
                                  {isActive ? (
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/card:translate-x-1 transition-transform" />
                                  ) : (
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                  )}
                                </Button>
                              </Card>
                            </motion.div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>
                    
                    {/* Desktop Only Navigation Buttons (hidden on mobile to prevent overlapping card text) */}
                    <CarouselPrevious className="hidden sm:flex left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white hover:bg-brand text-[#111827] hover:text-white border border-[#E5E7EB] hover:border-brand z-20 transition-all shadow-md hover:scale-110 active:scale-95" />
                    <CarouselNext className="hidden sm:flex right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white hover:bg-brand text-[#111827] hover:text-white border border-[#E5E7EB] hover:border-brand z-20 transition-all shadow-md hover:scale-110 active:scale-95" />
                  </Carousel>

                  {/* Mobile Touch Navigation Dots */}
                  {events.length > 1 && (
                    <div className="flex sm:hidden items-center justify-center gap-2 mt-4">
                      {events.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => carouselApi?.scrollTo(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentSlide
                              ? "w-6 bg-brand shadow-sm shadow-orange-500/50"
                              : "w-2 bg-gray-300 hover:bg-gray-400"
                          }`}
                          aria-label={`Lihat slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Mobile Touch Swipe Hint */}
                  <div className="flex sm:hidden items-center justify-center gap-1.5 mt-2.5 text-[10px] text-gray-400 font-medium">
                    <span>Swipe untuk melihat event lainnya</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-2xl sm:rounded-3xl border border-dashed border-gray-200">
                  <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm font-semibold text-gray-600">Belum ada event terdaftar</p>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* ─── 3. SHOWCASE PREVIEW GRID ────────────────────────────────── */}
        <section className="py-10 sm:py-16 px-3.5 sm:px-4 max-w-screen-xl mx-auto">
          <div className="text-center max-w-md mx-auto mb-6 sm:mb-10 px-2">
            <Badge
              variant="outline"
              className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-1.5"
            >
              Preview Foto Event
            </Badge>
            <h2 className="text-xl sm:text-3xl font-bold text-[#111827]">
              Hasil Jepretan Kualitas HD
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
              Setiap foto dilengkapi watermark otomatis sebelum dibeli peserta.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            {SAMPLE_PHOTOS.map((photo) => (
              <motion.div key={photo.id} whileHover={{ y: -4 }}>
                <Card className="bg-[#191C21] rounded-2xl overflow-hidden border border-white/10 shadow-md">
                  <div className="relative aspect-[4/5] bg-[#22262E] overflow-hidden">
                    <ProtectedPhoto
                      src={photo.url}
                      alt={`Foto sample ${photo.bib}`}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className="font-bib text-[9px] sm:text-[10px] bg-brand text-white border-0 shadow px-1.5 py-0.5">
                        #{photo.bib}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3 flex items-center justify-between text-white">
                    <span className="text-[10px] sm:text-[11px] text-gray-400 truncate max-w-[60%]">
                      {photo.author}
                    </span>
                    <span className="font-bib text-[11px] sm:text-xs text-brand font-bold">
                      {photo.price}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <Button
              onClick={() => navigate("/login")}
              variant="link"
              className="text-brand font-bold text-xs sm:text-sm"
            >
              Lihat Lebih Banyak Foto di Galeri →
            </Button>
          </div>
        </section>

        {/* ─── 4. CARA KERJA / FEATURES SECTION ────────────────────────── */}
        <section className="py-10 sm:py-16 bg-[#F9FAFB] border-y border-[#E5E7EB] px-3.5 sm:px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12 px-2">
              <Badge
                variant="outline"
                className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-1.5"
              >
                Alur Praktis
              </Badge>
              <h2 className="text-xl sm:text-3xl font-bold text-[#111827]">
                Bagaimana Sepoto Bekerja?
              </h2>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1">
                4 langkah sederhana dari pencarian hingga unduhan foto tanpa
                watermark.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {[
                {
                  step: "01",
                  icon: User,
                  title: "Input BIB",
                  desc: "Masuk dengan Nama & Nomor Dada peserta event Anda.",
                },
                {
                  step: "02",
                  icon: ImageIcon,
                  title: "Pilih Foto",
                  desc: "Telusuri foto aksi beresolusi tinggi hasil jepretan fotografer pro.",
                },
                {
                  step: "03",
                  icon: QrCode,
                  title: "Bayar QRIS",
                  desc: "Scan QR Code QRIS statis via m-banking atau e-wallet pilihan Anda.",
                },
                {
                  step: "04",
                  icon: Download,
                  title: "Unduh HD",
                  desc: "Setelah pembayaran disetujui, foto asli tanpa watermark siap diunduh.",
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <Card
                  key={step}
                  className="bg-white border-[#E5E7EB] rounded-2xl p-3.5 sm:p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="font-bib text-2xl sm:text-4xl font-bold text-gray-100 absolute top-2 right-3 sm:top-3 sm:right-4 select-none">
                    {step}
                  </span>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-3 sm:mb-4">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h3 className="text-xs sm:text-base font-bold text-[#111827] mb-0.5 sm:mb-1">
                    {title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#4B5563] leading-relaxed">
                    {desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 5. STATS BANNER ────────────────────────────────────────── */}
        <section className="py-10 sm:py-14 px-3.5 sm:px-4 max-w-screen-xl mx-auto">
          <div className="bg-[#191C21] rounded-2xl sm:rounded-3xl p-5 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center relative z-10">
              <div>
                <p className="text-2xl sm:text-4xl font-bold font-bib text-brand">
                  10.000+
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 font-medium">
                  Foto Event
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-bold font-bib text-white">
                  500+
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 font-medium">
                  Peserta
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-bold font-bib text-brand">
                  100%
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 font-medium">
                  QRIS Aman
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-bold font-bib text-white">
                  HD
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 font-medium">
                  Kualitas Foto
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. FOOTER ──────────────────────────────────────────────── */}
        <footer className="bg-white border-t border-[#E5E7EB] pt-6 pb-20 sm:pb-8 px-4 text-center">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <SepotoLogo size="md" />
              <span className="text-xs text-[#9CA3AF]">
                © 2026 Sepoto. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold text-[#4B5563] flex-wrap justify-center">
              <Link to="/login" className="hover:text-brand transition-colors">
                Login
              </Link>
            </div>
          </div>
        </footer>

        {/* ─── MODAL INFORMASI EVENT TIDAK AKTIF ──────────────────── */}
        <Dialog
          open={Boolean(selectedInactiveEvent)}
          onOpenChange={(open) => {
            if (!open) setSelectedInactiveEvent(null);
          }}
        >
          <DialogContent className="bg-white border border-[#E5E7EB] rounded-3xl p-6 max-w-md shadow-2xl">
            <DialogHeader>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-[#111827]">
                Event Telah Berakhir
              </DialogTitle>
              <DialogDescription className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                Event <strong className="text-[#111827]">{selectedInactiveEvent?.title || selectedInactiveEvent?.name}</strong> saat ini dalam status non-aktif / telah selesai.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 my-2 text-xs space-y-2">
              <div className="flex justify-between items-center text-gray-600">
                <span>Tanggal Pelaksanaan:</span>
                <span className="font-semibold text-gray-900">
                  {selectedInactiveEvent?.eventDate || selectedInactiveEvent?.event_date || "-"}
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Status Event:</span>
                <Badge variant="outline" className="bg-gray-200 text-gray-700 text-[10px]">
                  SELESAI / NON-AKTIF
                </Badge>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Aktivitas login dan unggah foto baru untuk event ini sudah ditutup. Silakan hubungi panitia atau admin jika Anda memerlukan bantuan lebih lanjut.
            </p>

            <div className="mt-4 flex justify-end">
              <Button
                onClick={() => setSelectedInactiveEvent(null)}
                className="w-full bg-[#191C21] hover:bg-brand text-white font-bold text-xs h-11 rounded-xl shadow-md"
              >
                Saya Mengerti
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

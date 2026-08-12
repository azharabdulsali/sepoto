import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ArrowRight,
  Sparkles,
  QrCode,
  Download,
  Image as ImageIcon,
  ChevronRight,
  ChevronDown,
  Search,
  LogIn,
  Calendar,
  Trophy,
  AlertCircle,
  MapPin,
  CheckCircle2,
  XCircle,
  Star,
  ShieldCheck,
  Zap,
  HelpCircle,
  Eye,
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
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Sample photos for preview showcase
const SAMPLE_PHOTOS = [
  {
    id: 1,
    url: "/images/1.webp",
    bib: "081039",
    price: "Rp 5.000",
    author: "Sri Lestari",
    eventName: "Bima Run 2026",
  },
  {
    id: 2,
    url: "/images/2.webp",
    bib: "081096",
    price: "Rp 5.000",
    author: "Rif'ain",
    eventName: "Bima Run 2026",
  },
  {
    id: 3,
    url: "/images/3.webp",
    bib: "081134",
    price: "Rp 5.000",
    author: "Start",
    eventName: "Bima Run 2026",
  },
  {
    id: 4,
    url: "/images/4.webp",
    bib: "081045",
    price: "Rp 5.000",
    author: "Foto Bareng",
    eventName: "Bima Run 2026",
  },
];

// Testimonials Data
const TESTIMONIALS = [
  {
    id: 1,
    name: "Robi Syianturi",
    role: "National Runner",
    content:
      "Sepoto mempermudah saya mencari foto garis finish cukup masukkan BIB 36. Hasil foto HD dan sangat cepat!",
    rating: 5,
    tag: "Peserta Maraton",
  },
  {
    id: 2,
    name: "dr. Tirta",
    role: "Marathon Enthusiast",
    content:
      "Pembayaran QRIS langsung terverifikasi otomatis. Dalam hitungan detik foto high-res langsung tersimpan di HP.",
    rating: 5,
    tag: "Peserta Event",
  },
  {
    id: 3,
    name: "Dedi Supriyadi",
    role: "Fotografer Official",
    content:
      "Sebagai fotografer, platform ini sangat tertata rapi. Watermark aman dan distribusi foto via QRIS lancar.",
    rating: 5,
    tag: "Official Photographer",
  },
];

// FAQ Data
const FAQ_ITEMS = [
  {
    question: "Bagaimana cara menemukan foto saya di Sepoto?",
    answer:
      "Cukup masuk ke portal event, ketik Nama dan Nomor Dada (BIB) Anda. Sistem Sepoto akan otomatis menampilkan seluruh foto aksi Anda.",
  },
  {
    question: "Bagaimana proses pembayaran via QRIS?",
    answer:
      "Pilih foto yang ingin dibeli, sistem akan menampilkan kode QRIS resmi. Lakukan scan via aplikasi m-banking atau e-wallet (BCA, GoPay, OVO, ShopeePay, Dana, dll).",
  },
  {
    question: "Kapan saya bisa mengunduh foto tanpa watermark?",
    answer:
      "Seketika pembayaran QRIS dikonfirmasi otomatis, tombol unduh foto resolusi tinggi (HD) tanpa watermark akan langsung aktif.",
  },
  {
    question: "Bagaimana jika nomor BIB saya terhalang saat lari?",
    answer:
      "Jika tidak terdeteksi via pencarian BIB, Anda dapat mencari berdasarkan filter estimasi waktu melintas dan zona lokasi fotografer.",
  },
  {
    question: "Apakah foto yang diunduh berkualitas asli (HD Resolution)?",
    answer:
      "Ya, seluruh file foto diunduh dalam resolusi asli kualitas tinggi sesuai jepretan kamera fotografer official.",
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
  const [carouselApi, setCarouselApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedSamplePhoto, setSelectedSamplePhoto] = useState(null);

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
          // Saring hanya event yang berstatus aktif (isActive === true)
          const activeEvents = res.events.filter(
            (evt) => (evt.isActive ?? evt.is_active) === true,
          );
          setEvents(activeEvents);
        }
      } catch (err) {
        console.error("Failed to load events on landing page:", err);
      }
    }
    loadEvents();
  }, []);

  const handleDemoSearch = (e) => {
    e.preventDefault();
    navigate("/login", { state: { searchBib: demoBib } });
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <AppShell>
      <div className="bg-[#FAFBFD] text-[#0F172A] min-h-screen pb-16 sm:pb-0 font-sans antialiased">
        {/* ─── 1. HERO SECTION (HIGH-UTILITY MOBILE-FIRST) ──────────────── */}
        <section className="relative pt-8 pb-10 sm:pt-20 sm:pb-24 px-4 max-w-screen-xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4 sm:space-y-6"
          >
            {/* Value Tag */}
            <motion.div variants={itemVariants}>
              <Badge className="font-bib text-[11px] sm:text-xs tracking-wider uppercase bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5] px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                <span>PLATFORM FOTO MARATON & EVENT OLAHRAGA</span>
              </Badge>
            </motion.div>

            {/* Main Product Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-2xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.18] sm:leading-[1.12]"
            >
              Cari & Unduh Foto Anda
              <br />
              via Nomor BIB di <SepotoLogo size="inherit" variant="gradient" />
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-xs sm:text-lg text-[#475569] max-w-2xl leading-relaxed font-medium px-1"
            >
              Temukan foto aksi terbaik Anda secara instan menggunakan{" "}
              <strong className="text-[#0F172A]">Nomor Dada (BIB)</strong>.
              Bayar praktis via QRIS dan unduh foto kualitas HD bebas watermark.
            </motion.p>

            {/* Primary Action Widget: BIB Search Bar */}
            <motion.div
              variants={itemVariants}
              className="w-full max-w-md pt-2"
            >
              <form onSubmit={handleDemoSearch}>
                <div className="bg-white border border-[#E2E8F0] shadow-lg rounded-2xl p-2 flex items-center gap-2 transition-all focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={demoBib}
                      onChange={(e) => setDemoBib(e.target.value)}
                      placeholder="Masukkan Nomor BIB Anda..."
                      className="pl-10 h-11 border-0 bg-transparent text-xs sm:text-sm font-bib focus-visible:ring-0 text-[#0F172A] placeholder:text-[#94A3B8]"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="bg-brand hover:bg-[#C2410C] text-white font-bold text-xs sm:text-sm h-11 px-5 rounded-xl shrink-0 min-h-[44px] shadow-md shadow-orange-600/20 active:scale-95 transition-transform"
                  >
                    <span>Cari BIB</span>
                    <ArrowRight className="w-4 h-4 ml-1 hidden sm:inline-block" />
                  </Button>
                </div>
              </form>
              <div className="flex items-center justify-center gap-1.5 mt-2.5 text-[11px] text-[#64748B]">
                <span>Contoh BIB demo:</span>
                {["36", "108", "2424"].map((bib) => (
                  <button
                    key={bib}
                    type="button"
                    onClick={() => setDemoBib(bib)}
                    className="font-bib font-bold text-brand bg-brand/10 hover:bg-brand/20 px-2 py-0.5 rounded transition-colors"
                  >
                    #{bib}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Direct Action Button */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto"
            >
              <Button
                id="hero-cta-main"
                onClick={() => navigate("/login")}
                size="lg"
                className="w-full sm:w-auto min-h-[52px] px-8 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-orange-600/25 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <LogIn className="w-5 h-5" />
                <span>Masuk Portal Event Peserta</span>
                <ArrowRight className="w-5 h-5 opacity-90" />
              </Button>
            </motion.div>

            {/* Micro Social Trust Metric */}
            <motion.div
              variants={itemVariants}
              className="pt-2 flex items-center justify-center gap-2 text-xs text-[#64748B]"
            >
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <span className="font-bold text-[#0F172A]">4.9/5</span>
              <span>•</span>
              <span>
                Dipercaya <strong>5.000+</strong> Peserta Lari
              </span>
            </motion.div>
          </motion.div>
        </section>

        {/* ─── 2. PROBLEM VS SOLUTION SECTION ───────────────────────────────── */}
        <section className="py-10 sm:py-16 px-4 max-w-screen-xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <Badge
              variant="outline"
              className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-2 font-semibold"
            >
              Efisiensi Pencarian
            </Badge>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#0F172A]">
              Mengapa Peserta Memilih Sepoto?
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-1.5 leading-relaxed">
              Pencarian foto aksi maraton yang cepat, akurat, dan tanpa proses
              manual yang berbelit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto">
            {/* Problem Card */}
            <Card className="bg-red-50/50 border border-red-200/80 rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-red-950">
                  Pencarian Manual Biasa
                </h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-red-900/80">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>
                    Mencari foto satu per satu di antara ribuan berkas album.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>
                    Proses pembayaran manual via transfer bank & kirim bukti WA.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>
                    Hasil unduhan terkompresi dan rentan penurunan kualitas.
                  </span>
                </li>
              </ul>
            </Card>

            {/* Solution Card */}
            <Card className="bg-emerald-50/60 border border-emerald-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <Badge className="bg-emerald-600 text-white font-bib text-[9px] uppercase px-2 py-0.5 rounded-full font-bold">
                  Solusi Sepoto
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-950">
                  Pencarian Otomatis Sepoto
                </h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-emerald-950">
                <li className="flex items-start gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>BIB Search:</strong> Ketik nomor BIB Dada Anda, foto
                    muncul instan.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <QrCode className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>QRIS Instan:</strong> Bayar dari e-wallet/m-banking
                    mana saja dalam detik.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Unduh Resolusi Asli HD:</strong> Bebas watermark
                    kualitas fotografer pro.
                  </span>
                </li>
              </ul>
            </Card>
          </div>
        </section>

        {/* ─── 3. FEATURED EVENT CAROUSEL SECTION ──────────────────────────── */}
        <section className="py-10 sm:py-16 bg-white border-y border-[#E2E8F0] px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center max-w-md mx-auto mb-6 sm:mb-10">
              <Badge
                variant="outline"
                className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-1.5 font-semibold"
              >
                Daftar Event
              </Badge>
              <h2 className="text-xl sm:text-3xl font-extrabold text-[#0F172A]">
                Jelajahi Event Terdaftar
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">
                Pilih event aktif untuk menemukan foto aksi maraton Anda.
              </p>
            </div>

            <div className="max-w-3xl mx-auto relative group">
              {events.length > 0 ? (
                <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-[24px] sm:rounded-[32px] p-3.5 sm:p-8 shadow-sm relative overflow-hidden">
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
                        const eventDateFormatted = formatDate(
                          evt.eventDate || evt.event_date,
                        );
                        const bannerUrl =
                          evt.bannerUrl ||
                          evt.banner_url ||
                          evt.logoUrl ||
                          evt.logo_url;
                        const locationText = evt.location;

                        return (
                          <CarouselItem
                            key={evt.id}
                            className="basis-full flex justify-center py-1 sm:py-2"
                          >
                            <motion.div
                              whileHover={{ y: -3 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => {
                                navigate("/login", {
                                  state: { selectedEventId: evt.id },
                                });
                              }}
                              className="w-full max-w-[340px] sm:max-w-md cursor-pointer"
                            >
                              <Card className="h-full bg-white border border-[#E2E8F0] hover:border-brand/40 shadow-sm transition-all rounded-2xl sm:rounded-3xl flex flex-col justify-between group/card overflow-hidden">
                                <div>
                                  <div className="relative w-full h-44 sm:h-52 bg-gray-100 overflow-hidden rounded-t-2xl sm:rounded-t-3xl">
                                    {bannerUrl ? (
                                      <img
                                        src={bannerUrl}
                                        alt={evt.title || evt.name}
                                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center text-white">
                                        <Trophy className="w-10 h-10 text-brand" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

                                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                                      <Badge className="bg-white/95 text-gray-800 font-semibold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md">
                                        Official Event
                                      </Badge>
                                      <Badge className="font-bib text-[9px] sm:text-[10px] uppercase bg-emerald-600 text-white shadow-md px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full flex items-center gap-1.5 tracking-wider font-bold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                        EVENT AKTIF
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="p-4 sm:p-6 space-y-3">
                                    <h3 className="text-lg sm:text-2xl font-bold text-[#0F172A] group-hover/card:text-brand transition-colors leading-snug line-clamp-2">
                                      {evt.title || evt.name}
                                    </h3>

                                    {locationText && (
                                      <div className="flex items-start gap-2 text-xs sm:text-sm text-[#475569]">
                                        <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">
                                          {locationText}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#64748B]">
                                      <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                                      <span>{eventDateFormatted}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                                  <Button
                                    variant="default"
                                    className="w-full font-bold text-xs sm:text-sm min-h-[48px] rounded-xl sm:rounded-2xl transition-all flex items-center justify-between px-4 shadow-sm bg-brand hover:bg-[#C2410C] text-white shadow-orange-600/20"
                                  >
                                    <span>Masuk Portal Event</span>
                                    <ChevronRight className="w-4 h-4 group-hover/card:translate-x-1 transition-transform" />
                                  </Button>
                                </div>
                              </Card>
                            </motion.div>
                          </CarouselItem>
                        );
                      })}
                    </CarouselContent>

                    <CarouselPrevious className="hidden sm:flex left-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white hover:bg-brand text-[#0F172A] hover:text-white border border-[#E2E8F0] hover:border-brand z-20 transition-all shadow-md hover:scale-110 active:scale-95" />
                    <CarouselNext className="hidden sm:flex right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white hover:bg-brand text-[#0F172A] hover:text-white border border-[#E2E8F0] hover:border-brand z-20 transition-all shadow-md hover:scale-110 active:scale-95" />
                  </Carousel>

                  {events.length > 1 && (
                    <div className="flex sm:hidden items-center justify-center gap-2 mt-4">
                      {events.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => carouselApi?.scrollTo(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentSlide
                              ? "w-6 bg-brand shadow-sm"
                              : "w-2 bg-gray-300 hover:bg-gray-400"
                          }`}
                          aria-label={`Lihat slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 sm:py-12 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-gray-200 p-6 max-w-md mx-auto shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                    Belum Ada Event Aktif Saat Ini
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1 leading-relaxed">
                    Saat ini belum ada event maraton yang sedang berlangsung.
                    Silakan cek kembali nanti atau hubungi pihak penyelenggara.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── 4. HOW IT WORKS (4 STEPS FORMULA) ────────────────────────────── */}
        <section className="py-10 sm:py-16 px-4 max-w-screen-xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <Badge
              variant="outline"
              className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-1.5 font-semibold"
            >
              Alur Penggunaan
            </Badge>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#0F172A]">
              Alur Kerja Sepoto
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-1">
              Dapat kan foto aksi Anda hanya dalam 4 langkah praktis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {[
              {
                step: "01",
                icon: User,
                title: "Input Nomor BIB",
                desc: "Masuk ke portal event, ketik Nama dan Nomor Dada (BIB) Anda.",
              },
              {
                step: "02",
                icon: ImageIcon,
                title: "Pilih Foto Aksi",
                desc: "Pratinjau foto hasil jepretan fotografer official dengan watermark.",
              },
              {
                step: "03",
                icon: QrCode,
                title: "Bayar via QRIS",
                desc: "Scan kode QRIS praktis via m-banking atau e-wallet pilihan Anda.",
              },
              {
                step: "04",
                icon: Download,
                title: "Unduh Kualitas HD",
                desc: "Selesai bayar, unduh foto resolusi asli tanpa watermark langsung.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <Card
                key={step}
                className="bg-white border-[#E2E8F0] rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                <span className="font-bib text-3xl sm:text-4xl font-black text-slate-100 group-hover:text-brand/10 transition-colors absolute top-2 right-3 select-none">
                  {step}
                </span>
                <div className="w-11 h-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-brand group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mb-1">
                  {title}
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── 5. SHOWCASE PREVIEW GALLERY ──────────────────────────────────── */}
        <section className="py-10 sm:py-16 bg-[#0F172A] text-white px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center max-w-md mx-auto mb-6 sm:mb-10">
              <Badge
                variant="outline"
                className="font-bib text-[10px] sm:text-xs uppercase text-amber-400 border-amber-400/30 bg-amber-400/10 mb-1.5 font-semibold"
              >
                Galeri Preview Foto
              </Badge>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white">
                Hasil Jepretan Fotografer Official
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Seluruh foto dilindungi watermark otomatis sebelum transaksi
                selesai.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {SAMPLE_PHOTOS.map((photo) => (
                <motion.div
                  key={photo.id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedSamplePhoto(photo)}
                  className="cursor-pointer"
                >
                  <Card className="bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg group">
                    <div className="relative aspect-[4/5] bg-[#0F172A] overflow-hidden">
                      <ProtectedPhoto
                        src={photo.url}
                        alt={`Foto sample ${photo.bib}`}
                        className="w-full h-full"
                        imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                        <Badge className="font-bib text-[9px] sm:text-[10px] bg-brand text-white border-0 shadow px-1.5 py-0.5 font-bold">
                          #{photo.bib}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Badge className="bg-white/90 text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Preview
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between text-white bg-[#1E293B]">
                      <div className="truncate max-w-[65%]">
                        <p className="text-[11px] font-semibold text-slate-200 truncate">
                          {photo.author}
                        </p>
                        <p className="text-[9px] text-slate-400 truncate">
                          {photo.eventName}
                        </p>
                      </div>
                      <span className="font-bib text-xs text-brand font-bold shrink-0">
                        {photo.price}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-6 sm:mt-10">
              <Button
                onClick={() => navigate("/login")}
                className="bg-brand hover:bg-[#C2410C] text-white font-bold text-xs sm:text-sm h-11 px-6 rounded-xl shadow-lg shadow-orange-600/30"
              >
                <span>Masuk & Telusuri Ribuan Foto Lainnya</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* ─── 6. TESTIMONIALS & CREDIBILITY ────────────────────────────────── */}
        <section className="py-10 sm:py-16 px-4 max-w-screen-xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
            <Badge
              variant="outline"
              className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-1.5 font-semibold"
            >
              Testimoni Peserta
            </Badge>
            <h2 className="text-xl sm:text-3xl font-extrabold text-[#0F172A]">
              Apa Kata Peserta Event & Fotografer?
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] mt-1">
              Pengalaman nyata mengunduh foto terbaik maraton bersama Sepoto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {TESTIMONIALS.map((testi) => (
              <Card
                key={testi.id}
                className="bg-white border-[#E2E8F0] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400">
                      {[...Array(testi.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold text-brand border-brand/30 bg-brand/5"
                    >
                      {testi.tag}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-[#475569] italic leading-relaxed">
                    "{testi.content}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-4">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0F172A]">
                    {testi.name}
                  </h4>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    {testi.role}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ─── 7. FAQ ACCORDION SECTION ──────────────────────────────────────── */}
        <section className="py-10 sm:py-16 bg-[#FAFBFD] border-t border-[#E2E8F0] px-4">
          <div className="max-w-screen-md mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <Badge
                variant="outline"
                className="font-bib text-[10px] sm:text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-1.5 font-semibold"
              >
                Tanya Jawab
              </Badge>
              <h2 className="text-xl sm:text-3xl font-extrabold text-[#0F172A]">
                Pertanyaan Sering Diajukan (FAQ)
              </h2>
              <p className="text-xs sm:text-sm text-[#475569] mt-1">
                Semua yang perlu Anda ketahui mengenai platform Sepoto.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <Card
                    key={idx}
                    className="bg-white border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-[#0F172A] min-h-[48px] hover:text-brand transition-colors"
                    >
                      <span className="flex items-center gap-2.5">
                        <HelpCircle className="w-4 h-4 text-brand shrink-0" />
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
                          isOpen ? "rotate-180 text-brand" : ""
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-[#475569] leading-relaxed border-t border-slate-100 pt-3">
                            {item.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── 8. HIGH-URGENCY FINAL CTA BANNER ──────────────────────────────── */}
        <section className="py-12 sm:py-20 px-4 max-w-screen-xl mx-auto">
          <div className="bg-[#0F172A] rounded-2xl sm:rounded-3xl p-6 sm:p-14 text-white text-center shadow-xl relative overflow-hidden border border-slate-800">
            <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 relative z-10">
              <Badge className="bg-brand text-white font-bib text-[10px] uppercase px-3 py-1 rounded-full font-bold">
                Momen Emas Anda
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Siap Menemukan Foto Terbaik Maraton Anda?
              </h2>
              <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-xl mx-auto">
                Cari via Nomor BIB Dada dan unduh versi kualitas HD tanpa
                watermark sekarang juga.
              </p>
              <div className="pt-2">
                <Button
                  onClick={() => navigate("/login")}
                  size="lg"
                  className="w-full sm:w-auto min-h-[52px] px-8 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 mx-auto active:scale-95"
                >
                  <Search className="w-5 h-5" />
                  <span>Cari Foto BIB Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 9. SOCIAL PROOF & METRICS BAR (BELOW FINAL CTA) ──────────────── */}
        <section className="py-6 sm:py-10 bg-slate-900 text-white border-y border-slate-800">
          <div className="max-w-screen-xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl sm:text-4xl font-extrabold font-bib text-brand">
                  10.000+
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">
                  Foto High-Res Terunggah
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl sm:text-4xl font-extrabold font-bib text-white">
                  50+
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">
                  Event Olahraga Nasional
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl sm:text-4xl font-extrabold font-bib text-emerald-400">
                  99.8%
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">
                  QRIS Instant Approval
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-2xl sm:text-4xl font-extrabold font-bib text-amber-400">
                  HD 100%
                </p>
                <p className="text-[11px] sm:text-xs text-slate-300 mt-1 font-medium">
                  Bebas Watermark Setelah Bayar
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ────────────────────────────────────────────────────────── */}
        <footer className="bg-white border-t border-[#E2E8F0] pt-8 pb-24 sm:pb-8 px-4 text-center">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
              <SepotoLogo size="md" />
              <span className="text-xs text-[#94A3B8]">
                © 2026 Sepoto. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#475569] flex-wrap justify-center">
              <Link to="/login" className="hover:text-brand transition-colors">
                Portal Peserta
              </Link>
            </div>
          </div>
        </footer>

        {/* ─── STICKY MOBILE QUICK-ACTION BAR (MOBILE ONLY) ────────────────────── */}
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 shadow-2xl"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
        >
          <Button
            onClick={() => navigate("/login")}
            className="w-full bg-brand hover:bg-[#C2410C] text-white font-bold text-xs min-h-[48px] rounded-xl shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Cari Foto BIB Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* ─── MODAL PREVIEW SAMPLE PHOTO ─────────────────────────────────────── */}
        <Dialog
          open={Boolean(selectedSamplePhoto)}
          onOpenChange={(open) => {
            if (!open) setSelectedSamplePhoto(null);
          }}
        >
          <DialogContent className="bg-white border border-[#E2E8F0] rounded-3xl p-5 max-w-md shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#0F172A]">
                Pratinjau Foto BIB #{selectedSamplePhoto?.bib}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#475569]">
                {selectedSamplePhoto?.eventName} • Fotografer:{" "}
                {selectedSamplePhoto?.author}
              </DialogDescription>
            </DialogHeader>

            {selectedSamplePhoto && (
              <div className="my-2 space-y-3">
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <ProtectedPhoto
                    src={selectedSamplePhoto.url}
                    alt={`Preview BIB ${selectedSamplePhoto.bib}`}
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-brand text-white font-bib text-xs font-bold">
                      #{selectedSamplePhoto.bib}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <span className="text-slate-600">Harga Foto HD:</span>
                  <span className="font-bold text-brand text-sm font-bib">
                    {selectedSamplePhoto.price}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-2 flex gap-2">
              <Button
                onClick={() => setSelectedSamplePhoto(null)}
                variant="outline"
                className="flex-1 text-xs h-11 rounded-xl"
              >
                Tutup
              </Button>
              <Button
                onClick={() => {
                  setSelectedSamplePhoto(null);
                  navigate("/login");
                }}
                className="flex-1 bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-11 rounded-xl shadow-md"
              >
                Beli Foto
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}

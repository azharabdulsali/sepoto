import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Camera, User, ShieldCheck, Aperture, ArrowRight,
  Sparkles, QrCode, Download, Image as ImageIcon,
  ChevronRight, Search, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppShell from '../components/AppShell';

// ─── Animation Variants (Framer Motion) ────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// Sample photos for preview showcase
const SAMPLE_PHOTOS = [
  { id: 101, url: 'https://picsum.photos/seed/sepoto10/400/500', bib: '101', price: 'Rp 25.000', author: 'Reza Foto' },
  { id: 205, url: 'https://picsum.photos/seed/sepoto6/400/500', bib: '205', price: 'Rp 30.000', author: 'Dian Lens' },
  { id: 312, url: 'https://picsum.photos/seed/sepoto10/400/500', bib: '312', price: 'Rp 15.000', author: 'Reza Foto' },
  { id: 404, url: 'https://picsum.photos/seed/sepoto8/400/500', bib: '101', price: 'Rp 25.000', author: 'Reza Foto' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [demoBib, setDemoBib] = useState('');

  return (
    <AppShell>
      <div className="relative overflow-hidden bg-white text-[#111827]">

        {/* Decorative ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] bg-gradient-to-b from-orange-500/12 via-amber-500/5 to-transparent pointer-events-none blur-3xl" />

        {/* ─── 1. HERO SECTION ────────────────────────────────────────── */}
        <section className="relative pt-10 pb-14 md:pt-16 md:pb-20 px-4 max-w-screen-xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-6"
          >
            {/* Top Badge */}
            <motion.div variants={itemVariants}>
              <Badge className="font-bib text-xs tracking-widest bg-brand/10 text-brand border border-brand/20 px-3.5 py-1.5 rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand" />
                PLATFORM FOTO EVENT & UNDUH DIGITAL NO. 1
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#111827] leading-[1.15]"
            >
              Abadikan Setiap Momen Terbaik di{' '}
              <span className="text-gradient-brand px-1">
                Sepoto
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-[#4B5563] max-w-2xl leading-relaxed font-medium"
            >
              Temukan foto maraton, bersepeda, & olahraga Anda secara instan dengan sistem pencarian{' '}
              <span className="font-bold text-[#111827]">Nomor BIB (Nomor Dada)</span>. Pembayaran QRIS praktis & unduh kualitas HD tanpa watermark.
            </motion.p>

            {/* Main Hero Action Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full sm:w-auto"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button
                  id="hero-cta-user"
                  onClick={() => navigate('/login')}
                  size="lg"
                  className="w-full sm:w-auto h-13 px-8 bg-brand hover:bg-[#C2410C] text-white font-bold text-base rounded-2xl shadow-xl shadow-orange-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <User className="w-5 h-5" />
                  <span>Cari Foto Saya (BIB)</span>
                  <ArrowRight className="w-5 h-5 opacity-80" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
                <Button
                  id="hero-cta-photographer"
                  onClick={() => navigate('/photographer/login')}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-13 px-7 border-[#E5E7EB] hover:border-blue-500/40 text-[#111827] hover:text-blue-600 bg-white font-bold text-sm rounded-2xl shadow-sm flex items-center justify-center gap-2"
                >
                  <Aperture className="w-4 h-4 text-blue-600" />
                  <span>Portal Fotografer</span>
                </Button>
              </motion.div>
            </motion.div>

            {/* Live Search Mockup Input Bar */}
            <motion.div variants={itemVariants} className="w-full max-w-md pt-4">
              <Card className="bg-white border border-[#E5E7EB] shadow-lg rounded-2xl p-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={demoBib}
                    onChange={(e) => setDemoBib(e.target.value)}
                    placeholder="Ketik Nomor BIB Anda (misal: 101)..."
                    className="pl-10 h-10 border-0 bg-transparent text-sm font-bib focus-visible:ring-0"
                  />
                </div>
                <Button
                  onClick={() => navigate('/login')}
                  size="sm"
                  className="bg-brand text-white font-bold text-xs h-9 px-4 rounded-xl shrink-0"
                >
                  Cari
                </Button>
              </Card>
              <p className="text-[11px] text-[#9CA3AF] mt-2">Contoh: Ketik <strong>101</strong> atau <strong>205</strong> untuk melihat contoh foto</p>
            </motion.div>
          </motion.div>

          {/* ─── 2. QUICK ACCESS PORTAL CARDS (3 ROLES) ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16 md:mt-24"
          >
            <div className="text-center max-w-md mx-auto mb-10">
              <Badge variant="outline" className="font-bib text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-2">
                Hak Akses Pengguna
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">
                Pilih Portal Akses Anda
              </h2>
              <p className="text-sm text-[#4B5563] mt-1">
                Masuk sesuai peran Anda di dalam sistem Sepoto
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">

              {/* CARD 1: PESERTA */}
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="h-full bg-white border border-[#E5E7EB] hover:border-brand/50 shadow-md hover:shadow-2xl hover:shadow-orange-900/10 transition-all rounded-3xl overflow-hidden p-6 flex flex-col justify-between group relative">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-brand" />

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors shadow-sm">
                        <User className="w-6 h-6" />
                      </div>
                      <Badge className="font-bib text-[10px] uppercase bg-brand/10 text-brand border-brand/20">
                        Peserta Event
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#111827]">Portal Peserta</h3>
                      <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                        Cari foto aksi marathon/event Anda berdasarkan Nama & Nomor BIB.
                      </p>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs text-[#4B5563]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Pencarian otomatis berdasarkan BIB</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Pembayaran cepat via QRIS Statis</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Unduh file foto resolusi tinggi (HD)</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    id="portal-card-user"
                    onClick={() => navigate('/login')}
                    className="w-full mt-6 bg-[#191C21] hover:bg-brand text-white font-bold text-xs h-12 rounded-2xl transition-all flex items-center justify-between shadow-md"
                  >
                    <span>Masuk ke Portal Peserta</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Card>
              </motion.div>

              {/* CARD 2: FOTOGRAFER */}
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="h-full bg-white border border-[#E5E7EB] hover:border-blue-500/50 shadow-md hover:shadow-2xl hover:shadow-blue-900/10 transition-all rounded-3xl overflow-hidden p-6 flex flex-col justify-between group relative">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                        <Aperture className="w-6 h-6" />
                      </div>
                      <Badge className="font-bib text-[10px] uppercase bg-blue-50 text-blue-600 border-blue-200">
                        Fotografer
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#111827]">Portal Fotografer</h3>
                      <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                        Upload hasil jepretan Anda, atur harga jual, dan tag BIB peserta sekaligus.
                      </p>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs text-[#4B5563]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Bulk Drag & Drop Photo Upload</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Atur Harga & Tag BIB Massal</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Otomatisasi watermark pelindung</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    id="portal-card-photographer"
                    onClick={() => navigate('/photographer/login')}
                    className="w-full mt-6 bg-[#191C21] hover:bg-blue-600 text-white font-bold text-xs h-12 rounded-2xl transition-all flex items-center justify-between shadow-md"
                  >
                    <span>Masuk ke Portal Fotografer</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Card>
              </motion.div>

              {/* CARD 3: SUPER ADMIN */}
              <motion.div
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="h-full bg-white border border-[#E5E7EB] hover:border-red-500/50 shadow-md hover:shadow-2xl hover:shadow-red-900/10 transition-all rounded-3xl overflow-hidden p-6 flex flex-col justify-between group relative">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600" />

                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <Badge className="font-bib text-[10px] uppercase bg-red-50 text-red-600 border-red-200">
                        Super Admin
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-[#111827]">Dashboard Admin</h3>
                      <p className="text-xs text-[#4B5563] mt-1.5 leading-relaxed">
                        Pusat kendali event, verifikasi bukti pembayaran QRIS, & impor CSV.
                      </p>
                    </div>

                    <ul className="space-y-2 pt-2 border-t border-[#F3F4F6] text-xs text-[#4B5563]">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Verifikasi & Approval Transaksi</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Impor Peserta via CSV/Excel</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Pengaturan QRIS Statis Event</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    id="portal-card-admin"
                    onClick={() => navigate('/admin/login')}
                    className="w-full mt-6 bg-[#191C21] hover:bg-red-600 text-white font-bold text-xs h-12 rounded-2xl transition-all flex items-center justify-between shadow-md"
                  >
                    <span>Masuk ke Dashboard Admin</span>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Card>
              </motion.div>

            </div>
          </motion.div>
        </section>

        {/* ─── 3. SHOWCASE PREVIEW GRID ────────────────────────────────── */}
        <section className="py-16 px-4 max-w-screen-xl mx-auto">
          <div className="text-center max-w-md mx-auto mb-10">
            <Badge variant="outline" className="font-bib text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-2">
              Preview Foto Event
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">Hasil Jepretan Kualitas HD</h2>
            <p className="text-sm text-[#4B5563] mt-1">Setiap foto dilengkapi watermark otomatis sebelum dibeli peserta.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {SAMPLE_PHOTOS.map((photo) => (
              <motion.div key={photo.id} whileHover={{ y: -4 }}>
                <Card className="bg-[#191C21] rounded-2xl overflow-hidden border border-white/10 shadow-md">
                  <div className="relative aspect-[4/5] bg-[#22262E] overflow-hidden">
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2">
                      <Badge className="font-bib text-[10px] bg-brand text-white border-0 shadow">
                        #{photo.bib}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 flex items-center justify-between text-white">
                    <span className="text-[11px] text-gray-400">{photo.author}</span>
                    <span className="font-bib text-xs text-brand font-bold">{photo.price}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button
              onClick={() => navigate('/login')}
              variant="link"
              className="text-brand font-bold text-sm"
            >
              Lihat Lebih Banyak Foto di Galeri →
            </Button>
          </div>
        </section>

        {/* ─── 4. CARA KERJA / FEATURES SECTION ────────────────────────── */}
        <section className="py-16 bg-[#F9FAFB] border-y border-[#E5E7EB] px-4">
          <div className="max-w-screen-xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-12">
              <Badge variant="outline" className="font-bib text-xs uppercase text-brand border-brand/20 bg-brand/5 mb-2">
                Alur Praktis
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#111827]">Bagaimana Sepoto Bekerja?</h2>
              <p className="text-sm text-[#4B5563] mt-1">4 langkah sederhana dari pencarian hingga unduhan foto tanpa watermark.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: User,
                  title: 'Input Nomor BIB',
                  desc: 'Masuk dengan Nama & Nomor Dada peserta event Anda.',
                },
                {
                  step: '02',
                  icon: ImageIcon,
                  title: 'Pilih Foto Aksi',
                  desc: 'Telusuri foto aksi beresolusi tinggi hasil jepretan fotografer pro.',
                },
                {
                  step: '03',
                  icon: QrCode,
                  title: 'Bayar via QRIS',
                  desc: 'Scan QR Code QRIS statis via m-banking atau e-wallet pilihan Anda.',
                },
                {
                  step: '04',
                  icon: Download,
                  title: 'Unduh Foto HD',
                  desc: 'Setelah pembayaran disetujui, foto asli tanpa watermark siap diunduh.',
                },
              ].map(({ step, icon: Icon, title, desc }) => (
                <Card key={step} className="bg-white border-[#E5E7EB] rounded-2xl p-6 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <span className="font-bib text-4xl font-bold text-gray-100 absolute top-3 right-4 select-none">
                    {step}
                  </span>
                  <div className="w-11 h-11 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-[#111827] mb-1">{title}</h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed">{desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ─── 5. STATS BANNER ────────────────────────────────────────── */}
        <section className="py-14 px-4 max-w-screen-xl mx-auto">
          <div className="bg-[#191C21] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center relative z-10">
              <div>
                <p className="text-3xl sm:text-4xl font-bold font-bib text-brand">10.000+</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Foto Event Terupload</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold font-bib text-white">500+</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Peserta Terdaftar</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold font-bib text-brand">100%</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Sistem QRIS Aman</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold font-bib text-white">HD</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Kualitas Foto Maksimal</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 6. FOOTER ──────────────────────────────────────────────── */}
        <footer className="bg-white border-t border-[#E5E7EB] py-8 px-4 text-center">
          <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-sm">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base text-[#111827]">Sepoto</span>
              <span className="text-xs text-[#9CA3AF]">© 2026 Sepoto. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-[#4B5563]">
              <Link to="/login" className="hover:text-brand transition-colors">Portal Peserta</Link>
              <span>·</span>
              <Link to="/photographer/login" className="hover:text-blue-600 transition-colors">Portal Fotografer</Link>
              <span>·</span>
              <Link to="/admin/login" className="hover:text-red-600 transition-colors">Portal Admin</Link>
            </div>
          </div>
        </footer>

      </div>
    </AppShell>
  );
}

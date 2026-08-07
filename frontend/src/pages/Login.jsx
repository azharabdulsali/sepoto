import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Loader2, AlertCircle, User, LogIn, Clock, Calendar, Trophy, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SepotoLogo from '../components/SepotoLogo';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();

  const [activeTab, setActiveTab] = useState('user'); // 'user' | 'admin'

  // Form state for Peserta
  const [fullName, setFullName]   = useState('');
  const [bibNumber, setBibNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');

  // Form state for Admin & Photographer
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  // Multi-event selector state
  const [eventsList, setEventsList]             = useState([]);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [selectingEventId, setSelectingEventId] = useState(null);

  const sessionExpired = location.state?.sessionExpired;

  /** Redirect berdasarkan role user setelah login berhasil */
  const getRedirectPath = (role) => {
    if (role === 'user') return '/gallery';
    if (role === 'super_admin' || role === 'admin') return '/admin/dashboard';
    if (role === 'photographer') return '/photographer/dashboard';
    return '/';
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    let payload = {};
    if (activeTab === 'user') {
      if (!fullName.trim() || !bibNumber.trim() || !birthDate.trim()) {
        setError('Nama Lengkap, Nomor BIB, dan Tanggal Lahir wajib diisi.');
        return;
      }
      payload = { role: 'user', name: fullName.trim(), bibNumber: bibNumber.trim(), birthDate: birthDate.trim() };
    } else {
      if (!username.trim() || !password.trim()) {
        setError('Username dan Password wajib diisi.');
        return;
      }
      payload = { username: username.trim(), password: password.trim() };
    }

    setIsLoading(true);
    try {
      const res = await api.loginUnified(payload);
      if (!res.success) {
        setError(res.message || 'Data login tidak valid. Coba lagi.');
        return;
      }

      // ── Handle Multi-Event Selection ──
      if (res.selectEventRequired && res.events && res.events.length > 0) {
        setEventsList(res.events);
        setShowEventDialog(true);
        return;
      }

      login(res.user, res.token, res.availableEvents);
      navigate(getRedirectPath(res.user.role));
    } catch {
      setError('Gagal terhubung ke server. Coba lagi.');
    } finally { setIsLoading(false); }
  };

  const handleSelectEvent = async (targetEventId) => {
    setSelectingEventId(targetEventId);
    setError('');
    try {
      const payload = activeTab === 'user'
        ? { role: 'user', name: fullName.trim(), bibNumber: bibNumber.trim(), birthDate: birthDate.trim(), eventId: targetEventId }
        : { username: username.trim(), password: password.trim(), eventId: targetEventId };

      const res = await api.loginUnified(payload);
      if (!res.success) {
        setError(res.message || 'Gagal masuk ke event ini. Coba lagi.');
        setShowEventDialog(false);
        return;
      }
      setShowEventDialog(false);
      login(res.user, res.token, res.availableEvents);
      navigate('/gallery');
    } catch {
      setError('Gagal terhubung ke server. Coba lagi.');
    } finally {
      setSelectingEventId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1015] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden text-white">

      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Top indicator strip */}
      <div className="fixed top-0 left-0 right-0 h-1 gradient-brand z-50" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative z-10"
      >
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="mb-2 hover:opacity-90 transition-opacity">
            <SepotoLogo size="xl" variant="light" />
          </Link>
          <Badge className="mt-2 font-bib tracking-widest text-[10px] bg-brand/10 text-brand border border-brand/20 px-3 py-1">
            SEPOTO LOGIN
          </Badge>
        </div>

        {/* Card Form */}
        <Card className="bg-[#191C21]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-3xl relative !overflow-visible">
          <CardHeader className="border-b border-white/5 pb-4 pt-6 px-6">
            <div className="flex items-center justify-between mb-2">
              <Badge className="font-bib text-[10px] tracking-widest bg-brand/10 text-brand border border-brand/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse mr-1.5" />
                PORTAL LOGIN
              </Badge>
              <LogIn className="w-4 h-4 text-brand/60" />
            </div>
            <div className="text-white text-xl font-bold">Masuk ke Sepoto</div>
            <div className="text-gray-400 text-xs mt-1 leading-relaxed">
              Silakan pilih kategori akun Anda untuk masuk.
            </div>
          </CardHeader>

          <CardContent className="pt-5 px-6">
            {/* Tab Switcher */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-5">
              <button
                type="button"
                onClick={() => { setActiveTab('user'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'user'
                    ? 'bg-brand text-white shadow-lg shadow-orange-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Peserta Event</span>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('admin'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-brand text-white shadow-lg shadow-orange-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin / Foto</span>
              </button>
            </div>

            {sessionExpired && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <Alert className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-2xl p-3.5 shadow-sm flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <AlertTitle className="text-xs font-bold text-amber-300">Sesi Login Berakhir</AlertTitle>
                    <AlertDescription className="text-xs text-amber-400/90 mt-0.5 leading-relaxed">
                      Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan login kembali.
                    </AlertDescription>
                  </div>
                </Alert>
              </motion.div>
            )}

            <form id="unified-login-form" onSubmit={handleLogin} className="space-y-4" noValidate>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* ─── TAB 1: FORM PESERTA EVENT ─────────────────────────── */}
              {activeTab === 'user' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Nama Lengkap */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-fullname" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                      Nama Lengkap Peserta
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand/70 pointer-events-none z-10" />
                      <Input
                        id="login-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); setError(''); }}
                        placeholder="Contoh: Budi Santoso"
                        disabled={isLoading}
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-brand/60 focus-visible:ring-brand/20 rounded-xl text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Nomor BIB */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-bib" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                      Nomor BIB Peserta
                    </label>
                    <div className="relative">
                      <Trophy className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand/70 pointer-events-none z-10" />
                      <Input
                        id="login-bib"
                        type="text"
                        required
                        value={bibNumber}
                        onChange={(e) => { setBibNumber(e.target.value); setError(''); }}
                        placeholder="Contoh: 1001 atau BIB-05"
                        disabled={isLoading}
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-bib focus-visible:border-brand/60 focus-visible:ring-brand/20 rounded-xl text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Tanggal Lahir */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-birthdate" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                        Tanggal Lahir
                      </label>
                      <span className="text-[10px] text-gray-500">Pilih dari Kalender</span>
                    </div>
                    <DatePicker
                      id="login-birthdate"
                      value={birthDate}
                      onChange={(val) => { setBirthDate(val); setError(''); }}
                      placeholder="Pilih Tanggal Lahir"
                      disabled={isLoading}
                      variant="dark"
                      position="top"
                    />
                   
                  </div>
                </motion.div>
              )}

              {/* ─── TAB 2: FORM ADMIN & FOTOGRAFER ────────────────────── */}
              {activeTab === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {/* Username */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-username" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                      Username Akun
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                      <Input
                        id="login-username"
                        type="text"
                        autoComplete="username"
                        required
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                        placeholder="Masukkan username Anda"
                        disabled={isLoading}
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-brand/60 focus-visible:ring-brand/20 rounded-xl text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                      Password Akun
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        placeholder="••••••••"
                        disabled={isLoading}
                        className="pl-10 pr-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-bib focus-visible:border-brand/60 focus-visible:ring-brand/20 rounded-xl text-sm transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={isLoading}
                        tabIndex={-1}
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors focus:outline-none p-1 rounded-md z-10"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-brand" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400 hover:text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  id="unified-login-submit"
                  type="submit"
                  disabled={
                    isLoading ||
                    (activeTab === 'user' && (!fullName.trim() || !bibNumber.trim() || !birthDate.trim())) ||
                    (activeTab === 'admin' && (!username.trim() || !password.trim()))
                  }
                  className="w-full h-12 bg-brand hover:bg-[#C2410C] text-white font-bold rounded-xl shadow-lg shadow-orange-600/25 gap-2 text-sm mt-2 transition-all"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Memverifikasi...</span></>
                  ) : (
                    <><span>Masuk</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-1.5 bg-white/[0.02] border-t border-white/5 py-4 px-6">
            {activeTab === 'user' ? (
              <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                <strong className="text-brand">Peserta Event:</strong> Gunakan Nama Lengkap, Nomor BIB & Tanggal Lahir sesuai pendaftaran event Anda.
              </p>
            ) : (
              <p className="text-[11px] text-gray-500 text-center leading-relaxed">
                <strong className="text-brand">Fotografer / Admin:</strong> Masuk menggunakan Username & Password terdaftar.
              </p>
            )}
          </CardFooter>
        </Card>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </motion.div>

      {/* ─── Multi-Event Selection Dialog ──────────────────────────────── */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-[#191C21] border border-white/10 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-brand/10 text-brand border border-brand/20 flex items-center justify-center mb-2">
              <Trophy className="w-5 h-5" />
            </div>
            <DialogTitle className="text-white text-lg font-bold">
              Pilih Event Anda
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs mt-1 leading-relaxed">
              Nama & BIB <strong className="text-white">{username} (#{password})</strong> terdaftar pada beberapa event. Silakan pilih event yang ingin Anda buka:
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {eventsList.map((item) => {
              const isSelecting = selectingEventId === item.eventId;
              return (
                <button
                  key={item.eventId}
                  disabled={Boolean(selectingEventId)}
                  onClick={() => handleSelectEvent(item.eventId)}
                  className="w-full text-left p-4 rounded-2xl bg-white/5 hover:bg-brand/15 border border-white/10 hover:border-brand/40 transition-all group flex items-center justify-between gap-3 disabled:opacity-50"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-brand transition-colors truncate">
                        {item.eventName}
                      </span>
                    </div>
                    {item.eventDate && (
                      <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-brand/70" />
                        <span>{new Date(item.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </p>
                    )}
                    <p className="text-[10px] font-bib text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full inline-block mt-1">
                      BIB #{item.bibNumber}
                    </p>
                  </div>

                  <div className="shrink-0 text-gray-400 group-hover:text-brand transition-colors">
                    {isSelecting ? (
                      <Loader2 className="w-5 h-5 animate-spin text-brand" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, ArrowRight, Hash, Loader2, AlertCircle, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';

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

  const [fullName, setFullName]   = useState('');
  const [bibNumber, setBibNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !bibNumber.trim()) { setError('Nama Lengkap dan Nomor BIB wajib diisi.'); return; }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      login({ name: fullName.trim(), bibNumber: bibNumber.trim(), role: 'user', eventId: 1 });
      navigate('/gallery');
    } catch {
      setError('Nama atau Nomor BIB tidak ditemukan. Pastikan data sesuai kartu peserta.');
    } finally { setIsLoading(false); }
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
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shadow-xl shadow-orange-600/30 mb-3 glow-brand cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Camera className="w-8 h-8 text-white" strokeWidth={2.2} />
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sepoto</h1>
          <Badge className="mt-2 font-bib tracking-widest text-[10px] bg-brand/10 text-brand border border-brand/20 px-3 py-1">
            PORTAL PESERTA EVENT
          </Badge>
        </div>

        {/* Card Form */}
        <Card className="bg-[#191C21]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-5 pt-6 px-6">
            <div className="flex items-center justify-between">
              <Badge className="font-bib text-[10px] tracking-widest bg-brand/10 text-brand border border-brand/20">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse mr-1.5" />
                VERIFIKASI BIB
              </Badge>
              <Sparkles className="w-4 h-4 text-brand/60" />
            </div>
            <div className="text-white text-xl font-bold mt-2">Temukan Foto Anda</div>
            <div className="text-gray-400 text-xs mt-1 leading-relaxed">
              Masukkan Nama & Nomor BIB sesuai kartu peserta event Anda.
            </div>
          </CardHeader>

          <CardContent className="pt-6 px-6">
            <form id="user-login-form" onSubmit={handleLogin} className="space-y-4.5" noValidate>

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

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label htmlFor="login-fullname" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                  Nama Lengkap Peserta
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="login-fullname"
                    type="text"
                    autoComplete="name"
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
                  Nomor BIB (Nomor Dada)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="login-bib"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={bibNumber}
                    onChange={(e) => { setBibNumber(e.target.value); setError(''); }}
                    placeholder="Contoh: 105"
                    disabled={isLoading}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-bib focus-visible:border-brand/60 focus-visible:ring-brand/20 rounded-xl text-sm transition-all"
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  id="user-login-submit"
                  type="submit"
                  disabled={isLoading || !fullName.trim() || !bibNumber.trim()}
                  className="w-full h-12 bg-brand hover:bg-[#C2410C] text-white font-bold rounded-xl shadow-lg shadow-orange-600/25 gap-2 text-sm mt-2 transition-all"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Memverifikasi BIB...</span></>
                  ) : (
                    <><span>Masuk ke Galeri Foto</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2 bg-white/[0.02] border-t border-white/5 py-4 px-6">
            <p className="text-[11px] text-gray-500 text-center">Nama & BIB belum terdaftar? Hubungi panitia event.</p>
            <div className="flex items-center gap-3 text-[11px] mt-1">
              <Link to="/photographer/login" id="link-photographer-login" className="text-gray-400 hover:text-blue-400 transition-colors font-medium">Portal Fotografer</Link>
              <span className="text-gray-700">·</span>
              <Link to="/admin/login" id="link-admin-login" className="text-gray-400 hover:text-red-400 transition-colors font-medium">Login Admin</Link>
            </div>
          </CardFooter>
        </Card>

        {/* Back link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-xs text-gray-400 hover:text-white transition-colors">
            ← Kembali ke Dashboard Utama
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
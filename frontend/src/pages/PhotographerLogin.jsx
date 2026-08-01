import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
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

export default function PhotographerLogin() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Email dan Password wajib diisi.'); return; }
    setIsLoading(true);
    try {
      const res = await api.loginPhotographer(email.trim(), password);
      if (!res.success) {
        setError(res.message || 'Username atau Password salah. Pastikan akun fotografer Anda sudah dibuat oleh Admin.');
        return;
      }
      login(res.user, res.token);
      navigate('/photographer/dashboard');
    } catch {
      setError('Gagal terhubung ke server. Coba lagi.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#060911] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden text-white">

      {/* Ambient background glow biru */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Blue top bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400 z-50" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link to="/" className="mb-2 hover:opacity-90 transition-opacity">
            <SepotoLogo size="xl" variant="light" />
          </Link>
          <Badge className="mt-2 font-bib tracking-widest text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1">
            PHOTOGRAPHER PORTAL
          </Badge>
        </div>

        {/* Card */}
        <Card className="bg-[#191C21]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-5 pt-6 px-6">
            <div className="flex items-center justify-between">
              <Badge className="font-bib text-[10px] tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5" />
                FOTOGRAFER
              </Badge>
              <Sparkles className="w-4 h-4 text-blue-400/60" />
            </div>
            <div className="text-white text-xl font-bold mt-2">Portal Fotografer</div>
            <div className="text-gray-400 text-xs mt-1 leading-relaxed">
              Upload foto, atur harga, dan kelola hasil jepretanmu di satu tempat.
            </div>
          </CardHeader>

          <CardContent className="pt-6 px-6">
            <form id="photographer-login-form" onSubmit={handleLogin} className="space-y-4.5" noValidate>
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

              <div className="space-y-1.5">
                <label htmlFor="photographer-email" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="photographer-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="foto@email.com"
                    disabled={isLoading}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-blue-500/60 focus-visible:ring-blue-500/20 rounded-xl text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="photographer-password" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="photographer-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-bib focus-visible:border-blue-500/60 focus-visible:ring-blue-500/20 rounded-xl text-sm transition-all"
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  id="photographer-login-submit"
                  type="submit"
                  disabled={isLoading || !email.trim() || !password}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 gap-2 text-sm mt-2 transition-all"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Memverifikasi...</span></>
                  ) : (
                    <><span>Masuk ke Dashboard</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2 bg-white/[0.02] border-t border-white/5 py-4 px-6">
            <p className="text-[11px] text-gray-500 text-center">Belum punya akun? Hubungi Super Admin.</p>
            <div className="flex items-center gap-3 text-[11px] mt-1">
              <Link to="/login" id="photographer-to-user" className="text-gray-400 hover:text-brand transition-colors font-medium">← Portal Peserta</Link>
              <span className="text-gray-700">·</span>
              <Link to="/admin/login" id="photographer-to-admin" className="text-gray-400 hover:text-red-400 transition-colors font-medium">Login Admin</Link>
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

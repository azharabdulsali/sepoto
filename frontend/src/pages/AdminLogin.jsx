import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, ArrowRight, Lock, Mail, Loader2, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';
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

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate   = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) { setError('Username dan Password wajib diisi.'); return; }
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      login({ id: 1, name: username, role: 'super_admin', eventId: null });
      navigate('/admin/dashboard');
    } catch {
      setError('Username atau Password salah. Coba lagi.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden text-white">

      {/* Ambient background glow merah */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Red top bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 z-50" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-16 h-16 rounded-2xl bg-[#191C21] border border-red-500/30 flex items-center justify-center shadow-xl mb-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Camera className="w-8 h-8 text-red-500" strokeWidth={2} />
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sepoto</h1>
          <Badge className="mt-2 font-bib tracking-widest text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1">
            ADMIN CONTROL PANEL
          </Badge>
        </div>

        {/* Card */}
        <Card className="bg-[#191C21]/95 backdrop-blur-xl border border-white/10 text-white shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-5 pt-6 px-6">
            <div className="flex items-center justify-between">
              <Badge className="font-bib text-[10px] tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5" />
                SUPER ADMIN
              </Badge>
              <KeyRound className="w-4 h-4 text-red-500/60" />
            </div>
            <div className="text-white text-xl font-bold mt-2">Dashboard Admin</div>
            <div className="text-gray-400 text-xs mt-1 leading-relaxed">
              Masuk untuk mengelola event, verifikasi pembayaran, dan impor peserta.
            </div>
          </CardHeader>

          <CardContent className="pt-6 px-6">
            <form id="admin-login-form" onSubmit={handleLogin} className="space-y-4.5" noValidate>
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
                <label htmlFor="admin-username" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">Username</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="admin-username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(''); }}
                    placeholder="admin"
                    disabled={isLoading}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-red-500/60 focus-visible:ring-red-500/20 rounded-xl text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-bib focus-visible:border-red-500/60 focus-visible:ring-red-500/20 rounded-xl text-sm transition-all"
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Button
                  id="admin-login-submit"
                  type="submit"
                  disabled={isLoading || !username.trim() || !password}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 gap-2 text-sm mt-2 transition-all"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Memverifikasi...</span></>
                  ) : (
                    <><span>Masuk sebagai Admin</span><ArrowRight className="w-4 h-4" /></>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>

          <CardFooter className="bg-white/[0.02] border-t border-white/5 py-4 px-6 justify-center gap-3">
            <Link to="/login" id="admin-to-user" className="text-[11px] text-gray-400 hover:text-brand transition-colors font-medium">← Portal Peserta</Link>
            <span className="text-gray-700 text-[11px]">·</span>
            <Link to="/photographer/login" id="admin-to-photographer" className="text-[11px] text-gray-400 hover:text-blue-400 transition-colors font-medium">Portal Fotografer</Link>
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

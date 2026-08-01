import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, ArrowRight, Lock, Mail, Loader2, AlertCircle, Aperture } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';

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
      await new Promise((r) => setTimeout(r, 800));
      login({ id: 2, name: email.split('@')[0], role: 'photographer', eventId: 1 });
      navigate('/photographer/dashboard');
    } catch {
      setError('Email atau Password salah. Pastikan akun fotografer Anda sudah dibuat oleh Admin.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#080B12] flex flex-col">
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="relative w-14 h-14 rounded-2xl bg-[#191C21] border border-blue-500/30 flex items-center justify-center shadow-lg mb-3">
            <Aperture className="w-7 h-7 text-blue-400" strokeWidth={2} />
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Sepoto</h1>
          <Badge className="mt-2 font-bib tracking-widest text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20">
            PHOTOGRAPHER PORTAL
          </Badge>
        </div>

        {/* Card */}
        <Card
          className="w-full max-w-sm bg-[#191C21] text-white ring-0 border border-white/5 animate-fade-in-up"
          style={{ animationDelay: '0.08s' }}
        >
          <CardHeader className="border-b border-white/5 pb-5">
            <Badge className="w-fit mb-3 font-bib text-[10px] tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1" />
              Fotografer
            </Badge>
            <div className="text-white text-xl font-semibold">Portal Fotografer</div>
            <div className="text-gray-400 text-sm mt-1 leading-relaxed">
              Upload foto, atur harga, dan kelola hasil jepretanmu di satu tempat.
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <form id="photographer-login-form" onSubmit={handleLogin} className="space-y-4" noValidate>
              {error && (
                <div role="alert" className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="photographer-email" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="photographer-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="foto@email.com"
                    disabled={isLoading}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-blue-500/60 focus-visible:ring-blue-500/20 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="photographer-password" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="photographer-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-bib focus-visible:border-blue-500/60 focus-visible:ring-blue-500/20 rounded-xl"
                  />
                </div>
              </div>

              <Button
                id="photographer-login-submit"
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/30 gap-2 mt-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Memverifikasi...</span></>
                ) : (
                  <><span>Masuk ke Dashboard</span><ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2 bg-transparent border-t border-white/5 py-4">
            <p className="text-[11px] text-gray-500 text-center">Akun belum ada? Minta Super Admin untuk membuatkan akun fotografer.</p>
            <div className="flex items-center gap-3 text-[11px]">
              <Link to="/" id="photographer-back-to-user" className="text-gray-500 hover:text-brand transition-colors font-medium">← Login Peserta</Link>
              <span className="text-gray-700">·</span>
              <Link to="/admin/login" id="photographer-to-admin" className="text-gray-500 hover:text-red-400 transition-colors font-medium">Login Admin</Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-8 text-[11px] font-bib text-gray-600 opacity-50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          SEPOTO × AURALIS ENGINE — PHOTOGRAPHER ACCESS
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, ArrowRight, Hash, Loader2, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-white flex flex-col">
      <div className="w-full h-1 gradient-brand" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-lg glow-brand mb-3">
            <Camera className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Sepoto</h1>
          <Badge className="mt-2 font-bib tracking-widest text-[10px] bg-brand/10 text-brand border-brand/20">
            EVENT PHOTO GALLERY
          </Badge>
        </div>

        {/* Card Login — pakai Shadcn Card */}
        <Card
          className="w-full max-w-sm bg-[#191C21] text-white ring-0 border border-white/5 animate-fade-in-up"
          style={{ animationDelay: '0.08s' }}
        >
          <CardHeader className="border-b border-white/5 pb-5">
            <Badge className="w-fit mb-3 font-bib text-[10px] tracking-widest bg-brand/10 text-brand border border-brand/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse mr-1" />
              Akses Peserta
            </Badge>
            <div className="text-white text-xl font-semibold">Temukan Foto Anda</div>
            <div className="text-gray-400 text-sm mt-1 leading-relaxed">
              Masukkan Nama & Nomor BIB sesuai kartu peserta untuk mengakses galeri.
            </div>
          </CardHeader>

          <CardContent className="pt-5">
            <form id="user-login-form" onSubmit={handleLogin} className="space-y-4" noValidate>

              {error && (
                <div role="alert" className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label htmlFor="login-fullname" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
                  <Input
                    id="login-fullname"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(''); }}
                    placeholder="Contoh: Budi Santoso"
                    disabled={isLoading}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:border-brand/60 focus-visible:ring-brand/20 rounded-xl"
                  />
                </div>
              </div>

              {/* Nomor BIB */}
              <div className="space-y-1.5">
                <label htmlFor="login-bib" className="block text-[10px] font-bib uppercase tracking-widest text-gray-400">
                  Nomor BIB (Nomor Dada)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none z-10" />
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
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 font-bib focus-visible:border-brand/60 focus-visible:ring-brand/20 rounded-xl"
                  />
                </div>
              </div>

              <Button
                id="user-login-submit"
                type="submit"
                disabled={isLoading || !fullName.trim() || !bibNumber.trim()}
                className="w-full h-12 bg-brand hover:bg-[#C2410C] text-white font-semibold rounded-xl shadow-lg shadow-orange-600/25 gap-2 mt-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Memverifikasi...</span></>
                ) : (
                  <><span>Masuk ke Galeri</span><ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-2 bg-transparent border-t border-white/5 py-4">
            <p className="text-[11px] text-gray-500">Nama & BIB tidak ditemukan? Hubungi panitia event.</p>
            <div className="flex items-center gap-3 text-[11px]">
              <Link to="/admin/login" id="link-admin-login" className="text-gray-500 hover:text-brand transition-colors font-medium">Login Admin</Link>
              <span className="text-gray-700">·</span>
              <Link to="/photographer/login" id="link-photographer-login" className="text-gray-500 hover:text-brand transition-colors font-medium">Login Fotografer</Link>
            </div>
          </CardFooter>
        </Card>

        <p className="mt-8 text-[11px] font-bib text-[#4B5563] opacity-50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          POWERED BY SEPOTO × AURALIS ENGINE
        </p>
      </div>
    </div>
  );
}
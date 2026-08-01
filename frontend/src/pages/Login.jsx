import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, ArrowRight, User, Hash, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Login Page: Peserta Event (BIB-based, tanpa password) ────────────
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName]   = useState('');
  const [bibNumber, setBibNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi dasar
    if (!fullName.trim() || !bibNumber.trim()) {
      setError('Nama Lengkap dan Nomor BIB wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: ganti dengan API call ke backend Express.js
      // const response = await apiClient.post('/auth/user/login', { name: fullName, bibNumber });
      // const userData = response.data;

      // Simulasi login untuk sementara (akan diganti API call)
      await new Promise((resolve) => setTimeout(resolve, 800));

      login({
        id:        null,
        name:      fullName.trim(),
        bibNumber: bibNumber.trim(),
        role:      'user',
        eventId:   1,
      });

      navigate('/gallery');
    } catch (err) {
      setError('Nama atau Nomor BIB tidak ditemukan. Pastikan data sesuai kartu peserta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">

      {/* ─── Top: Branding strip ───────────────────────────────── */}
      <div className="w-full h-1 gradient-brand" />

      {/* ─── Konten tengah ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Logo Sepoto */}
        <div className="flex flex-col items-center mb-10 animate-fade-in-up">
          <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center shadow-lg glow-brand mb-4">
            <Camera className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Sepoto</h1>
          <p className="text-xs font-bib text-brand uppercase tracking-widest mt-1 opacity-80">
            Event Photo Gallery
          </p>
        </div>

        {/* ─── Card Login ──────────────────────────────────────── */}
        <div
          className="w-full max-w-sm bg-[#191C21] rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up"
          style={{ animationDelay: '0.08s' }}
        >
          {/* Card header */}
          <div className="px-6 pt-7 pb-5 border-b border-white/5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
              Akses Peserta
            </span>
            <h2 className="text-white text-xl font-semibold leading-tight mt-1">
              Temukan Foto Anda
            </h2>
            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
              Masukkan Nama & Nomor BIB sesuai kartu peserta untuk mengakses galeri.
            </p>
          </div>

          {/* Card body — Form */}
          <div className="px-6 py-6">
            <form id="user-login-form" onSubmit={handleLogin} className="space-y-4" noValidate>

              {/* Error alert */}
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl animate-fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Field: Nama Lengkap */}
              <div className="space-y-2">
                <label
                  htmlFor="login-fullname"
                  className="block text-[10px] font-bib uppercase tracking-widest text-gray-400"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    id="login-fullname"
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(''); }}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand/60 focus:bg-white/8 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Field: Nomor BIB */}
              <div className="space-y-2">
                <label
                  htmlFor="login-bib"
                  className="block text-[10px] font-bib uppercase tracking-widest text-gray-400"
                >
                  Nomor BIB (Nomor Dada)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    id="login-bib"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    required
                    value={bibNumber}
                    onChange={(e) => { setBibNumber(e.target.value); setError(''); }}
                    placeholder="Contoh: 105"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm font-bib focus:outline-none focus:border-brand/60 focus:bg-white/8 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                id="user-login-submit"
                type="submit"
                disabled={isLoading || !fullName.trim() || !bibNumber.trim()}
                className="w-full tap-target flex items-center justify-center gap-2 bg-brand hover:bg-[#C2410C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-orange-600/25 active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Galeri</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card footer */}
          <div className="px-6 pb-6 border-t border-white/5 pt-4 flex flex-col gap-2.5 text-center">
            <p className="text-[11px] text-gray-500">
              Nama & BIB tidak ditemukan? Hubungi panitia event.
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px]">
              <Link
                to="/admin/login"
                id="link-admin-login"
                className="text-gray-500 hover:text-brand transition-colors font-medium"
              >
                Login Admin
              </Link>
              <span className="text-gray-700">·</span>
              <Link
                to="/photographer/login"
                id="link-photographer-login"
                className="text-gray-500 hover:text-brand transition-colors font-medium"
              >
                Login Fotografer
              </Link>
            </div>
          </div>
        </div>

        {/* Powered by */}
        <p className="mt-8 text-[11px] font-bib text-[#4B5563] opacity-50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          POWERED BY SEPOTO × AURALIS ENGINE
        </p>
      </div>
    </div>
  );
}
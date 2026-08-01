import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, ArrowRight, Lock, Mail, Loader2, AlertCircle, Aperture } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Photographer Login Page ──────────────────────────────────────────
export default function PhotographerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Email dan Password wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: ganti dengan API call ke backend Express.js
      // const response = await apiClient.post('/auth/photographer/login', { email, password });

      await new Promise((resolve) => setTimeout(resolve, 800));

      login({
        id:       2,
        name:     email.split('@')[0],
        role:     'photographer',
        eventId:  1,
      });

      navigate('/photographer/dashboard');
    } catch (err) {
      setError('Email atau Password salah. Pastikan akun fotografer Anda sudah dibuat oleh Admin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B12] flex flex-col">

      {/* Top strip — biru untuk fotografer */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-700 via-blue-500 to-sky-400" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10 animate-fade-in-up">
          <div className="relative w-14 h-14 rounded-2xl bg-[#191C21] border border-blue-500/30 flex items-center justify-center shadow-lg mb-4">
            <Aperture className="w-7 h-7 text-blue-400" strokeWidth={2} />
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Sepoto</h1>
          <p className="text-[10px] font-bib text-blue-400 uppercase tracking-widest mt-1 opacity-80">
            Photographer Portal
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-sm bg-[#191C21] rounded-2xl shadow-2xl overflow-hidden border border-white/5 animate-fade-in-up"
          style={{ animationDelay: '0.08s' }}
        >
          {/* Header */}
          <div className="px-6 pt-7 pb-5 border-b border-white/5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Fotografer
            </span>
            <h2 className="text-white text-xl font-semibold leading-tight mt-1">
              Portal Fotografer
            </h2>
            <p className="text-gray-400 text-sm mt-1.5 leading-relaxed">
              Upload foto, atur harga, dan kelola hasil jepretanmu di satu tempat.
            </p>
          </div>

          {/* Form */}
          <div className="px-6 py-6">
            <form id="photographer-login-form" onSubmit={handleLogin} className="space-y-4" noValidate>

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl animate-fade-in"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="photographer-email"
                  className="block text-[10px] font-bib uppercase tracking-widest text-gray-400"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    id="photographer-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="foto@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="photographer-password"
                  className="block text-[10px] font-bib uppercase tracking-widest text-gray-400"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <input
                    id="photographer-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 text-sm font-bib focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                id="photographer-login-submit"
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full tap-target flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Info & Links */}
          <div className="px-6 pb-6 border-t border-white/5 pt-4">
            <p className="text-[11px] text-gray-500 text-center mb-3">
              Akun belum ada? Minta Super Admin untuk membuatkan akun fotografer.
            </p>
            <div className="flex items-center justify-center gap-3 text-[11px]">
              <Link
                to="/"
                id="photographer-back-to-user"
                className="text-gray-500 hover:text-brand transition-colors font-medium"
              >
                ← Login Peserta
              </Link>
              <span className="text-gray-700">·</span>
              <Link
                to="/admin/login"
                id="photographer-to-admin"
                className="text-gray-500 hover:text-red-400 transition-colors font-medium"
              >
                Login Admin
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-8 text-[11px] font-bib text-gray-600 opacity-50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          SEPOTO × AURALIS ENGINE — PHOTOGRAPHER ACCESS
        </p>
      </div>
    </div>
  );
}

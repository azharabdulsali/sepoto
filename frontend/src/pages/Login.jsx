import React, { useState } from 'react';

export default function Login() {
  const [fullName, setFullName] = useState('');
  const [bibNumber, setBibNumber] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    alert(`Login dengan Nama: ${fullName} dan BIB: ${bibNumber}`);
    // Nanti di sini kita arahkan ke halaman galeri
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-center items-center px-4">
      {/* Container Card dengan gaya Surface Auralis */}
      <div className="w-full max-w-md bg-[#191C21] text-white p-8 rounded-lg shadow-2xl border border-gray-800">
        
        {/* Header / Brand */}
        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">
            Sepoto Event Platform
          </span>
          <h1 className="text-3xl font-medium mt-4 font-sans tracking-tight text-white">
            Temukan Foto Anda.
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Masukkan Nama Lengkap dan Nomor BIB untuk mengakses galeri acara.
          </p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-mono text-gray-300 uppercase mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 uppercase mb-2">
              Nomor BIB (Nomor Dada)
            </label>
            <input
              type="text"
              required
              value={bibNumber}
              onChange={(e) => setBibNumber(e.target.value)}
              placeholder="Contoh: 105"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 font-mono focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#EA580C] hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg shadow-orange-600/20 active:scale-[0.98]"
          >
            Masuk ke Galeri
          </button>
        </form>

        {/* Footer info kecil */}
        <div className="mt-8 text-center border-t border-gray-800 pt-4">
          <p className="text-xs text-gray-500">
            Didukung oleh Sepoto x Auralis Engine
          </p>
        </div>

      </div>
    </div>
  );
}
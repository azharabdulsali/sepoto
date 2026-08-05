import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft } from "lucide-react";

export default function CartStepEmpty() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 rounded-3xl bg-[#F3F4F6] flex items-center justify-center mb-5 shadow-inner"
      >
        <ShoppingCart className="w-10 h-10 text-[#D1D5DB]" />
      </motion.div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">
        Keranjang Anda Kosong
      </h2>
      <p className="text-sm text-[#4B5563] mb-6 max-w-xs leading-relaxed">
        Belum ada foto yang dipilih. Kembali ke galeri dan tambahkan foto
        favorit Anda.
      </p>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Link
          to="/gallery"
          id="cart-back-to-gallery"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 bg-brand hover:bg-[#C2410C] text-white font-bold rounded-xl shadow-lg shadow-orange-600/20 whitespace-nowrap transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 text-white" />
          <span>Kembali ke Galeri</span>
        </Link>
      </motion.div>
    </div>
  );
}

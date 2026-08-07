import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Clock, RefreshCw, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import SepotoLogo from "../components/SepotoLogo";

export default function MaintenancePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] flex flex-col items-center justify-center p-4 text-center font-sans antialiased">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="max-w-md w-full bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xl"
      >
        <div className="flex justify-center mb-6">
          <SepotoLogo size="lg" />
        </div>

        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <Wrench className="w-8 h-8 animate-bounce" />
        </div>

        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-2">
          Sistem Dalam Pemeliharaan
        </h1>

        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-6 font-medium">
          Kami sedang melakukan peningkatan performa dan pemeliharaan rutin
          pada platform <strong className="text-[#0F172A]">Sepoto</strong> untuk
          kenyamanan pencarian foto Anda.
        </p>

        <div className="bg-[#FAFBFD] border border-[#E2E8F0] rounded-2xl p-4 mb-6 text-left space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs text-[#475569]">
            <Clock className="w-4 h-4 text-brand shrink-0" />
            <span>
              Perkiraan Selesai: <strong>15–30 Menit</strong>
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-[#475569]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Data foto &amp; transaksi Anda aman</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleRefresh}
            className="w-full bg-[#0F172A] hover:bg-brand text-white font-bold text-xs h-12 rounded-xl shadow-md min-h-[48px] flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Cek Ulang Status Web</span>
          </Button>

          <Link
            to="/login"
            id="maintenance-admin-login-link"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-brand transition-colors pt-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Portal Login Admin / Fotografer →</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

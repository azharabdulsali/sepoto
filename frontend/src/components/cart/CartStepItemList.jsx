import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  QrCode,
  AlertCircle,
  Sparkles,
  Upload,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import CartItem from "./CartItem";
import { formatRupiah } from "./cartUtils";

const QrPlaceholder = () => (
  <div className="flex flex-col items-center justify-center w-48 h-48 bg-[#F9FAFB] border-2 border-dashed border-[#E5E7EB] rounded-2xl mx-auto shadow-inner">
    <QrCode className="w-16 h-16 text-[#D1D5DB] mb-2" />
    <p className="text-[10px] font-bib text-[#9CA3AF] uppercase tracking-widest text-center px-2 font-bold">
      QR Code QRIS
      <br />
      Pembayaran
    </p>
  </div>
);

export default function CartStepItemList({
  items = [],
  itemCount = 0,
  formattedTotal = "Rp 0",
  activeEvent = null,
  checkoutError = "",
  removeItem,
  clearCart,
  onCheckout,
}) {
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const handleClearCart = () => {
    clearCart();
    setIsClearConfirmOpen(false);
  };

  return (
    <>
      {/* Daftar Foto */}
      <Card className="bg-white border-[#E5E7EB] rounded-2xl px-4 py-3 mb-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
          <h2 className="text-sm font-bold text-[#111827]">
            Foto yang Dipilih ({itemCount})
          </h2>
          <button
            id="cart-clear-all"
            onClick={() => setIsClearConfirmOpen(true)}
            className="text-xs text-red-500 hover:text-red-700 transition-colors font-semibold"
          >
            Hapus semua
          </button>
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {items.map((photo) => (
            <CartItem key={photo.id} photo={photo} onRemove={removeItem} />
          ))}
        </div>
      </Card>

      {/* Ringkasan Harga */}
      <Card className="bg-white border-[#E5E7EB] rounded-2xl p-4.5 mb-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[#111827]">
          Ringkasan Pembayaran
        </h2>
        <div className="space-y-2">
          {items.map((photo) => (
            <div
              key={photo.id}
              className="flex items-center justify-between text-xs"
            >
              <span
                className="text-[#4B5563] truncate max-w-[65%]"
                title={photo.originalFilename || photo.original_filename || `Foto #${photo.id}`}
              >
                {photo.originalFilename || photo.original_filename || photo.title || photo.name || `Foto #${photo.id}`}
                {photo.bibTags ? ` (Label: ${photo.bibTags})` : ""}
              </span>
              <span className="font-semibold text-[#111827]">
                {formatRupiah(photo.price)}
              </span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between pt-1">
          <span className="font-bold text-[#111827] text-base">Total</span>
          <span className="font-bib text-xl font-bold text-brand">
            {formattedTotal}
          </span>
        </div>
      </Card>

      {/* Langkah Pembayaran Dark Card */}
      <div className="bg-[#191C21] rounded-3xl overflow-hidden mb-5 shadow-xl text-white">
        <div className="px-5 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <Badge className="font-bib uppercase tracking-widest text-brand bg-brand/10 border-brand/20 px-3 py-1 mb-2">
              Instruksi Pembayaran
            </Badge>
            <h2 className="text-white text-base font-bold">
              Cara Melakukan Pembayaran
            </h2>
          </div>
          <Sparkles className="w-5 h-5 text-brand opacity-80" />
        </div>

        <div className="px-5 py-5 space-y-4">
          {[
            {
              step: "1",
              title: "Scan QR Code di bawah",
              desc: "Gunakan m-banking atau e-wallet (GoPay, OVO, Dana, ShopeePay) untuk scan QRIS.",
            },
            {
              step: "2",
              title: "Transfer sesuai total",
              desc: `Pastikan nominal transfer tepat sebesar: ${formattedTotal}`,
            },
            {
              step: "3",
              title: "Upload Bukti Pembayaran",
              desc: 'Klik tombol "Lanjut Upload Bukti Bayar" di bawah — upload foto struk/screenshot transfer Anda.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3.5">
              <div className="w-7 h-7 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bib text-brand font-bold">
                  {step}
                </span>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">{title}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-6">
          <div className="bg-white rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <span className="text-[10px] font-bib text-[#4B5563] uppercase tracking-widest font-bold">
                QRIS Statis Pembayaran
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-bib bg-red-50 text-red-600 border-red-200"
              >
                Semua E-Wallet &amp; M-Banking
              </Badge>
            </div>

            {activeEvent?.qrCodeUrl ? (
              <div
                onClick={() => setIsZoomOpen(true)}
                className="w-56 h-56 bg-white rounded-2xl p-2.5 border-2 border-dashed border-brand/30 mx-auto overflow-hidden shadow-sm hover:border-brand transition-all cursor-pointer group relative"
              >
                <img
                  src={activeEvent.qrCodeUrl}
                  alt="QRIS Pembayaran Resmi"
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <span className="text-white text-xs font-bold bg-brand px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5" />
                    Perbesar QR Code
                  </span>
                </div>
              </div>
            ) : (
              <QrPlaceholder />
            )}

            <p className="text-[11px] text-[#4B5563] mt-3.5 leading-relaxed font-medium">
              Scan menggunakan BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, atau
              ShopeePay
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4.5 py-3.5 mb-6">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Foto asli (tanpa watermark) hanya bisa diunduh setelah Admin{" "}
          <strong>menyetujui</strong> pembayaran Anda. Verifikasi biasanya
          membutuhkan 1×24 jam.
        </p>
      </div>

      {/* Error checkout */}
      {checkoutError && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 font-medium">{checkoutError}</p>
        </div>
      )}

      {/* CTA: Lanjut ke Upload */}
      <div className="space-y-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button
            id="cart-checkout-btn"
            onClick={onCheckout}
            className="w-full h-14 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2.5 transition-all"
          >
            <Upload className="w-5 h-5 shrink-0" />
            <span>Lanjut Upload Bukti Pembayaran</span>
            <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />
          </Button>
        </motion.div>
        <p className="text-[11px] text-[#9CA3AF] text-center">
          Anda akan diminta upload foto bukti transfer / screenshot e-wallet
        </p>
      </div>

      {/* Shadcn UI AlertDialog Konfirmasi Kosongkan Keranjang */}
      <AlertDialog
        open={isClearConfirmOpen}
        onOpenChange={setIsClearConfirmOpen}
      >
        <AlertDialogContent className="rounded-2xl bg-white border border-[#E5E7EB]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] font-bold flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Kosongkan Keranjang Foto?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#4B5563] pt-1">
              Apakah Anda yakin ingin menghapus <strong>{itemCount} foto</strong>{" "}
              dari keranjang pesanan Anda?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-[#E5E7EB]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
            >
              Ya, Hapus Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QRIS Image Lightbox Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && activeEvent?.qrCodeUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-center"
            >
              <button
                onClick={() => setIsZoomOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>

              <Badge className="bg-brand text-white font-bib uppercase text-[10px] px-3 py-1 mb-3">
                QRIS Pembayaran Resmi
              </Badge>
              <h3 className="text-base font-bold text-[#111827]">
                Scan untuk Membayar
              </h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Total:{" "}
                <strong className="text-brand font-bib font-bold">
                  {formattedTotal}
                </strong>
              </p>

              <div className="w-64 h-64 mx-auto bg-white border-2 border-dashed border-brand/40 rounded-2xl p-3 shadow-inner flex items-center justify-center mb-4">
                <img
                  src={activeEvent.qrCodeUrl}
                  alt="QRIS Pembayaran Full"
                  className="w-full h-full object-contain"
                />
              </div>

              <Button
                onClick={() => setIsZoomOpen(false)}
                className="w-full bg-[#111827] hover:bg-black text-white text-xs font-bold h-10 rounded-xl"
              >
                Tutup Pratinjau
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

import React, { useState, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Trash2,
  ArrowLeft,
  QrCode,
  Package,
  Camera,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Upload,
  ImageIcon,
  CheckCircle2,
  X,
  Loader2,
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
import AppShell from "../components/AppShell";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const WA_ADMIN_NUMBER = "6281234567890";
const MAX_PROOF_SIZE_MB = 5;
const MAX_PROOF_SIZE_BYTES = MAX_PROOF_SIZE_MB * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);

const buildWhatsAppUrl = ({
  orderNumber,
  userName,
  bibNumber,
  items,
  total,
}) => {
  const photoList = items
    .map(
      (item, idx) =>
        `  ${idx + 1}. Foto ID #${item.id} (BIB: ${item.bibTags ?? "Umum"}) — ${formatRupiah(item.price)}`,
    )
    .join("\n");

  const message = [
    `🎉 *Konfirmasi Pembayaran Sepoto*`,
    ``,
    `📋 *Nomor Order:* ${orderNumber}`,
    `👤 *Nama:* ${userName}`,
    bibNumber ? `🏷️ *BIB:* #${bibNumber}` : "",
    ``,
    `📸 *Daftar Foto yang Dibeli:*`,
    photoList,
    ``,
    `💰 *Total Pembayaran:* ${formatRupiah(total)}`,
    ``,
    `_Bukti transfer sudah diupload. Mohon diverifikasi. Terima kasih!_`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WA_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
};

const CartItem = ({ photo, onRemove }) => (
  <motion.div
    layout
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 10 }}
    className="flex items-center gap-3.5 py-3 border-b border-[#F3F4F6] last:border-0 group"
  >
    <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB]">
      <img
        src={photo.watermarkedUrl}
        alt={`Foto #${photo.id}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        loading="lazy"
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Camera className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
        <span className="text-xs text-[#4B5563] font-medium truncate">
          {photo.photographerName ?? "Fotografer"}
        </span>
      </div>
      {photo.bibTags && (
        <Badge
          variant="secondary"
          className="font-bib text-[10px] text-brand bg-brand/10 mb-1 px-2 py-0.5"
        >
          BIB #{photo.bibTags}
        </Badge>
      )}
      <p className="text-sm font-bold text-brand">
        {formatRupiah(photo.price)}
      </p>
    </div>

    <Button
      id={`cart-remove-${photo.id}`}
      onClick={() => onRemove(photo.id)}
      variant="ghost"
      size="icon"
      className="shrink-0 w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50"
      aria-label={`Hapus foto #${photo.id}`}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  </motion.div>
);

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

const generateOrderNumberFallback = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `SEPOTO-${year}${month}${day}-0001`;
};

export default function CartPage() {
  const {
    items,
    removeItem,
    clearCart,
    totalPrice,
    formattedTotal,
    itemCount,
  } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const proofInputRef = useRef(null);

  const [activeEvent, setActiveEvent] = useState(null);
  const [orderNumber, setOrderNumber] = useState(generateOrderNumberFallback());
  const [isClearConfirmOpen, setIsClearConfirmOpen] = React.useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Upload proof state
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofError, setProofError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Checkout flow state
  const [checkoutStep, setCheckoutStep] = useState("cart"); // 'cart' | 'uploading' | 'success'
  const [finalOrderNumber, setFinalOrderNumber] = useState(null);
  const [checkoutError, setCheckoutError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClearCart = () => {
    clearCart();
    setIsClearConfirmOpen(false);
  };

  React.useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const userEventId = currentUser?.eventId || "";
        const [eventRes, orderRes] = await Promise.all([
          api.getActiveEvent(userEventId),
          api.getNextOrderNumber(userEventId),
        ]);
        if (isMounted) {
          if (eventRes.success && eventRes.event)
            setActiveEvent(eventRes.event);
          if (orderRes.success && orderRes.orderNumber)
            setOrderNumber(orderRes.orderNumber);
        }
      } catch (err) {
        console.error("Failed to load cart initial data:", err);
      }
    }
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.eventId]);

  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl({
        orderNumber: finalOrderNumber || orderNumber,
        userName: currentUser?.name ?? "Peserta",
        bibNumber: currentUser?.bibNumber ?? null,
        items,
        total: totalPrice,
      }),
    [finalOrderNumber, orderNumber, currentUser, items, totalPrice],
  );

  // Validate and set proof file
  const handleProofFileChange = (file) => {
    setProofError("");
    if (!file) return;

    if (
      !ACCEPTED_IMAGE_TYPES.includes(file.type) &&
      !file.type.startsWith("image/")
    ) {
      setProofError(
        "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.",
      );
      return;
    }
    if (file.size > MAX_PROOF_SIZE_BYTES) {
      setProofError(
        `Ukuran file melebihi batas ${MAX_PROOF_SIZE_MB}MB. Pilih file yang lebih kecil.`,
      );
      return;
    }

    setProofFile(file);
    const url = URL.createObjectURL(file);
    setProofPreview(url);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProofFileChange(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProofFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreview(null);
    setProofError("");
    if (proofInputRef.current) proofInputRef.current.value = "";
  };

  // Step 1: Hanya pindah ke tampilan upload — belum buat transaksi ke DB
  const handleCheckout = () => {
    setCheckoutStep("uploading");
  };

  // Step 2: Buat transaksi + upload bukti dalam satu langkah (transaksi baru muncul di Admin setelah proof terupload)
  const handleUploadProof = async () => {
    if (!proofFile) {
      setProofError("Pilih foto bukti pembayaran terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setProofError("");
    setCheckoutError("");

    try {
      // 1. Buat record transaksi
      const photoIds = items.map((i) => i.id);
      const txRes = await api.createTransaction({
        orderNumber,
        totalAmount: totalPrice,
        photoIds,
      });

      if (!txRes.success || !txRes.transaction) {
        setCheckoutError(
          txRes.message || "Gagal membuat transaksi. Coba lagi.",
        );
        return;
      }

      const txId = txRes.transaction.id;
      const txOrderNumber = txRes.transaction.order_number || orderNumber;
      setFinalOrderNumber(txOrderNumber);

      // 2. Upload bukti pembayaran
      const proofRes = await api.uploadPaymentProof(txId, proofFile);
      if (proofRes.success) {
        clearCart();
        setCheckoutStep("success");
      } else {
        setProofError(
          proofRes.message || "Gagal upload bukti pembayaran. Coba lagi.",
        );
      }
    } catch (err) {
      console.error("Submit order error:", err);
      setCheckoutError(err.message || "Terjadi kesalahan koneksi. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Empty Cart Screen ────────────────────────────────────────────────────
  if (itemCount === 0 && checkoutStep === "cart") {
    return (
      <AppShell>
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
      </AppShell>
    );
  }

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (checkoutStep === "success") {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-3xl bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6 shadow-lg shadow-green-100"
          >
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="bg-green-100 text-green-700 border-green-200 font-bib uppercase tracking-widest text-[10px] px-3 py-1 mb-3">
              Pesanan Berhasil Dibuat
            </Badge>
            <h2 className="text-2xl font-bold text-[#111827] mb-2">
              Bukti Bayar Terkirim!
            </h2>
            <p className="text-sm text-[#4B5563] mb-2 leading-relaxed max-w-sm mx-auto">
              Pesanan Anda sedang menunggu verifikasi Admin. Anda akan menerima
              notifikasi setelah pembayaran dikonfirmasi.
            </p>
            <p className="font-bib text-xs text-[#9CA3AF] mb-8">
              Nomor Order:{" "}
              <strong className="text-[#4B5563]">
                {finalOrderNumber || orderNumber}
              </strong>
            </p>

            <div className="space-y-3 w-full max-w-xs mx-auto">
              {/* Opsional: Konfirmasi via WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="cart-whatsapp-confirm"
                className="w-full h-12 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm rounded-2xl shadow-lg shadow-green-500/20 flex flex-row items-center justify-center gap-2.5 px-4 transition-all"
              >
                <svg
                  className="w-5 h-5 fill-current shrink-0"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
                <span className="whitespace-nowrap">
                  Konfirmasi via WhatsApp
                </span>
              </a>

              <Button
                onClick={() => navigate("/orders")}
                id="cart-go-to-orders"
                className="w-full h-12 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-600/20"
              >
                Lihat Status Pesanan
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Link
                to="/gallery"
                className="block text-center text-xs text-[#9CA3AF] hover:text-[#4B5563] transition-colors py-2"
              >
                Kembali ke Galeri Foto
              </Link>
            </div>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  // ─── Main Cart / Upload Screen ────────────────────────────────────────────
  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto px-4 pb-12"
      >
        {/* Header */}
        <div className="py-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                checkoutStep === "uploading"
                  ? setCheckoutStep("cart")
                  : navigate(-1)
              }
              id="cart-back-btn"
              className="text-xs text-[#4B5563] hover:text-[#111827] px-0 h-auto mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>
                {checkoutStep === "uploading"
                  ? "Kembali ke Keranjang"
                  : "Kembali"}
              </span>
            </Button>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              {checkoutStep === "uploading"
                ? "Upload Bukti Pembayaran"
                : "Keranjang Foto"}
            </h1>
          </div>
          <Badge
            variant="secondary"
            className="font-bib text-xs bg-[#F3F4F6] text-[#4B5563] px-3 py-1 rounded-full"
          >
            {itemCount} foto
          </Badge>
        </div>

        {/* Nomor Order Card */}
        <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl px-4 py-3.5 mb-4 flex flex-row items-center gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#9CA3AF] font-bib uppercase tracking-widest font-bold">
              Nomor Order Transaksi
            </p>
            <p className="font-bib text-sm text-[#111827] font-bold tracking-wide">
              {finalOrderNumber || orderNumber}
            </p>
          </div>
        </Card>

        {/* ─── STEP: CART ──────────────────────────────────────────────── */}
        {checkoutStep === "cart" && (
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
                  <CartItem
                    key={photo.id}
                    photo={photo}
                    onRemove={removeItem}
                  />
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
                    <span className="text-[#4B5563] truncate max-w-[65%]">
                      Foto #{photo.id}
                      {photo.bibTags ? ` (BIB #${photo.bibTags})` : ""}
                    </span>
                    <span className="font-semibold text-[#111827]">
                      {formatRupiah(photo.price)}
                    </span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-[#111827] text-base">
                  Total
                </span>
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
                      <p className="text-white text-sm font-semibold">
                        {title}
                      </p>
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
                    Scan menggunakan BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA,
                    atau ShopeePay
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
                <p className="text-xs text-red-700 font-medium">
                  {checkoutError}
                </p>
              </div>
            )}

            {/* CTA: Lanjut ke Upload */}
            <div className="space-y-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  id="cart-checkout-btn"
                  onClick={handleCheckout}
                  className="w-full h-14 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2.5 transition-all"
                >
                  <Upload className="w-5 h-5 shrink-0" />
                  <span>Lanjut Upload Bukti Pembayaran</span>
                  <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />
                </Button>
              </motion.div>
              <p className="text-[11px] text-[#9CA3AF] text-center">
                Anda akan diminta upload foto bukti transfer / screenshot
                e-wallet
              </p>
            </div>
          </>
        )}

        {/* ─── STEP: UPLOAD PROOF ──────────────────────────────────────── */}
        {checkoutStep === "uploading" && (
          <>
            {/* Ringkasan Total */}
            <Card className="bg-brand/5 border-brand/20 rounded-2xl px-4 py-3.5 mb-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[11px] text-[#4B5563] font-bib uppercase tracking-widest font-bold mb-0.5">
                  Total Pembayaran
                </p>
                <p className="font-bib text-xl font-bold text-brand">
                  {formattedTotal}
                </p>
              </div>
              <Badge
                variant="secondary"
                className="font-bib text-[10px] bg-brand/10 text-brand px-2.5 py-1"
              >
                {itemCount} Foto
              </Badge>
            </Card>

            {/* WAJIB UPLOAD Alert */}
            <div className="flex items-start gap-3 bg-red-50 border-2 border-red-300 rounded-2xl px-4 py-3.5 mb-5">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700 mb-0.5">
                  <span className="text-red-600 mr-1">*</span>
                  Upload Bukti Pembayaran Wajib
                </p>
                <p className="text-xs text-red-600 leading-relaxed">
                  Pesanan Anda baru akan diproses Admin setelah Anda mengupload
                  bukti transfer atau screenshot e-wallet. Maks.{" "}
                  {MAX_PROOF_SIZE_MB}MB, format JPG / PNG / WebP.
                </p>
              </div>
            </div>

            {/* Upload Drop Zone */}
            <Card className="bg-white border-[#E5E7EB] rounded-2xl overflow-hidden mb-4 shadow-sm">
              <div className="px-4 py-3.5 border-b border-[#F3F4F6] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-[#111827]">
                  Upload Bukti Pembayaran{" "}
                  <span className="text-red-500">*</span>
                </h3>
              </div>

              {proofPreview ? (
                /* Preview file yang sudah dipilih */
                <div className="p-4">
                  <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] shadow-sm">
                    <img
                      src={proofPreview}
                      alt="Preview bukti pembayaran"
                      className="w-full max-h-64 object-contain"
                    />
                    <button
                      onClick={handleRemoveProof}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-medium px-3 py-1.5 flex items-center justify-between">
                      <span className="truncate max-w-[200px]">
                        {proofFile?.name}
                      </span>
                      <span className="shrink-0 ml-2">
                        {(proofFile?.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => proofInputRef.current?.click()}
                    className="mt-2.5 w-full text-xs text-brand hover:text-[#C2410C] font-semibold text-center transition-colors"
                  >
                    Ganti Foto Bukti
                  </button>
                </div>
              ) : (
                /* Drop Zone */
                <div
                  onClick={() => proofInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  className={`m-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-brand bg-brand/5 scale-[1.01]"
                      : "border-[#E5E7EB] hover:border-brand hover:bg-brand/5"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isDragOver ? "bg-brand/20" : "bg-[#F3F4F6]"}`}
                  >
                    <Upload
                      className={`w-7 h-7 transition-colors ${isDragOver ? "text-brand" : "text-[#9CA3AF]"}`}
                    />
                  </div>
                  <p className="text-sm font-bold text-[#111827] mb-1">
                    {isDragOver
                      ? "Lepaskan di sini"
                      : "Pilih atau drag foto bukti"}
                  </p>
                  <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
                    JPG, PNG, GIF, WebP — maks. {MAX_PROOF_SIZE_MB}MB
                  </p>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={proofInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                id="proof-file-input"
              />
            </Card>

            {/* Proof Error */}
            {proofError && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 font-medium">{proofError}</p>
              </div>
            )}

            {/* Checkout Error */}
            {checkoutError && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 font-medium">
                  {checkoutError}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <motion.div
                whileHover={{ scale: proofFile ? 1.02 : 1 }}
                whileTap={{ scale: proofFile ? 0.97 : 1 }}
              >
                <Button
                  id="cart-upload-proof-btn"
                  onClick={handleUploadProof}
                  disabled={isSubmitting || !proofFile}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-xl shadow-green-600/20 flex items-center justify-center gap-2.5 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengupload...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 shrink-0" />
                      <span>Kirim Pesanan &amp; Upload Bukti</span>
                      <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />
                    </>
                  )}
                </Button>
              </motion.div>

              {!proofFile && (
                <p className="text-[11px] text-red-500 text-center font-medium">
                  ⚠ Pilih foto bukti pembayaran terlebih dahulu
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>

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
              Apakah Anda yakin ingin menghapus{" "}
              <strong>{itemCount} foto</strong> dari keranjang pesanan Anda?
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
                <strong className="text-brand font-bib">
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
    </AppShell>
  );
}

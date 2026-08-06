import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ChevronRight,
  Package,
  Loader2,
  Paperclip,
  Eye,
  Camera,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
} from "@/components/ui/attachment";
import AppShell from "../components/AppShell";
import ProtectedPhoto from "../components/ProtectedPhoto";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const WA_ADMIN_NUMBER = "6281234567890";

const formatRupiah = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(v ?? 0);

const buildWhatsAppUrl = ({
  orderNumber,
  userName,
  bibNumber,
  items = [],
  total = 0,
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
    `_Bukti transfer telah dikirim. Mohon diverifikasi. Terima kasih!_`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WA_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
};

const STATUS_MAP = {
  pending: {
    label: "Menunggu Verifikasi",
    desc: "Pembayaran Anda sedang diverifikasi oleh Admin. Mohon tunggu.",
    icon: Clock,
    cls: "text-amber-700 bg-amber-50 border-amber-200",
  },
  approved: {
    label: "Disetujui — Siap Diunduh",
    desc: "Pembayaran disetujui! Klik tombol unduh untuk mendapatkan foto asli resolusi tinggi.",
    icon: CheckCircle2,
    cls: "text-green-700 bg-green-50 border-green-200",
  },
  rejected: {
    label: "Ditolak",
    desc: "Pembayaran tidak dapat diverifikasi. Hubungi Admin untuk informasi lebih lanjut.",
    icon: XCircle,
    cls: "text-red-700 bg-red-50 border-red-200",
  },
};

function OrderCard({ order, currentUser }) {
  const [downloading, setDownloading] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const cfg = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
  const StatusIcon = cfg.icon;

  const handleDownload = async (photoId, photoFilename) => {
    setDownloading(photoId);
    setDownloadSuccess(null);
    try {
      const res = await api.getDownloadUrl(order.id, photoId);
      if (res.success && res.downloadUrl) {
        const targetName = photoFilename || `IMG_${photoId}.jpg`;
        const link = document.createElement("a");
        link.href = res.downloadUrl;
        link.download = targetName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadSuccess({ photoId, fileName: targetName });
      } else {
        alert(res.message || "Gagal mengunduh foto.");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("Terjadi kesalahan saat meminta tautan unduh.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading("all");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/transactions/${order.id}/download-zip`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Gagal mengunduh file ZIP.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${order.orderNumber || `SEPOTO-${order.id}`}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadSuccess({
        photoId: "all",
        fileName: `${order.orderNumber || `SEPOTO-${order.id}`}.zip`,
      });
    } catch (err) {
      console.error("Download all zip error:", err);
      alert("Gagal mengunduh berkas ZIP transaksi.");
    } finally {
      setDownloading(null);
    }
  };

  const waUrl = buildWhatsAppUrl({
    orderNumber: order.orderNumber,
    userName: currentUser?.name ?? "Peserta",
    bibNumber: currentUser?.bibNumber ?? null,
    items: order.photos,
    total: order.total,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
        {/* Header Order */}
        <div className="px-4.5 pt-4.5 pb-3.5 border-b border-[#F3F4F6]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Package className="w-4 h-4 text-brand shrink-0" />
                <span className="font-bib text-xs text-[#111827] font-bold">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF]">
                {order.createdAt} · {order.photos.length} foto
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-brand text-base font-bib">
                {formatRupiah(order.total)}
              </p>
            </div>
          </div>

          <div
            className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border ${cfg.cls}`}
          >
            <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{cfg.label}</p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                {cfg.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Shadcn UI Alert Unduhan Berhasil */}
        {downloadSuccess && (
          <div className="px-4.5 pt-3">
            <Alert className="bg-green-50 border border-green-200 text-green-900 rounded-2xl p-3.5 shadow-sm flex items-start gap-3">
              <CheckCircle2 className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <AlertTitle className="text-xs font-bold text-green-900 flex items-center gap-2">
                  <span>Unduhan Foto Berhasil!</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bib bg-green-100 text-green-800 border-green-300"
                  >
                    Original
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-[11px] text-green-700 leading-relaxed mt-0.5">
                  Berkas lampiran{" "}
                  <strong className="font-bib">
                    {downloadSuccess.fileName}
                  </strong>{" "}
                  tanpa watermark telah tersimpan di perangkat Anda.
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}

        {/* Thumbnails & Attachments */}
        <div className="px-4.5 py-3">
          <div
            className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-[1000px]" : "max-h-[180px]"}`}
          >
            <div className="flex flex-col gap-2.5">
              {order.photos.map((photo) => (
                <Attachment
                  key={photo.id}
                  size="default"
                  orientation="horizontal"
                  className="w-full bg-[#F9FAFB] border-[#E5E7EB] rounded-xl p-2"
                >
                  <AttachmentMedia
                    variant="image"
                    onClick={() => setPreviewPhoto(photo)}
                    className="w-12 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer relative group/img"
                  >
                    <ProtectedPhoto
                      src={
                        order.status === "approved" && photo.originalUrl
                          ? photo.originalUrl
                          : photo.watermarkedUrl
                      }
                      alt={`Foto #${photo.id}`}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-3.5 h-3.5 text-white" />
                    </div>
                  </AttachmentMedia>

                  <AttachmentContent className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <AttachmentTitle
                          onClick={() => setPreviewPhoto(photo)}
                          className="text-xs font-bold text-[#111827] cursor-pointer hover:text-brand transition-colors"
                        >
                          Foto #{photo.id}
                        </AttachmentTitle>
                        {photo.bibTags && (
                          <Badge
                            variant="secondary"
                            className="font-bib text-[9px] text-brand bg-brand/10 px-1.5 py-0.5 rounded-md"
                          >
                            BIB #{photo.bibTags}
                          </Badge>
                        )}
                      </div>
                      <span className="font-bib text-xs font-bold text-brand">
                        {formatRupiah(photo.price)}
                      </span>
                    </div>

                    <AttachmentDescription className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bib mt-1">
                      <Paperclip className="w-3 h-3 text-brand shrink-0" />
                      <span className="truncate">
                        {photo.originalFilename || `IMG_${photo.id}.jpg`}
                      </span>
                      <span>·</span>
                      <span className="text-gray-400 font-medium">
                        {order.status === "approved"
                          ? "Original HD"
                          : "Watermarked"}
                      </span>
                    </AttachmentDescription>
                  </AttachmentContent>

                  <AttachmentActions>
                    {order.status === "approved" && (
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                          id={`download-photo-${photo.id}`}
                          onClick={() =>
                            handleDownload(photo.id, photo.originalFilename)
                          }
                          disabled={downloading !== null}
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs font-bold text-brand hover:text-[#C2410C] hover:bg-orange-50 h-8 px-2.5 rounded-lg"
                        >
                          {downloading === photo.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 mr-1" />
                              <span>Unduh</span>
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </AttachmentActions>
                </Attachment>
              ))}
            </div>
          </div>

          {order.photos.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-xs text-[#4B5563] hover:text-brand px-0 h-auto font-medium"
            >
              <ChevronRight
                className={`w-3.5 h-3.5 mr-1 transition-transform ${expanded ? "rotate-90" : ""}`}
              />
              {expanded
                ? "Sembunyikan"
                : `Lihat ${order.photos.length - 2} foto lainnya`}
            </Button>
          )}
        </div>

        {/* Action Footer per Status */}
        {order.status === "pending" && (
          <div className="px-4.5 pb-4 pt-2 border-t border-[#F3F4F6]">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 px-4 transition-all"
            >
              <svg
                className="w-4 h-4 fill-current shrink-0"
                viewBox="0 0 24 24"
              >
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Konfirmasi via WhatsApp</span>
            </a>
          </div>
        )}

        {order.status === "approved" && (
          <div className="px-4.5 pb-4.5 pt-2 border-t border-[#F3F4F6]">
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                id={`download-all-${order.id}`}
                onClick={handleDownloadAll}
                disabled={downloading !== null}
                className="w-full h-11 bg-[#191C21] hover:bg-[#22262E] text-white text-xs font-bold rounded-xl shadow-md"
              >
                {downloading === "all" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Mengompres & menyiapkan file .ZIP...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    <span>
                      Unduh Paket .ZIP ({order.photos.length} Foto HD)
                    </span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        )}

        {order.status === "rejected" && (
          <div className="px-4.5 pb-4 pt-2 border-t border-[#F3F4F6]">
            <p className="text-[11px] text-[#9CA3AF] text-center">
              Pesanan ditolak. Silakan hubungi panitia event untuk klarifikasi.
            </p>
          </div>
        )}
      </Card>

      {/* Lightbox Modal Preview Foto Peserta */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPhoto(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-[#191C21] rounded-3xl overflow-hidden border border-white/10 shadow-2xl text-white flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Camera className="w-4 h-4 text-brand" />
                  <span className="text-sm font-bold">
                    Pratinjau Foto Pesanan
                  </span>
                  {previewPhoto.bibTags && (
                    <Badge className="font-bib text-[10px] bg-brand text-white border-0 px-2 py-0.5">
                      BIB #{previewPhoto.bibTags}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="font-bib text-[10px] bg-white/10 text-white border-white/20"
                  >
                    ID #{previewPhoto.id}
                  </Badge>
                </div>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  aria-label="Tutup pratinjau"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preview Image Container */}
              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] max-h-[60vh] p-2">
                <ProtectedPhoto
                  src={
                    order.status === "approved" && previewPhoto.originalUrl
                      ? previewPhoto.originalUrl
                      : previewPhoto.watermarkedUrl
                  }
                  alt={`Pratinjau Foto ID ${previewPhoto.id}`}
                  className="w-full h-full max-h-[58vh] flex items-center justify-center"
                  imgClassName="w-full h-full object-contain max-h-[58vh] rounded-xl select-none"
                />
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-[#191C21] flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bib uppercase tracking-widest text-gray-400">
                    Harga Foto
                  </p>
                  <p className="font-bib text-xl font-bold text-brand">
                    {formatRupiah(previewPhoto.price)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPreviewPhoto(null)}
                  className="h-11 px-6 rounded-xl border-white/20 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-bold shrink-0"
                >
                  Tutup
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function OrderHistory() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await api.getMyTransactions();
        if (res.success && Array.isArray(res.transactions)) {
          const formatted = res.transactions.map((tx) => ({
            id: tx.id,
            orderNumber: tx.orderNumber,
            status: tx.status,
            total: tx.total,
            createdAt: tx.createdAt,
            photos: (tx.items || []).map((item) => ({
              id: item.photoId || item.id,
              photoId: item.photoId || item.id,
              watermarkedUrl: item.watermarkedUrl,
              originalUrl: item.originalUrl,
              bibTags: item.bibTags,
              originalFilename: item.originalFilename,
              price: item.priceAtPurchase ?? item.price ?? 0,
            })),
          }));
          setOrders(formatted);
        }
      } catch (err) {
        console.error("Fetch my transactions error:", err);
      }
    }
    loadOrders();
  }, []);

  const pending = orders.filter((o) => o.status === "pending").length;
  const approved = orders.filter((o) => o.status === "approved").length;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-lg mx-auto px-4 pb-12"
      >
        {/* Header */}
        <div className="py-6">
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link to="/gallery" id="orders-back-to-gallery">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Kembali ke Galeri
              </Link>
            }
            className="mb-3 px-0 text-xs text-[#4B5563] hover:text-[#111827] h-auto"
          />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                Riwayat Pesanan
              </h1>
              {currentUser && (
                <p className="text-sm text-[#4B5563] mt-1 flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  {currentUser.bibNumber && (
                    <Badge
                      variant="outline"
                      className="font-bib text-brand border-brand/20 bg-brand/10 px-2 py-0.5"
                    >
                      BIB #{currentUser.bibNumber}
                    </Badge>
                  )}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-1.5 shadow-sm">
              <p className="text-xl font-bold text-[#111827] font-bib">
                {orders.length}
              </p>
              <p className="text-[10px] text-[#4B5563]">pesanan</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            {
              label: "Menunggu",
              count: pending,
              cls: "bg-amber-50 border-amber-200 text-amber-700",
            },
            {
              label: "Approved",
              count: approved,
              cls: "bg-green-50 border-green-200 text-green-700",
            },
            {
              label: "Total",
              count: orders.length,
              cls: "bg-brand/5 border-brand/20 text-brand",
            },
          ].map(({ label, count, cls }) => (
            <Card
              key={label}
              className={`p-3 text-center rounded-2xl border shadow-sm ${cls}`}
            >
              <p className="text-xl font-bold font-bib">{count}</p>
              <p className="text-[11px] font-semibold">{label}</p>
            </Card>
          ))}
        </div>

        {/* Banner Ready */}
        {approved > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-800 text-xs font-medium px-4 py-3 rounded-2xl mb-5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />
            <span>
              <strong>{approved} pesanan</strong> sudah disetujui dan foto HD
              siap diunduh!
            </span>
          </motion.div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-bold text-[#111827]">Belum Ada Pesanan</p>
              <p className="text-xs text-[#4B5563] mt-1 mb-4">
                Pilih foto di galeri dan lakukan checkout.
              </p>
              <Button
                variant="link"
                render={<Link to="/gallery">Ke Galeri Foto →</Link>}
                className="text-brand font-bold text-xs"
              />
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </motion.div>
    </AppShell>
  );
}

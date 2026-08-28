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
import { buildWhatsAppUrl } from "../components/cart/cartUtils";

const formatRupiah = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(v ?? 0);

const STATUS_MAP = {
  pending: {
    label: "Menunggu Verifikasi",
    desc: "Pembayaran Anda sedang diverifikasi. Pesanan Anda sedang ditinjau ulang oleh Admin. Mohon tunggu.",
    icon: Clock,
    cls: "text-amber-700 bg-amber-50 border-amber-200",
  },
  approved: {
    label: "Disetujui — Siap Diunduh",
    desc: "Pembayaran disetujui! Klik tombol unduh untuk mendapatkan foto asli resolusi tinggi.",
    icon: CheckCircle2,
    cls: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  rejected: {
    label: "Ditolak",
    desc: "Pembayaran tidak dapat diverifikasi. Hubungi Admin untuk informasi lebih lanjut.",
    icon: XCircle,
    cls: "text-red-700 bg-red-50 border-red-200",
  },
};

function OrderCard({ order, currentUser, activeEvent }) {
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
      const blob = await api.downloadTransactionZipBlob(order.id);
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
      alert(err.message || "Gagal mengunduh berkas ZIP transaksi.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all">
        {/* Header Order */}
        <div className="px-4.5 pt-4.5 pb-3.5 border-b border-[#F1F5F9]">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Package className="w-4 h-4 text-brand shrink-0" />
                <span className="font-bib text-xs text-[#0F172A] font-bold">
                  {order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
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

        {/* Alert Unduhan Berhasil */}
        {downloadSuccess && (
          <div className="px-4.5 pt-3">
            <Alert className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3.5 shadow-xs flex items-start gap-3">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <AlertTitle className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <span>Unduhan Foto Berhasil!</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-bib bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                  >
                    Original HD
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-[11px] text-emerald-700 leading-relaxed mt-0.5">
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
                  className="w-full bg-[#FAFBFD] border-[#E2E8F0] rounded-xl p-2"
                >
                  <AttachmentMedia
                    variant="image"
                    onClick={() => setPreviewPhoto(photo)}
                    className="w-12 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer relative group/img bg-[#0F172A]"
                  >
                    <ProtectedPhoto
                      src={
                        order.status === "approved" && photo.originalUrl
                          ? photo.originalUrl
                          : photo.watermarkedUrl
                      }
                      alt={photo.originalFilename || photo.original_filename || `Foto #${photo.id}`}
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
                          className="text-xs font-bold text-[#0F172A] cursor-pointer hover:text-brand transition-colors"
                          title={photo.originalFilename || photo.original_filename || `Foto #${photo.id}`}
                        >
                          {photo.originalFilename || photo.original_filename || photo.title || photo.name || `Foto #${photo.id}`}
                        </AttachmentTitle>
                        {photo.bibTags && (
                          <Badge
                            variant="secondary"
                            className="font-bib text-[9px] text-brand bg-brand/10 px-1.5 py-0.5 rounded-md font-bold"
                          >
                            Label: {photo.bibTags}
                          </Badge>
                        )}
                      </div>
                      <span className="font-bib text-xs font-bold text-brand">
                        {formatRupiah(photo.price)}
                      </span>
                    </div>

                    <AttachmentDescription className="flex items-center gap-1.5 text-[10px] text-[#64748B] font-bib mt-1">
                      <Paperclip className="w-3 h-3 text-brand shrink-0" />
                      <span className="truncate">
                        {photo.originalFilename || `IMG_${photo.id}.jpg`}
                      </span>
                      <span>·</span>
                      <span className="text-[#94A3B8] font-medium">
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
                          className="shrink-0 text-xs font-bold text-brand hover:text-[#C2410C] hover:bg-orange-50 h-8 px-2.5 rounded-lg min-h-[36px]"
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
              className="mt-2 text-xs text-[#475569] hover:text-brand px-0 h-auto font-medium"
            >
              <ChevronRight
                className={`w-3.5 h-3.5 mr-1 transition-transform ${expanded ? "rotate-90" : ""}`}
              />
              {expanded
                ? "Sembunyikan"
                : `Lihat ${order.photos.length - 2} foto lainnya`}
            </Button>
          )}

          {/* Unduh Semua Foto (ZIP) */}
          {order.status === "approved" && order.photos.length > 1 && (
            <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
              <Button
                onClick={handleDownloadAll}
                disabled={downloading !== null}
                className="w-full bg-[#0F172A] hover:bg-brand text-white font-bold text-xs min-h-[44px] rounded-xl shadow-xs flex items-center justify-center gap-2"
              >
                {downloading === "all" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>Membuat Berkas ZIP...</span></>
                ) : (
                  <><Download className="w-4 h-4" /><span>Unduh Semua Foto (ZIP)</span></>
                )}
              </Button>
            </div>
          )}
        </div>

        {order.status === "pending" && (
          <div className="px-4.5 pb-4 pt-2 border-t border-[#F1F5F9]">
            <a
              href={buildWhatsAppUrl({
                orderNumber: order.orderNumber,
                userName: currentUser?.name || "Peserta",
                bibNumber: currentUser?.bibNumber || null,
                items: order.photos || [],
                total: order.total || 0,
                waNumber: activeEvent?.whatsappNumber,
              })}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs min-h-[44px] rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors px-4 py-2.5 text-center"
            >
              <span>Konfirmasi via WhatsApp</span>
            </a>
          </div>
        )}

        {order.status === "rejected" && (
          <div className="px-4.5 pb-4 pt-2 border-t border-[#F1F5F9]">
            <p className="text-[11px] text-[#94A3B8] text-center">
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
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-2xl w-full bg-[#1E293B] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl text-white flex flex-col max-h-[90vh]"
            >
              {/* Header Modal */}
              <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Camera className="w-4 h-4 text-brand" />
                  <span className="text-sm font-bold">
                    Pratinjau Foto Pesanan
                  </span>
                  {previewPhoto.bibTags && (
                    <Badge className="font-bib text-[10px] bg-brand text-white border-0 px-2 py-0.5 font-bold">
                      Label: {previewPhoto.bibTags}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="font-bib text-[10px] bg-slate-800 text-[#CBD5E1] border-slate-700"
                  >
                    ID #{previewPhoto.id}
                  </Badge>
                </div>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
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
              <div className="p-4 sm:p-5 border-t border-slate-700 bg-[#1E293B] flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bib uppercase tracking-widest text-slate-400 font-semibold">
                    Harga Foto
                  </p>
                  <p className="font-bib text-xl font-bold text-brand">
                    {formatRupiah(previewPhoto.price)}
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setPreviewPhoto(null)}
                  className="h-11 px-6 rounded-xl border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold shrink-0 min-h-[44px]"
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
  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const [txRes, eventRes] = await Promise.all([
          api.getMyTransactions(),
          api.getActiveEvent(currentUser?.eventId),
        ]);

        if (eventRes.success && eventRes.event) {
          setActiveEvent(eventRes.event);
        }

        if (txRes.success && Array.isArray(txRes.transactions)) {
          const formatted = txRes.transactions.map((tx) => ({
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
  }, [currentUser?.eventId]);

  const pending = orders.filter((o) => o.status === "pending").length;
  const approved = orders.filter((o) => o.status === "approved").length;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="max-w-lg mx-auto px-4 pb-12 font-sans antialiased"
      >
        {/* Header */}
        <div className="py-6">
          <Link
            to="/gallery"
            id="orders-back-to-gallery"
            className="inline-flex items-center text-xs text-[#475569] hover:text-[#0F172A] mb-3 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span>Kembali ke Galeri</span>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                Riwayat Pesanan
              </h1>
              {currentUser && (
                <p className="text-sm text-[#475569] mt-1 flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  {currentUser.bibNumber && (
                    <Badge
                      variant="outline"
                      className="font-bib text-brand border-brand/30 bg-brand/10 px-2 py-0.5 font-bold"
                    >
                      Label: {currentUser.bibNumber}
                    </Badge>
                  )}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 bg-white border border-[#E2E8F0] rounded-2xl px-3.5 py-1.5 shadow-xs">
              <p className="text-xl font-extrabold text-[#0F172A] font-bib">
                {orders.length}
              </p>
              <p className="text-[10px] text-[#475569] font-medium">pesanan</p>
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
              cls: "bg-emerald-50 border-emerald-200 text-emerald-700",
            },
            {
              label: "Total",
              count: orders.length,
              cls: "bg-brand/5 border-brand/20 text-brand",
            },
          ].map(({ label, count, cls }) => (
            <Card
              key={label}
              className={`p-3 text-center rounded-2xl border shadow-xs ${cls}`}
            >
              <p className="text-xl font-extrabold font-bib">{count}</p>
              <p className="text-[11px] font-bold">{label}</p>
            </Card>
          ))}
        </div>

        {/* Banner Ready */}
        {approved > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium px-4 py-3 rounded-2xl mb-5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>
              <strong>{approved} pesanan</strong> sudah disetujui dan foto HD
              siap diunduh!
            </span>
          </motion.div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs">
              <ShoppingBag className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
              <p className="font-extrabold text-[#0F172A]">Belum Ada Pesanan</p>
              <p className="text-xs text-[#475569] mt-1 mb-4">
                Pilih foto di galeri dan lakukan checkout.
              </p>
              <Link to="/gallery" className="text-brand font-bold text-xs inline-flex items-center gap-1 hover:underline">
                <span>Ke Galeri Foto</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                currentUser={currentUser}
                activeEvent={activeEvent}
              />
            ))
          )}
        </div>
      </motion.div>
    </AppShell>
  );
}

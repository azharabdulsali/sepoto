import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Download, Clock, CheckCircle2, XCircle,
  Camera, ArrowLeft, RefreshCw, ChevronRight, Package,
  ExternalLink, Loader2
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

// ─── Format Rupiah ────────────────────────────────────────────────────
const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v ?? 0);

// ─── Dummy order history peserta ──────────────────────────────────────
const DUMMY_ORDERS = [
  {
    id:          1,
    orderNumber: 'SEPOTO-20260801-4821',
    status:      'approved',
    total:       75000,
    createdAt:   '1 Agu 2026, 10:23',
    photos: [
      { id: 10, watermarkedUrl: 'https://picsum.photos/seed/sepoto10/400/500', bibTags: '101', price: 25000 },
      { id: 12, watermarkedUrl: 'https://picsum.photos/seed/sepoto12/400/500', bibTags: '101', price: 25000 },
      { id: 15, watermarkedUrl: 'https://picsum.photos/seed/sepoto15/400/500', bibTags: null,  price: 25000 },
    ],
  },
  {
    id:          2,
    orderNumber: 'SEPOTO-20260801-7732',
    status:      'pending',
    total:       35000,
    createdAt:   '1 Agu 2026, 11:45',
    photos: [
      { id: 7, watermarkedUrl: 'https://picsum.photos/seed/sepoto7/400/500', bibTags: '101', price: 35000 },
    ],
  },
  {
    id:          3,
    orderNumber: 'SEPOTO-20260731-1234',
    status:      'rejected',
    total:       60000,
    createdAt:   '31 Jul 2026, 15:10',
    photos: [
      { id: 3, watermarkedUrl: 'https://picsum.photos/seed/sepoto3/400/500', bibTags: null,  price: 35000 },
      { id: 5, watermarkedUrl: 'https://picsum.photos/seed/sepoto5/400/500', bibTags: '101', price: 25000 },
    ],
  },
];

// ─── Status config ────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:  {
    label: 'Menunggu Verifikasi',
    desc:  'Pembayaran Anda sedang diverifikasi oleh Admin. Mohon tunggu.',
    icon:  Clock,
    cls:   'text-amber-600 bg-amber-50 border-amber-200',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  approved: {
    label: 'Disetujui — Siap Diunduh',
    desc:  'Pembayaran disetujui! Klik tombol unduh untuk mendapatkan foto asli beresolusi tinggi.',
    icon:  CheckCircle2,
    cls:   'text-green-600 bg-green-50 border-green-200',
    badge: 'bg-green-50 text-green-600 border-green-200',
  },
  rejected: {
    label: 'Ditolak',
    desc:  'Pembayaran tidak dapat diverifikasi. Hubungi Admin untuk informasi lebih lanjut.',
    icon:  XCircle,
    cls:   'text-red-500 bg-red-50 border-red-200',
    badge: 'bg-red-50 text-red-500 border-red-200',
  },
};

// ─── OrderCard ────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const [downloading, setDownloading] = useState(null);
  const [expanded, setExpanded]       = useState(false);
  const cfg = STATUS_MAP[order.status];
  const StatusIcon = cfg.icon;

  const handleDownload = async (photoId) => {
    setDownloading(photoId);
    // TODO: GET /api/photos/:id/download → pre-signed URL dari Cloudflare R2
    await new Promise((r) => setTimeout(r, 1000));
    setDownloading(null);
    // Simulasi buka URL unduh
    alert(`[Demo] Foto #${photoId} akan diunduh dari URL pre-signed R2`);
  };

  const handleDownloadAll = async () => {
    setDownloading('all');
    await new Promise((r) => setTimeout(r, 1500));
    setDownloading(null);
    alert(`[Demo] Semua ${order.photos.length} foto dari order ${order.orderNumber} diunduh`);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
      {/* Header Order */}
      <div className={`px-4 pt-4 pb-3 border-b border-[#F3F4F6]`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Package className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
              <span className="font-bib text-[11px] text-[#4B5563]">{order.orderNumber}</span>
            </div>
            <p className="text-xs text-[#9CA3AF]">{order.createdAt} · {order.photos.length} foto</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold text-brand text-sm">{formatRupiah(order.total)}</p>
          </div>
        </div>

        {/* Status bar */}
        <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border ${cfg.cls}`}>
          <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold">{cfg.label}</p>
            <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{cfg.desc}</p>
          </div>
        </div>
      </div>

      {/* Foto thumbnails */}
      <div className="px-4 py-3">
        <div
          className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[1000px]' : 'max-h-[120px]'}`}
        >
          <div className="flex flex-col gap-2">
            {order.photos.map((photo) => (
              <div key={photo.id} className="flex items-center gap-3">
                {/* Thumbnail */}
                <div className="w-14 h-16 rounded-lg overflow-hidden bg-[#F3F4F6] shrink-0">
                  <img
                    src={photo.watermarkedUrl}
                    alt={`Foto #${photo.id}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#111827]">Foto #{photo.id}</p>
                  {photo.bibTags && (
                    <span className="font-bib text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                      BIB #{photo.bibTags}
                    </span>
                  )}
                  <p className="text-xs text-[#4B5563] mt-0.5">{formatRupiah(photo.price)}</p>
                </div>

                {/* Download per foto */}
                {order.status === 'approved' && (
                  <button
                    id={`download-photo-${photo.id}`}
                    onClick={() => handleDownload(photo.id)}
                    disabled={downloading !== null}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand hover:text-[#C2410C] disabled:opacity-50 transition-colors"
                    aria-label={`Unduh foto #${photo.id}`}
                  >
                    {downloading === photo.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expand/collapse jika foto > 2 */}
        {order.photos.length > 2 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs text-[#4B5563] hover:text-brand transition-colors flex items-center gap-1"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            {expanded ? 'Sembunyikan' : `Lihat ${order.photos.length - 2} foto lainnya`}
          </button>
        )}
      </div>

      {/* Download all button — hanya jika approved */}
      {order.status === 'approved' && (
        <div className="px-4 pb-4 pt-2 border-t border-[#F3F4F6]">
          <button
            id={`download-all-${order.id}`}
            onClick={handleDownloadAll}
            disabled={downloading !== null}
            className="w-full flex items-center justify-center gap-2 bg-[#191C21] hover:bg-[#22262E] disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors active:scale-[0.98]"
          >
            {downloading === 'all'
              ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyiapkan unduhan...</span></>
              : <><Download className="w-4 h-4" /><span>Unduh Semua Foto ({order.photos.length} foto)</span></>
            }
          </button>
        </div>
      )}

      {/* Rejected: info kontak */}
      {order.status === 'rejected' && (
        <div className="px-4 pb-4 pt-2 border-t border-[#F3F4F6]">
          <p className="text-[11px] text-[#9CA3AF] text-center">
            Pesanan ditolak. Hubungi panitia event untuk klarifikasi.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── OrderHistory Page ────────────────────────────────────────────────
export default function OrderHistory() {
  const { currentUser } = useAuth();

  const pending  = DUMMY_ORDERS.filter((o) => o.status === 'pending').length;
  const approved = DUMMY_ORDERS.filter((o) => o.status === 'approved').length;

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 pb-10">

        {/* Header */}
        <div className="py-6">
          <Link
            to="/gallery"
            id="orders-back-to-gallery"
            className="flex items-center gap-1.5 text-sm text-[#4B5563] hover:text-[#111827] transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Galeri
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
                Riwayat Pesanan
              </h1>
              {currentUser && (
                <p className="text-sm text-[#4B5563] mt-1">
                  {currentUser.name}
                  {currentUser.bibNumber && (
                    <> · <span className="font-bib text-brand">BIB #{currentUser.bibNumber}</span></>
                  )}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-[#111827]">{DUMMY_ORDERS.length}</p>
              <p className="text-xs text-[#4B5563]">total pesanan</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: 'Menunggu', count: pending,  cls: 'bg-amber-50 border-amber-200 text-amber-600' },
            { label: 'Approved', count: approved, cls: 'bg-green-50 border-green-200 text-green-600' },
            { label: 'Total',    count: DUMMY_ORDERS.length, cls: 'bg-brand/5 border-brand/20 text-brand' },
          ].map(({ label, count, cls }) => (
            <div key={label} className={`rounded-xl border p-3 text-center ${cls}`}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-[11px] font-semibold">{label}</p>
            </div>
          ))}
        </div>

        {/* Info: foto siap diunduh */}
        {approved > 0 && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
            <span><strong>{approved} pesanan</strong> sudah disetujui dan siap diunduh.</span>
          </div>
        )}

        {/* Orders list */}
        <div className="space-y-4">
          {DUMMY_ORDERS.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <ShoppingBag className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-semibold text-[#111827]">Belum ada pesanan</p>
              <p className="text-sm text-[#4B5563] mt-1 mb-4">Pilih foto di galeri dan lakukan checkout</p>
              <Link to="/gallery" className="text-sm font-semibold text-brand hover:underline">
                Ke Galeri →
              </Link>
            </div>
          ) : (
            DUMMY_ORDERS.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      </div>
    </AppShell>
  );
}

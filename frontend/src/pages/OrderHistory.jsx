import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Download, Clock, CheckCircle2, XCircle,
  ArrowLeft, ChevronRight, Package, Loader2, Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
} from '@/components/ui/attachment';
import AppShell from '../components/AppShell';
import ProtectedPhoto from '../components/ProtectedPhoto';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v ?? 0);

const STATUS_MAP = {
  pending:  {
    label: 'Menunggu Verifikasi',
    desc:  'Pembayaran Anda sedang diverifikasi oleh Admin. Mohon tunggu.',
    icon:  Clock,
    cls:   'text-amber-700 bg-amber-50 border-amber-200',
  },
  approved: {
    label: 'Disetujui — Siap Diunduh',
    desc:  'Pembayaran disetujui! Klik tombol unduh untuk mendapatkan foto asli resolusi tinggi.',
    icon:  CheckCircle2,
    cls:   'text-green-700 bg-green-50 border-green-200',
  },
  rejected: {
    label: 'Ditolak',
    desc:  'Pembayaran tidak dapat diverifikasi. Hubungi Admin untuk informasi lebih lanjut.',
    icon:  XCircle,
    cls:   'text-red-700 bg-red-50 border-red-200',
  },
};

function OrderCard({ order }) {
  const [downloading, setDownloading]         = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);
  const [expanded, setExpanded]               = useState(false);
  const cfg = STATUS_MAP[order.status];
  const StatusIcon = cfg.icon;

  const handleDownload = async (photoId, photoFilename) => {
    setDownloading(photoId);
    setDownloadSuccess(null);
    try {
      const res = await api.getDownloadUrl(order.id, photoId);
      if (res.success && res.downloadUrl) {
        const targetName = photoFilename || `IMG_${photoId}.jpg`;
        const link = document.createElement('a');
        link.href = res.downloadUrl;
        link.download = targetName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadSuccess({ photoId, fileName: targetName });
      } else {
        alert(res.message || 'Gagal mengunduh foto.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Terjadi kesalahan saat meminta tautan unduh.');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading('all');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/transactions/${order.id}/download-zip`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal mengunduh file ZIP.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${order.orderNumber || `SEPOTO-${order.id}`}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadSuccess({ photoId: 'all', fileName: `${order.orderNumber || `SEPOTO-${order.id}`}.zip` });
    } catch (err) {
      console.error('Download all zip error:', err);
      alert('Gagal mengunduh berkas ZIP transaksi.');
    } finally {
      setDownloading(null);
    }
  };

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
                <span className="font-bib text-xs text-[#111827] font-bold">{order.orderNumber}</span>
              </div>
              <p className="text-xs text-[#9CA3AF]">{order.createdAt} · {order.photos.length} foto</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-brand text-base font-bib">{formatRupiah(order.total)}</p>
            </div>
          </div>

          <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border ${cfg.cls}`}>
            <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold">{cfg.label}</p>
              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{cfg.desc}</p>
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
                  <Badge variant="outline" className="text-[9px] font-bib bg-green-100 text-green-800 border-green-300">
                    4K HD Original
                  </Badge>
                </AlertTitle>
                <AlertDescription className="text-[11px] text-green-700 leading-relaxed mt-0.5">
                  Berkas lampiran <strong className="font-bib">{downloadSuccess.fileName}</strong> (8.4 MB) tanpa watermark telah tersimpan di perangkat Anda.
                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}

        {/* Thumbnails & Attachments */}
        <div className="px-4.5 py-3">
          <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[1000px]' : 'max-h-[160px]'}`}>
            <div className="flex flex-col gap-2.5">
              {order.photos.map((photo) => (
                <Attachment key={photo.id} size="default" orientation="horizontal" className="w-full bg-[#F9FAFB] border-[#E5E7EB] rounded-xl p-2">
                  <AttachmentMedia variant="image" className="w-12 h-14 rounded-lg overflow-hidden shrink-0">
                    <ProtectedPhoto
                      src={order.status === 'approved' && photo.originalUrl ? photo.originalUrl : photo.watermarkedUrl}
                      alt={`Foto #${photo.id}`}
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover"
                    />
                  </AttachmentMedia>

                  <AttachmentContent className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <AttachmentTitle className="text-xs font-bold text-[#111827]">Foto #{photo.id}</AttachmentTitle>
                      {photo.bibTags && (
                        <Badge variant="secondary" className="font-bib text-[9px] text-brand bg-brand/10 px-1.5 py-0.5 rounded-md">
                          BIB #{photo.bibTags}
                        </Badge>
                      )}
                    </div>
                    <AttachmentDescription className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bib mt-0.5">
                      <Paperclip className="w-3 h-3 text-brand shrink-0" />
                      <span className="truncate">{photo.originalFilename || `IMG_${photo.id}.jpg`}</span>
                      <span>·</span>
                      <span className="text-gray-400 font-medium">Original HD</span>
                    </AttachmentDescription>
                  </AttachmentContent>

                  <AttachmentActions>
                    {order.status === 'approved' && (
                      <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                          id={`download-photo-${photo.id}`}
                          onClick={() => handleDownload(photo.id, photo.originalFilename)}
                          disabled={downloading !== null}
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-xs font-bold text-brand hover:text-[#C2410C] hover:bg-orange-50 h-8 px-2.5 rounded-lg"
                        >
                          {downloading === photo.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <><Download className="w-3.5 h-3.5 mr-1" /><span>Unduh</span></>
                          }
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
              <ChevronRight className={`w-3.5 h-3.5 mr-1 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              {expanded ? 'Sembunyikan' : `Lihat ${order.photos.length - 2} foto lainnya`}
            </Button>
          )}
        </div>

        {order.status === 'approved' && (
          <div className="px-4.5 pb-4.5 pt-2 border-t border-[#F3F4F6]">
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Button
                id={`download-all-${order.id}`}
                onClick={handleDownloadAll}
                disabled={downloading !== null}
                className="w-full h-11 bg-[#191C21] hover:bg-[#22262E] text-white text-xs font-bold rounded-xl shadow-md"
              >
                {downloading === 'all'
                  ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /><span>Mengompres & menyiapkan file .ZIP...</span></>
                  : <><Download className="w-4 h-4 mr-2" /><span>Unduh Paket .ZIP ({order.photos.length} Foto HD)</span></>
                }
              </Button>
            </motion.div>
          </div>
        )}

        {order.status === 'rejected' && (
          <div className="px-4.5 pb-4 pt-2 border-t border-[#F3F4F6]">
            <p className="text-[11px] text-[#9CA3AF] text-center">
              Pesanan ditolak. Silakan hubungi panitia event untuk klarifikasi.
            </p>
          </div>
        )}
      </Card>
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
              bibTags: item.bibTags,
              price: item.priceAtPurchase,
            })),
          }));
          setOrders(formatted);
        }
      } catch (err) {
        console.error('Fetch my transactions error:', err);
      }
    }
    loadOrders();
  }, []);

  const pending  = orders.filter((o) => o.status === 'pending').length;
  const approved = orders.filter((o) => o.status === 'approved').length;

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
          <Button variant="ghost" size="sm" asChild className="mb-3 px-0 text-xs text-[#4B5563] hover:text-[#111827] h-auto">
            <Link to="/gallery" id="orders-back-to-gallery">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Kembali ke Galeri
            </Link>
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                Riwayat Pesanan
              </h1>
              {currentUser && (
                <p className="text-sm text-[#4B5563] mt-1 flex items-center gap-1.5">
                  <span>{currentUser.name}</span>
                  {currentUser.bibNumber && (
                    <Badge variant="outline" className="font-bib text-brand border-brand/20 bg-brand/10 px-2 py-0.5">
                      BIB #{currentUser.bibNumber}
                    </Badge>
                  )}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-1.5 shadow-sm">
              <p className="text-xl font-bold text-[#111827] font-bib">{orders.length}</p>
              <p className="text-[10px] text-[#4B5563]">pesanan</p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: 'Menunggu', count: pending,  cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Approved', count: approved, cls: 'bg-green-50 border-green-200 text-green-700' },
            { label: 'Total',    count: orders.length, cls: 'bg-brand/5 border-brand/20 text-brand' },
          ].map(({ label, count, cls }) => (
            <Card key={label} className={`p-3 text-center rounded-2xl border shadow-sm ${cls}`}>
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
            <span><strong>{approved} pesanan</strong> sudah disetujui dan foto HD siap diunduh!</span>
          </motion.div>
        )}

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
              <p className="font-bold text-[#111827]">Belum Ada Pesanan</p>
              <p className="text-xs text-[#4B5563] mt-1 mb-4">Pilih foto di galeri dan lakukan checkout.</p>
              <Button asChild variant="link" className="text-brand font-bold text-xs">
                <Link to="/gallery">Ke Galeri Foto →</Link>
              </Button>
            </div>
          ) : (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </div>
      </motion.div>
    </AppShell>
  );
}

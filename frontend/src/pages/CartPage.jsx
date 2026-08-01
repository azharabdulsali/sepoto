import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Trash2, ArrowLeft, MessageCircle,
  QrCode, Package, Camera, ChevronRight, AlertCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppShell from '../components/AppShell';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const WA_ADMIN_NUMBER = '6281234567890';

const formatRupiah = (amount) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const generateOrderNumber = () => {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const rand  = String(Math.floor(1000 + Math.random() * 9000));
  return `SEPOTO-${year}${month}${day}-${rand}`;
};

const buildWhatsAppUrl = ({ orderNumber, userName, bibNumber, items, total }) => {
  const photoList = items
    .map((item, idx) => `  ${idx + 1}. Foto ID #${item.id} (BIB: ${item.bibTags ?? 'Umum'}) — ${formatRupiah(item.price)}`)
    .join('\n');

  const message = [
    `🎉 *Konfirmasi Pembayaran Sepoto*`,
    ``,
    `📋 *Nomor Order:* ${orderNumber}`,
    `👤 *Nama:* ${userName}`,
    bibNumber ? `🏷️ *BIB:* #${bibNumber}` : '',
    ``,
    `📸 *Daftar Foto yang Dibeli:*`,
    photoList,
    ``,
    `💰 *Total Pembayaran:* ${formatRupiah(total)}`,
    ``,
    `_Bukti transfer sudah dikirim. Mohon diverifikasi. Terima kasih!_`,
  ]
    .filter(Boolean)
    .join('\n');

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
        <span className="text-xs text-[#4B5563] font-medium truncate">{photo.photographerName ?? 'Fotografer'}</span>
      </div>
      {photo.bibTags && (
        <Badge variant="secondary" className="font-bib text-[10px] text-brand bg-brand/10 mb-1 px-2 py-0.5">
          BIB #{photo.bibTags}
        </Badge>
      )}
      <p className="text-sm font-bold text-brand">{formatRupiah(photo.price)}</p>
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
      QR Code QRIS<br />Pembayaran
    </p>
  </div>
);

export default function CartPage() {
  const { items, removeItem, clearCart, totalPrice, formattedTotal, itemCount } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const orderNumber = useMemo(() => generateOrderNumber(), []);

  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl({
        orderNumber,
        userName:  currentUser?.name ?? 'Peserta',
        bibNumber: currentUser?.bibNumber ?? null,
        items,
        total:     totalPrice,
      }),
    [orderNumber, currentUser, items, totalPrice]
  );

  if (itemCount === 0) {
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
          <h2 className="text-xl font-bold text-[#111827] mb-2">Keranjang Anda Kosong</h2>
          <p className="text-sm text-[#4B5563] mb-6 max-w-xs leading-relaxed">
            Belum ada foto yang dipilih. Kembali ke galeri dan tambahkan foto favorit Anda.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button asChild className="bg-brand hover:bg-[#C2410C] text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-orange-600/20">
              <Link to="/gallery" id="cart-back-to-gallery">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span>Kembali ke Galeri</span>
              </Link>
            </Button>
          </motion.div>
        </div>
      </AppShell>
    );
  }

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
              onClick={() => navigate(-1)}
              id="cart-back-btn"
              className="text-xs text-[#4B5563] hover:text-[#111827] px-0 h-auto mb-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Kembali</span>
            </Button>
            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
              Keranjang Foto
            </h1>
          </div>
          <Badge variant="secondary" className="font-bib text-xs bg-[#F3F4F6] text-[#4B5563] px-3 py-1 rounded-full">
            {itemCount} foto
          </Badge>
        </div>

        {/* Nomor Order Card */}
        <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl px-4 py-3.5 mb-4 flex flex-row items-center gap-3.5 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#9CA3AF] font-bib uppercase tracking-widest font-bold">Nomor Order Transaksi</p>
            <p className="font-bib text-sm text-[#111827] font-bold tracking-wide">{orderNumber}</p>
          </div>
        </Card>

        {/* Daftar Foto */}
        <Card className="bg-white border-[#E5E7EB] rounded-2xl px-4 py-3 mb-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#F3F4F6]">
            <h2 className="text-sm font-bold text-[#111827]">Foto yang Dipilih ({itemCount})</h2>
            <button
              id="cart-clear-all"
              onClick={clearCart}
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
          <h2 className="text-sm font-bold text-[#111827]">Ringkasan Pembayaran</h2>
          <div className="space-y-2">
            {items.map((photo) => (
              <div key={photo.id} className="flex items-center justify-between text-xs">
                <span className="text-[#4B5563] truncate max-w-[65%]">
                  Foto #{photo.id}
                  {photo.bibTags ? ` (BIB #${photo.bibTags})` : ''}
                </span>
                <span className="font-semibold text-[#111827]">{formatRupiah(photo.price)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-[#111827] text-base">Total</span>
            <span className="font-bib text-xl font-bold text-brand">{formattedTotal}</span>
          </div>
        </Card>

        {/* Langkah Pembayaran Dark Card */}
        <div className="bg-[#191C21] rounded-3xl overflow-hidden mb-5 shadow-xl text-white">
          <div className="px-5 pt-6 pb-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <Badge className="font-bib uppercase tracking-widest text-brand bg-brand/10 border-brand/20 px-3 py-1 mb-2">
                Instruksi Pembayaran
              </Badge>
              <h2 className="text-white text-base font-bold">Cara Melakukan Pembayaran</h2>
            </div>
            <Sparkles className="w-5 h-5 text-brand opacity-80" />
          </div>

          <div className="px-5 py-5 space-y-4">
            {[
              { step: '1', title: 'Scan QR Code di bawah', desc: 'Gunakan m-banking atau e-wallet (GoPay, OVO, Dana, ShopeePay) untuk scan QRIS.' },
              { step: '2', title: 'Transfer sesuai total', desc: `Pastikan nominal transfer tepat sebesar: ${formattedTotal}` },
              { step: '3', title: 'Konfirmasi via WhatsApp', desc: 'Klik tombol WhatsApp di bawah — pesan konfirmasi otomatis terisi nomor order & daftar foto.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3.5">
                <div className="w-7 h-7 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bib text-brand font-bold">{step}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 pb-6">
            <div className="bg-white rounded-2xl p-5 text-center shadow-lg">
              <p className="text-[10px] font-bib text-[#4B5563] uppercase tracking-widest font-bold mb-3">
                QRIS Statis Pembayaran
              </p>
              <QrPlaceholder />
              <p className="text-[11px] text-[#9CA3AF] mt-3 leading-relaxed">
                Scan dengan aplikasi m-banking atau e-wallet apapun di Indonesia
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4.5 py-3.5 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Foto asli (tanpa watermark) hanya bisa diunduh setelah Admin <strong>menyetujui</strong> konfirmasi pembayaran Anda. Verifikasi biasanya membutuhkan 1×24 jam.
          </p>
        </div>

        {/* WhatsApp CTA Button */}
        <div className="space-y-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button
              asChild
              id="cart-whatsapp-confirm"
              className="w-full h-14 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm rounded-2xl shadow-xl shadow-green-500/25 flex items-center justify-center gap-2.5"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 fill-white/20" />
                <span>Konfirmasi Pembayaran via WhatsApp</span>
                <ChevronRight className="w-4 h-4 opacity-80" />
              </a>
            </Button>
          </motion.div>

          <p className="text-[11px] text-[#9CA3AF] text-center">
            Pesan konfirmasi & detail pesanan akan terisi secara otomatis di WhatsApp
          </p>
        </div>
      </motion.div>
    </AppShell>
  );
}

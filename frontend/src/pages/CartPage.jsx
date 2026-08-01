import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Trash2, ArrowLeft, MessageCircle,
  QrCode, Package, Camera, ChevronRight, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
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
  <div className="flex items-center gap-3 py-3 border-b border-[#E5E7EB] last:border-0 group">
    <div className="w-16 h-20 rounded-lg overflow-hidden bg-[#F3F4F6] shrink-0">
      <img
        src={photo.watermarkedUrl}
        alt={`Foto #${photo.id}`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>

    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 mb-1">
        <Camera className="w-3 h-3 text-[#4B5563] shrink-0" />
        <span className="text-[11px] text-[#4B5563] truncate">{photo.photographerName ?? 'Fotografer'}</span>
      </div>
      {photo.bibTags && (
        <Badge variant="secondary" className="font-bib text-[10px] text-brand bg-brand/10 mb-1">
          BIB #{photo.bibTags}
        </Badge>
      )}
      <p className="text-sm font-semibold text-brand">{formatRupiah(photo.price)}</p>
    </div>

    <Button
      id={`cart-remove-${photo.id}`}
      onClick={() => onRemove(photo.id)}
      variant="ghost"
      size="icon"
      className="shrink-0 w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50"
      aria-label={`Hapus foto #${photo.id}`}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  </div>
);

const QrPlaceholder = () => (
  <div className="flex flex-col items-center justify-center w-44 h-44 bg-[#F9FAFB] border-2 border-dashed border-[#E5E7EB] rounded-2xl mx-auto">
    <QrCode className="w-16 h-16 text-[#D1D5DB] mb-2" />
    <p className="text-[10px] font-bib text-[#9CA3AF] uppercase tracking-widest text-center px-2">
      QR Code<br />Pembayaran
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
        <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-5">
            <ShoppingCart className="w-9 h-9 text-[#D1D5DB]" />
          </div>
          <h2 className="text-xl font-semibold text-[#111827] mb-2">Keranjang Kosong</h2>
          <p className="text-sm text-[#4B5563] mb-6 max-w-xs">
            Belum ada foto yang dipilih. Kembali ke galeri dan tambahkan foto yang ingin dibeli.
          </p>
          <Button asChild className="bg-brand hover:bg-[#C2410C] text-white font-semibold rounded-xl h-11 px-5">
            <Link to="/gallery" id="cart-back-to-gallery">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span>Kembali ke Galeri</span>
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4 pb-10 animate-fade-in">

        {/* ─── Header ─────────────────────────────────────── */}
        <div className="py-6 flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              id="cart-back-btn"
              className="text-xs text-[#4B5563] hover:text-[#111827] px-0 h-auto mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Kembali</span>
            </Button>
            <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
              Keranjang Foto
            </h1>
          </div>
          <Badge variant="secondary" className="font-bib text-[11px] bg-[#F3F4F6] text-[#4B5563] px-3 py-1">
            {itemCount} foto
          </Badge>
        </div>

        {/* ─── Nomor Order ────────────────────────────────── */}
        <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-xl px-4 py-3 mb-4 flex-row items-center gap-3">
          <Package className="w-4 h-4 text-[#4B5563] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-[#9CA3AF] font-bib uppercase tracking-widest">Nomor Order</p>
            <p className="font-bib text-sm text-[#111827] font-semibold tracking-wide">{orderNumber}</p>
          </div>
        </Card>

        {/* ─── Daftar Foto ────────────────────────────────── */}
        <Card className="bg-white border-[#E5E7EB] rounded-2xl px-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between py-3 border-b border-[#F3F4F6]">
            <h2 className="text-sm font-semibold text-[#111827]">Foto yang Dipilih</h2>
            <button
              id="cart-clear-all"
              onClick={clearCart}
              className="text-[11px] text-red-400 hover:text-red-600 transition-colors font-medium"
            >
              Hapus semua
            </button>
          </div>

          {items.map((photo) => (
            <CartItem key={photo.id} photo={photo} onRemove={removeItem} />
          ))}
        </Card>

        {/* ─── Ringkasan Harga ─────────────────────────────── */}
        <Card className="bg-white border-[#E5E7EB] rounded-2xl p-4 mb-5 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#111827]">Ringkasan Pembayaran</h2>
          <div className="space-y-2">
            {items.map((photo) => (
              <div key={photo.id} className="flex items-center justify-between text-sm">
                <span className="text-[#4B5563] truncate max-w-[60%]">
                  Foto #{photo.id}
                  {photo.bibTags ? ` (BIB #${photo.bibTags})` : ''}
                </span>
                <span className="font-medium text-[#111827]">{formatRupiah(photo.price)}</span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-[#111827]">Total</span>
            <span className="font-bib text-lg font-bold text-brand">{formattedTotal}</span>
          </div>
        </Card>

        {/* ─── Instruksi Pembayaran ────────────────────────── */}
        <div className="bg-[#191C21] rounded-2xl overflow-hidden mb-4">
          <div className="px-4 pt-5 pb-4 border-b border-white/5">
            <Badge className="font-bib uppercase tracking-widest text-brand bg-brand/10 border-brand/20 px-3 py-1 mb-3">
              Langkah Pembayaran
            </Badge>
            <h2 className="text-white text-base font-semibold">Cara Melakukan Pembayaran</h2>
          </div>

          <div className="px-4 py-4 space-y-4">
            {[
              { step: '1', title: 'Scan QR Code di bawah', desc: 'Gunakan aplikasi m-banking atau dompet digital (GoPay, OVO, Dana, dll.) untuk scan QRIS.' },
              { step: '2', title: 'Transfer sesuai total', desc: `Pastikan nominal transfer tepat: ${formattedTotal}` },
              { step: '3', title: 'Konfirmasi via WhatsApp', desc: 'Klik tombol WhatsApp di bawah — pesan konfirmasi sudah otomatis terisi dengan nomor order & daftar foto.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand/20 border border-brand/30 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] font-bib text-brand font-bold">{step}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-5">
            <div className="bg-white rounded-xl p-4">
              <p className="text-[10px] font-bib text-[#4B5563] uppercase tracking-widest text-center mb-3">
                QRIS Statis Pembayaran
              </p>
              <QrPlaceholder />
              <p className="text-[11px] text-[#9CA3AF] text-center mt-3 leading-relaxed">
                Scan dengan aplikasi m-banking atau e-wallet apapun
              </p>
            </div>
          </div>
        </div>

        {/* ─── Info disclaimer ────────────────────────────── */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Foto asli (tanpa watermark) hanya bisa diunduh setelah Admin <strong>menyetujui</strong> konfirmasi pembayaran Anda.
            Proses verifikasi biasanya memakan waktu 1×24 jam.
          </p>
        </div>

        {/* ─── CTA: Tombol WhatsApp ────────────────────────── */}
        <div className="space-y-3">
          <Button
            asChild
            id="cart-whatsapp-confirm"
            className="w-full h-14 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm rounded-2xl shadow-lg shadow-green-500/25 active:scale-[0.98] flex items-center justify-center gap-2.5"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-5 h-5 fill-white/20" />
              <span>Konfirmasi Pembayaran via WhatsApp</span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </a>
          </Button>

          <p className="text-[11px] text-[#9CA3AF] text-center">
            Tombol ini akan membuka WhatsApp dengan pesan konfirmasi yang sudah terisi otomatis
          </p>
        </div>

        <div className="h-4" />
      </div>
    </AppShell>
  );
}

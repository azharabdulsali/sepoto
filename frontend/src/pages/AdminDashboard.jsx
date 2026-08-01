import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckCircle2, XCircle, Clock,
  Upload, Users, Settings, Search,
  FileSpreadsheet, Download, Check, X, Loader2, QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v ?? 0);

const DUMMY_TRANSACTIONS = [
  { id: 1, orderNumber: 'SEPOTO-20260801-4821', userName: 'Budi Santoso',    bibNumber: '101', items: 3, total: 75000,  status: 'pending',  createdAt: '2026-08-01 10:23' },
  { id: 2, orderNumber: 'SEPOTO-20260801-3312', userName: 'Sari Dewi',       bibNumber: '205', items: 1, total: 25000,  status: 'pending',  createdAt: '2026-08-01 10:45' },
  { id: 3, orderNumber: 'SEPOTO-20260801-7890', userName: 'Riko Pratama',    bibNumber: '043', items: 5, total: 125000, status: 'approved', createdAt: '2026-08-01 09:12' },
  { id: 4, orderNumber: 'SEPOTO-20260801-1234', userName: 'Nina Kusuma',     bibNumber: '312', items: 2, total: 60000,  status: 'approved', createdAt: '2026-08-01 08:55' },
  { id: 5, orderNumber: 'SEPOTO-20260801-5566', userName: 'Ahmad Fauzi',     bibNumber: '178', items: 1, total: 35000,  status: 'rejected', createdAt: '2026-08-01 08:30' },
  { id: 6, orderNumber: 'SEPOTO-20260801-9901', userName: 'Lestari Wulan',   bibNumber: '456', items: 4, total: 100000, status: 'pending',  createdAt: '2026-08-01 11:02' },
];

const DUMMY_PARTICIPANTS = [
  { id: 1, name: 'Budi Santoso',  bibNumber: '101', createdAt: '2026-08-01' },
  { id: 2, name: 'Sari Dewi',     bibNumber: '205', createdAt: '2026-08-01' },
  { id: 3, name: 'Riko Pratama',  bibNumber: '043', createdAt: '2026-08-01' },
  { id: 4, name: 'Nina Kusuma',   bibNumber: '312', createdAt: '2026-08-01' },
  { id: 5, name: 'Ahmad Fauzi',   bibNumber: '178', createdAt: '2026-08-01' },
];

const StatusBadge = ({ status }) => {
  const map = {
    pending:  { label: 'Menunggu',  cls: 'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
    approved: { label: 'Disetujui', cls: 'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
    rejected: { label: 'Ditolak',   cls: 'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
  };
  const { label, cls, icon: Icon } = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1 font-bib text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${cls}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </Badge>
  );
};

function OverviewTab({ transactions }) {
  const pending  = transactions.filter((t) => t.status === 'pending').length;
  const approved = transactions.filter((t) => t.status === 'approved').length;
  const rejected = transactions.filter((t) => t.status === 'rejected').length;
  const totalRevenue = transactions
    .filter((t) => t.status === 'approved')
    .reduce((s, t) => s + t.total, 0);

  const stats = [
    { label: 'Menunggu Verifikasi', value: pending,              sub: 'transaksi',         cls: 'bg-amber-50/80 border-amber-200',   textCls: 'text-amber-700' },
    { label: 'Disetujui',           value: approved,             sub: 'transaksi',         cls: 'bg-green-50/80 border-green-200',   textCls: 'text-green-700' },
    { label: 'Ditolak',             value: rejected,             sub: 'transaksi',         cls: 'bg-red-50/80 border-red-200',       textCls: 'text-red-600' },
    { label: 'Total Pendapatan',    value: formatRupiah(totalRevenue), sub: 'dari order approved', cls: 'bg-brand/5 border-brand/20', textCls: 'text-brand' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, cls, textCls }) => (
          <motion.div key={label} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
            <Card className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
              <p className={`text-xl sm:text-2xl font-bold font-bib ${textCls}`}>{value}</p>
              <p className="text-xs font-bold text-[#111827] mt-0.5">{label}</p>
              <p className="text-[11px] text-[#4B5563] mt-0.5">{sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#111827] mb-3">Menunggu Approval ({pending})</h3>
        {transactions.filter((t) => t.status === 'pending').length === 0 ? (
          <Card className="p-8 text-center bg-white border-[#E5E7EB] rounded-2xl">
            <p className="text-sm text-[#4B5563]">Tidak ada transaksi yang menunggu verifikasi.</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {transactions.filter((t) => t.status === 'pending').map((t) => (
              <Card key={t.id} className="bg-white border-[#E5E7EB] rounded-2xl p-4 flex flex-row items-center gap-3.5 shadow-sm hover:shadow-md transition-all">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111827] truncate">{t.userName}</p>
                  <p className="font-bib text-xs text-[#4B5563] mt-0.5">{t.orderNumber} · BIB #{t.bibNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand font-bib">{formatRupiah(t.total)}</p>
                  <p className="text-[11px] text-[#4B5563]">{t.items} foto</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionsTab({ transactions = [], onUpdateStatus }) {
  const [filter, setFilter]             = useState('all');
  const [search, setSearch]             = useState('');
  const [loadingId, setLoadingId]       = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);

  const updateStatus = async (id, newStatus) => {
    setLoadingId(id);
    try {
      const res = await api.updateTransactionStatus(id, newStatus);
      if (res.success) {
        if (onUpdateStatus) onUpdateStatus(id, newStatus);
      } else {
        alert(res.message || 'Gagal mengubah status.');
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Terjadi kesalahan saat mengubah status.');
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.userName.toLowerCase().includes(search.toLowerCase())
      || t.orderNumber.includes(search) || t.bibNumber.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563] pointer-events-none z-10" />
          <Input
            id="payment-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor order, atau BIB..."
            className="pl-10 h-11 border-[#E5E7EB] rounded-xl text-sm"
          />
        </div>
        <select
          id="payment-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-[#E5E7EB] rounded-xl px-3.5 h-11 text-sm focus:outline-none focus:border-brand/50 bg-white font-medium text-[#111827]"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-[#4B5563] py-12 text-center">Tidak ada data transaksi yang cocok</p>
        )}
        {filtered.map((t) => (
          <Card key={t.id} className="bg-white border-[#E5E7EB] rounded-2xl p-4.5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-bold text-[#111827]">{t.userName}</p>
                  <Badge variant="secondary" className="font-bib text-[10px] bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                    BIB #{t.bibNumber}
                  </Badge>
                  <StatusBadge status={t.status} />
                </div>
                <p className="font-bib text-xs text-[#4B5563] mb-1">{t.orderNumber}</p>
                <p className="text-[11px] text-[#9CA3AF]">{t.items} foto · {t.createdAt}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-brand font-bib text-base">{formatRupiah(t.total)}</p>
              </div>
            </div>

            {t.status === 'pending' && (
              <div className="flex gap-2.5 mt-3.5 pt-3.5 border-t border-[#F3F4F6]">
                <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                  <Button
                    id={`approve-${t.id}`}
                    onClick={() => setActionConfirm({ type: 'approve', item: t })}
                    disabled={loadingId === t.id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold h-10 rounded-xl shadow-sm"
                  >
                    {loadingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Check className="w-3.5 h-3.5 mr-1.5" />}
                    Approve Pembayaran
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                  <Button
                    id={`reject-${t.id}`}
                    onClick={() => setActionConfirm({ type: 'reject', item: t })}
                    disabled={loadingId === t.id}
                    variant="outline"
                    className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200 text-xs font-bold h-10 rounded-xl"
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Tolak
                  </Button>
                </motion.div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <AlertDialog open={Boolean(actionConfirm)} onOpenChange={(open) => !open && setActionConfirm(null)}>
        <AlertDialogContent className="bg-[#191C21] border border-white/10 text-white rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold">
              {actionConfirm?.type === 'approve' ? 'Konfirmasi Persetujuan Pembayaran' : 'Konfirmasi Penolakan Pembayaran'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-2">
              {actionConfirm?.type === 'approve' ? (
                <>
                  Apakah Anda yakin ingin menyetujui transaksi{' '}
                  <strong className="text-white font-bib">{actionConfirm?.item?.orderNumber}</strong> milik{' '}
                  <strong className="text-white">{actionConfirm?.item?.userName}</strong> (BIB #{actionConfirm?.item?.bibNumber}) sebesar{' '}
                  <strong className="text-brand font-bib">{formatRupiah(actionConfirm?.item?.total)}</strong>?
                  <br />
                  <span className="text-green-400 text-xs mt-2 block">
                    ✓ Akses unduhan foto HD tanpa watermark akan langsung diberikan kepada peserta.
                  </span>
                </>
              ) : (
                <>
                  Apakah Anda yakin ingin menolak transaksi{' '}
                  <strong className="text-white font-bib">{actionConfirm?.item?.orderNumber}</strong> milik{' '}
                  <strong className="text-white">{actionConfirm?.item?.userName}</strong> (BIB #{actionConfirm?.item?.bibNumber})?
                  <br />
                  <span className="text-red-400 text-xs mt-2 block">
                    ✕ Peserta tidak dapat mengakses unduhan foto HD untuk transaksi ini.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="bg-white/10 hover:bg-white/20 text-white border-0 rounded-xl text-xs font-bold h-10 mt-0">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              id="confirm-payment-action-btn"
              onClick={() => {
                if (actionConfirm) {
                  updateStatus(actionConfirm.item.id, actionConfirm.type === 'approve' ? 'approved' : 'rejected');
                  setActionConfirm(null);
                }
              }}
              className={`rounded-xl text-xs font-bold h-10 px-5 text-white shadow-md transition-colors ${
                actionConfirm?.type === 'approve'
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
              }`}
            >
              {actionConfirm?.type === 'approve' ? 'Ya, Approve Pembayaran' : 'Ya, Tolak Pembayaran'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ParticipantsTab() {
  const csvRef = useRef(null);
  const [participants] = useState(DUMMY_PARTICIPANTS);
  const [isImporting, setIsImporting]   = useState(false);
  const [importSuccess, setImportSuccess] = useState('');

  const handleCsvImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportSuccess('');
    await new Promise((r) => setTimeout(r, 1200));
    setIsImporting(false);
    setImportSuccess(`File "${file.name}" berhasil diimport. 5 peserta baru ditambahkan.`);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111827]">Import Peserta via CSV/Excel</h3>
            <p className="text-xs text-[#4B5563] mt-0.5 leading-relaxed">
              Upload file CSV/Excel dengan kolom: <span className="font-bib text-brand font-bold">Nama Lengkap</span> dan <span className="font-bib text-brand font-bold">Nomor BIB</span>.
            </p>
          </div>
        </div>

        {importSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3 rounded-xl mb-3"
          >
            <Check className="w-4 h-4 shrink-0 text-green-600" />
            {importSuccess}
          </motion.div>
        )}

        <div className="flex gap-2.5 flex-wrap">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              id="import-csv-btn"
              onClick={() => csvRef.current?.click()}
              disabled={isImporting}
              className="bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-11 px-5 rounded-xl shadow-md shadow-orange-600/20"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {isImporting ? 'Mengimport...' : 'Pilih File CSV/Excel'}
            </Button>
          </motion.div>
          <Button
            variant="ghost"
            asChild
            id="download-template"
            className="text-xs font-semibold text-[#4B5563] hover:text-brand px-4 h-11"
          >
            <a href="#" onClick={(e) => e.preventDefault()}>
              <Download className="w-4 h-4 mr-1.5" />
              Template CSV
            </a>
          </Button>
          <input ref={csvRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={handleCsvImport} />
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#111827]">Daftar Peserta ({participants.length})</h3>
        </div>

        <div className="sm:hidden space-y-2.5">
          {participants.map((p, i) => (
            <Card key={p.id} className="bg-white border-[#E5E7EB] rounded-2xl px-4 py-3 flex flex-row items-center gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#111827] truncate">{p.name}</p>
                <p className="text-[11px] text-[#9CA3AF]">{p.createdAt}</p>
              </div>
              <Badge variant="outline" className="font-bib text-sm font-bold text-brand border-brand/20 bg-brand/10 shrink-0 px-2.5 py-0.5">
                #{p.bibNumber}
              </Badge>
            </Card>
          ))}
        </div>

        <Card className="hidden sm:block bg-white border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Nama Lengkap</th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Nomor BIB</th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Terdaftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#111827]">{p.name}</td>
                  <td className="px-5 py-3.5 font-bib text-brand font-bold text-sm">#{p.bibNumber}</td>
                  <td className="px-5 py-3.5 text-[#4B5563] text-xs">{p.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function EventSettingsTab() {
  const [form, setForm] = useState({
    title:    'Marathon Boyolali 2026',
    date:     '2026-08-01',
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved]       = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-lg space-y-5">
      <form id="event-settings-form" onSubmit={handleSave} className="space-y-4.5">
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-3 rounded-xl"
          >
            <Check className="w-4 h-4 text-green-600" />
            Pengaturan event berhasil disimpan.
          </motion.div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="event-title" className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
            Nama Event
          </label>
          <Input
            id="event-title"
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="h-11 border-[#E5E7EB] rounded-xl text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="event-date" className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
            Tanggal Event
          </label>
          <Input
            id="event-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="h-11 border-[#E5E7EB] rounded-xl text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
            QR Code Pembayaran QRIS Statis
          </label>
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-6 text-center hover:border-brand/40 transition-colors cursor-pointer bg-[#F9FAFB]">
            <QrCode className="w-9 h-9 text-[#D1D5DB] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">Upload gambar QR Code QRIS</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">PNG atau JPG · Maks. 2MB</p>
            <input type="file" accept="image/*" className="sr-only" id="qr-upload-input" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-sm font-bold text-[#111827]">Status Event</p>
            <p className="text-xs text-[#4B5563] mt-0.5">
              {form.isActive
                ? 'Event sedang aktif. Peserta dapat mencari dan membeli foto.'
                : 'Event non-aktif. Peserta tidak dapat mengakses galeri event.'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Switch
              id="toggle-event-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: checked }))}
            />
            <span className={`text-xs font-bold font-bib ${form.isActive ? 'text-brand' : 'text-gray-500'}`}>
              {form.isActive ? 'AKTIF' : 'NON-AKTIF'}
            </span>
          </div>
        </div>

        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            id="save-event-settings"
            type="submit"
            disabled={isSaving}
            className="bg-brand hover:bg-[#C2410C] text-white text-sm font-bold h-11 px-6 rounded-xl shadow-md shadow-orange-600/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab]       = useState('overview');
  const [transactions, setTransactions] = useState([]);

  const fetchTransactions = React.useCallback(async () => {
    try {
      const res = await api.getTransactions();
      if (res.success && res.transactions) {
        setTransactions(res.transactions);
      } else {
        setTransactions(DUMMY_TRANSACTIONS);
      }
    } catch (err) {
      console.error('Fetch transactions error:', err);
      setTransactions(DUMMY_TRANSACTIONS);
    }
  }, []);

  React.useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleUpdateStatus = (id, newStatus) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const tabs = [
    { id: 'overview',  label: 'Overview',     icon: LayoutDashboard },
    { id: 'payments',  label: 'Pembayaran',   icon: CheckCircle2 },
    { id: 'participants', label: 'Peserta',   icon: Users },
    { id: 'settings',  label: 'Event',        icon: Settings },
  ];

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  return (
    <AppShell>
      <div className="max-w-screen-lg mx-auto px-4 pb-12">

        <div className="py-6 md:py-8 border-b border-[#E5E7EB]">
          <Badge variant="outline" className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-red-600 bg-red-50 border-red-200 px-3 py-1 rounded-full mb-2">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Super Admin
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-[#4B5563] mt-1">
            Selamat datang, <span className="font-semibold text-[#111827]">{currentUser?.name}</span>
          </p>
        </div>

        <div className="-mx-4 px-4 mt-5 mb-6 overflow-x-auto">
          <div className="flex gap-1.5 bg-[#F3F4F6] p-1.5 rounded-2xl w-max min-w-full">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                id={`admin-tab-${id}`}
                variant="ghost"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-2 px-4 h-10 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center ${
                  activeTab === id
                    ? 'bg-white text-[#111827] shadow-md'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {id === 'payments' && pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full p-0 flex items-center justify-center border-0 ml-1">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'overview'      && <OverviewTab transactions={transactions} />}
            {activeTab === 'payments'      && (
              <TransactionsTab
                transactions={transactions}
                setTransactions={setTransactions}
                onUpdateStatus={handleUpdateStatus}
              />
            )}
            {activeTab === 'participants'  && <ParticipantsTab />}
            {activeTab === 'settings'      && <EventSettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

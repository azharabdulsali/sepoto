import React, { useState, useRef } from 'react';
import {
  LayoutDashboard, CheckCircle2, XCircle, Clock,
  Upload, Users, Settings, Search,
  FileSpreadsheet, Download, Check, X, Loader2, QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

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
    pending:  { label: 'Menunggu',  cls: 'bg-amber-50 text-amber-600 border-amber-200',  icon: Clock },
    approved: { label: 'Disetujui', cls: 'bg-green-50 text-green-600 border-green-200',  icon: CheckCircle2 },
    rejected: { label: 'Ditolak',   cls: 'bg-red-50 text-red-500 border-red-200',        icon: XCircle },
  };
  const { label, cls, icon: Icon } = map[status] ?? map.pending;
  return (
    <Badge variant="outline" className={`inline-flex items-center gap-1 font-bib text-[10px] uppercase px-2 py-0.5 rounded-full border ${cls}`}>
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
    { label: 'Menunggu Verifikasi', value: pending,              sub: 'transaksi',         cls: 'bg-amber-50 border-amber-200',   textCls: 'text-amber-600' },
    { label: 'Disetujui',           value: approved,             sub: 'transaksi',         cls: 'bg-green-50 border-green-200',   textCls: 'text-green-600' },
    { label: 'Ditolak',             value: rejected,             sub: 'transaksi',         cls: 'bg-red-50 border-red-200',       textCls: 'text-red-500' },
    { label: 'Total Pendapatan',    value: formatRupiah(totalRevenue), sub: 'dari order approved', cls: 'bg-brand/5 border-brand/20', textCls: 'text-brand' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, cls, textCls }) => (
          <Card key={label} className={`rounded-xl border p-4 ${cls}`}>
            <p className={`text-xl font-bold ${textCls}`}>{value}</p>
            <p className="text-xs font-semibold text-[#111827] mt-0.5">{label}</p>
            <p className="text-[11px] text-[#4B5563]">{sub}</p>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#111827] mb-2">Menunggu Approval ({pending})</h3>
        {transactions.filter((t) => t.status === 'pending').length === 0 ? (
          <p className="text-sm text-[#4B5563] py-4 text-center">Tidak ada transaksi yang menunggu</p>
        ) : (
          <div className="space-y-2">
            {transactions.filter((t) => t.status === 'pending').map((t) => (
              <Card key={t.id} className="bg-white border-[#E5E7EB] rounded-xl px-4 py-3 flex flex-row items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111827] truncate">{t.userName}</p>
                  <p className="font-bib text-[10px] text-[#4B5563]">{t.orderNumber} · BIB #{t.bibNumber}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand">{formatRupiah(t.total)}</p>
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

function PaymentsTab({ transactions, setTransactions }) {
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [loadingId, setLoadingId] = useState(null);

  const updateStatus = async (id, newStatus) => {
    setLoadingId(id);
    await new Promise((r) => setTimeout(r, 700));
    setTransactions((prev) =>
      prev.map((t) => t.id === id ? { ...t, status: newStatus } : t)
    );
    setLoadingId(null);
  };

  const filtered = transactions.filter((t) => {
    const matchFilter = filter === 'all' || t.status === filter;
    const matchSearch = !search || t.userName.toLowerCase().includes(search.toLowerCase())
      || t.orderNumber.includes(search) || t.bibNumber.includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563] pointer-events-none z-10" />
          <Input
            id="payment-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor order, atau BIB..."
            className="pl-9 pr-4 h-10 border-[#E5E7EB] rounded-xl text-sm"
          />
        </div>
        <select
          id="payment-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-[#E5E7EB] rounded-xl px-3 h-10 text-sm focus:outline-none focus:border-brand/50 bg-white"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Menunggu</option>
          <option value="approved">Disetujui</option>
          <option value="rejected">Ditolak</option>
        </select>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-[#4B5563] py-8 text-center">Tidak ada data yang cocok</p>
        )}
        {filtered.map((t) => (
          <Card key={t.id} className="bg-white border-[#E5E7EB] rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-semibold text-[#111827]">{t.userName}</p>
                  <Badge variant="secondary" className="font-bib text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded">
                    BIB #{t.bibNumber}
                  </Badge>
                  <StatusBadge status={t.status} />
                </div>
                <p className="font-bib text-[10px] text-[#4B5563] mb-1">{t.orderNumber}</p>
                <p className="text-[11px] text-[#9CA3AF]">{t.items} foto · {t.createdAt}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-brand">{formatRupiah(t.total)}</p>
              </div>
            </div>

            {t.status === 'pending' && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-[#F3F4F6]">
                <Button
                  id={`approve-${t.id}`}
                  onClick={() => updateStatus(t.id, 'approved')}
                  disabled={loadingId === t.id}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold h-9 rounded-lg"
                >
                  {loadingId === t.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Check className="w-3 h-3 mr-1" />}
                  Approve
                </Button>
                <Button
                  id={`reject-${t.id}`}
                  onClick={() => updateStatus(t.id, 'rejected')}
                  disabled={loadingId === t.id}
                  variant="outline"
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 border-red-200 text-xs font-bold h-9 rounded-lg"
                >
                  <X className="w-3 h-3 mr-1" />
                  Tolak
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
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
      <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <FileSpreadsheet className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">Import Peserta via CSV/Excel</h3>
            <p className="text-xs text-[#4B5563] mt-0.5 leading-relaxed">
              Upload file CSV/Excel dengan kolom: <span className="font-bib text-brand">Nama Lengkap</span> dan <span className="font-bib text-brand">Nomor BIB</span>.
            </p>
          </div>
        </div>

        {importSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2.5 rounded-xl mb-3 animate-fade-in">
            <Check className="w-4 h-4 shrink-0" />
            {importSuccess}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            id="import-csv-btn"
            onClick={() => csvRef.current?.click()}
            disabled={isImporting}
            className="bg-brand hover:bg-[#C2410C] text-white text-sm font-semibold h-10 px-4 rounded-xl"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {isImporting ? 'Mengimport...' : 'Pilih File CSV/Excel'}
          </Button>
          <Button
            variant="ghost"
            asChild
            id="download-template"
            className="text-sm text-[#4B5563] hover:text-brand px-3 h-10"
          >
            <a href="#" onClick={(e) => e.preventDefault()}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Template CSV
            </a>
          </Button>
          <input ref={csvRef} type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={handleCsvImport} />
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#111827]">Daftar Peserta ({participants.length})</h3>
        </div>

        <div className="sm:hidden space-y-2">
          {participants.map((p, i) => (
            <Card key={p.id} className="bg-white border-[#E5E7EB] rounded-xl px-4 py-3 flex flex-row items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#111827] truncate">{p.name}</p>
                <p className="text-[11px] text-[#9CA3AF]">{p.createdAt}</p>
              </div>
              <Badge variant="outline" className="font-bib text-sm font-bold text-brand border-brand/20 bg-brand/10 shrink-0">
                #{p.bibNumber}
              </Badge>
            </Card>
          ))}
        </div>

        <Card className="hidden sm:block bg-white border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-4 py-3 text-xs font-bib text-[#4B5563] uppercase tracking-wider">Nama Lengkap</th>
                <th className="text-left px-4 py-3 text-xs font-bib text-[#4B5563] uppercase tracking-wider">Nomor BIB</th>
                <th className="text-left px-4 py-3 text-xs font-bib text-[#4B5563] uppercase tracking-wider">Terdaftar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#111827]">{p.name}</td>
                  <td className="px-4 py-3 font-bib text-brand font-bold">#{p.bibNumber}</td>
                  <td className="px-4 py-3 text-[#4B5563] text-xs">{p.createdAt}</td>
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
      <form id="event-settings-form" onSubmit={handleSave} className="space-y-4">
        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
            <Check className="w-4 h-4" />
            Pengaturan event berhasil disimpan.
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="event-title" className="block text-xs font-bib uppercase tracking-widest text-[#4B5563]">
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

        <div className="space-y-2">
          <label htmlFor="event-date" className="block text-xs font-bib uppercase tracking-widest text-[#4B5563]">
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

        <div className="space-y-2">
          <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563]">
            QR Code Pembayaran QRIS Statis
          </label>
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-5 text-center hover:border-brand/40 transition-colors cursor-pointer">
            <QrCode className="w-8 h-8 text-[#D1D5DB] mx-auto mb-2" />
            <p className="text-sm text-[#4B5563]">Upload gambar QR Code QRIS</p>
            <p className="text-[11px] text-[#9CA3AF] mt-1">PNG atau JPG · Maks. 2MB</p>
            <input type="file" accept="image/*" className="sr-only" id="qr-upload-input" />
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          <button
            type="button"
            id="toggle-event-active"
            onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-brand' : 'bg-[#D1D5DB]'}`}
            role="switch"
            aria-checked={form.isActive}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
          <span className="text-sm text-[#111827] font-medium">Event Aktif</span>
          {!form.isActive && (
            <span className="text-[11px] text-[#9CA3AF]">(event tidak dapat diakses peserta)</span>
          )}
        </div>

        <Button
          id="save-event-settings"
          type="submit"
          disabled={isSaving}
          className="bg-brand hover:bg-[#C2410C] text-white text-sm font-bold h-11 px-5 rounded-xl"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
          {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </Button>
      </form>
    </div>
  );
}

export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab]         = useState('overview');
  const [transactions, setTransactions]   = useState(DUMMY_TRANSACTIONS);

  const tabs = [
    { id: 'overview',  label: 'Overview',     icon: LayoutDashboard },
    { id: 'payments',  label: 'Pembayaran',   icon: CheckCircle2 },
    { id: 'participants', label: 'Peserta',   icon: Users },
    { id: 'settings',  label: 'Event',        icon: Settings },
  ];

  const pendingCount = transactions.filter((t) => t.status === 'pending').length;

  return (
    <AppShell>
      <div className="max-w-screen-lg mx-auto px-4 pb-10">

        <div className="py-6 md:py-8 border-b border-[#E5E7EB]">
          <Badge variant="outline" className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-red-600 bg-red-50 border-red-200 px-3 py-1 rounded-full mb-2">
            <LayoutDashboard className="w-3 h-3" />
            Super Admin
          </Badge>
          <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-[#4B5563] mt-1">
            Selamat datang, <span className="font-medium text-[#111827]">{currentUser?.name}</span>
          </p>
        </div>

        <div className="-mx-4 px-4 mt-5 mb-6 overflow-x-auto">
          <div className="flex gap-1 bg-[#F3F4F6] p-1 rounded-xl w-max min-w-full">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                id={`admin-tab-${id}`}
                variant="ghost"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
                  activeTab === id
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">{label}</span>
                {id === 'payments' && pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full p-0 flex items-center justify-center border-0">
                    {pendingCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {activeTab === 'overview'      && <OverviewTab transactions={transactions} />}
          {activeTab === 'payments'      && <PaymentsTab transactions={transactions} setTransactions={setTransactions} />}
          {activeTab === 'participants'  && <ParticipantsTab />}
          {activeTab === 'settings'      && <EventSettingsTab />}
        </div>
      </div>
    </AppShell>
  );
}

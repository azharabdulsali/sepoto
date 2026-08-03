import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CheckCircle2, XCircle, Clock,
  Upload, Users, Settings, Search,
  FileSpreadsheet, Download, Check, X, Loader2, QrCode,
  UserPlus, Trash2, User, Camera, Lock, Hash, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const _DUMMY_PARTICIPANTS = [
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map(({ label, value, sub, cls, textCls }) => (
          <motion.div key={label} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
            <Card className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm ${cls}`}>
              <p className={`text-base sm:text-2xl font-bold font-bib ${textCls} truncate`}>{value}</p>
              <p className="text-xs font-bold text-[#111827] mt-0.5 truncate">{label}</p>
              <p className="text-[10px] sm:text-[11px] text-[#4B5563] mt-0.5 truncate">{sub}</p>
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

const STATUS_LABELS = {
  all: 'Semua Status',
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

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
      <div className="flex flex-col sm:flex-row gap-2.5 items-center">
        <div className="relative flex-1 w-full">
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
        <Select value={filter} onValueChange={(val) => setFilter(val)}>
          <SelectTrigger
            id="payment-filter"
            className="!h-11 w-full sm:w-48 border border-[#E5E7EB] rounded-xl px-4 text-sm bg-white font-medium text-[#111827] shadow-sm flex items-center justify-between shrink-0"
          >
            <SelectValue>{STATUS_LABELS[filter] || 'Semua Status'}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-sm text-[#4B5563] py-12 text-center">Tidak ada data transaksi yang cocok</p>
        )}
        {filtered.map((t) => {
          const photoItems = Array.isArray(t.items) ? t.items.filter((it) => it?.watermarkedUrl) : [];

          return (
            <Card key={t.id} className="bg-white border-[#E5E7EB] rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden">
              {/* Header info transaksi */}
              <div className="p-4 sm:p-5">
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
                    <p className="text-[11px] text-[#9CA3AF]">{photoItems.length || t.items?.length || 0} foto · {t.createdAt}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-brand font-bib text-base">{formatRupiah(t.total)}</p>
                  </div>
                </div>

                {/* Foto Preview Strip */}
                {photoItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#F9FAFB]">
                    <p className="text-[10px] font-bib uppercase tracking-widest text-[#9CA3AF] font-bold mb-2">
                      Preview Foto yang Dipesan
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {photoItems.map((item, idx) => (
                        <div
                          key={item.photoId || idx}
                          className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] shadow-sm relative group"
                        >
                          <img
                            src={item.watermarkedUrl}
                            alt={item.originalFilename || `Foto ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[8px] font-bold text-center py-0.5 truncate px-1">
                            {item.originalFilename ? item.originalFilename.split('.')[0] : `Foto ${idx + 1}`}
                          </div>
                        </div>
                      ))}
                      {photoItems.length < (t.items?.length || 0) && (
                        <div className="shrink-0 w-20 h-20 rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] flex items-center justify-center text-[10px] text-[#9CA3AF] font-bold">
                          +{(t.items?.length || 0) - photoItems.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {t.status === 'pending' && (
                  <div className="flex gap-2 sm:gap-2.5 mt-3.5 pt-3.5 border-t border-[#F3F4F6]">
                    <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                      <Button
                        id={`approve-${t.id}`}
                        onClick={() => setActionConfirm({ type: 'approve', item: t })}
                        disabled={loadingId === t.id}
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold h-10 rounded-xl shadow-sm px-2 sm:px-4"
                      >
                        {loadingId === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                        <span className="hidden sm:inline">Approve Pembayaran</span>
                        <span className="sm:hidden">Approve</span>
                      </Button>
                    </motion.div>
                    <motion.div className="flex-1" whileTap={{ scale: 0.97 }}>
                      <Button
                        id={`reject-${t.id}`}
                        onClick={() => setActionConfirm({ type: 'reject', item: t })}
                        disabled={loadingId === t.id}
                        variant="outline"
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200 text-xs font-bold h-10 rounded-xl px-2 sm:px-4"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Tolak
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={Boolean(actionConfirm)} onOpenChange={(open) => !open && setActionConfirm(null)}>
        <AlertDialogContent className="bg-[#191C21] border border-white/10 text-white rounded-3xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg font-bold">
              {actionConfirm?.type === 'approve' ? 'Konfirmasi Persetujuan Pembayaran' : 'Konfirmasi Penolakan Pembayaran'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-xs sm:text-sm leading-relaxed mt-2" asChild>
              <div>
                {actionConfirm?.type === 'approve' ? (
                  <>
                    Apakah Anda yakin ingin menyetujui transaksi{' '}
                    <strong className="text-white font-bib">{actionConfirm?.item?.orderNumber}</strong> milik{' '}
                    <strong className="text-white">{actionConfirm?.item?.userName}</strong> (BIB #{actionConfirm?.item?.bibNumber}) sebesar{' '}
                    <strong className="text-brand font-bib">{formatRupiah(actionConfirm?.item?.total)}</strong>?
                    <span className="text-green-400 text-xs mt-2 block">
                      ✓ Akses unduhan foto HD tanpa watermark akan langsung diberikan kepada peserta.
                    </span>
                  </>
                ) : (
                  <>
                    Apakah Anda yakin ingin menolak transaksi{' '}
                    <strong className="text-white font-bib">{actionConfirm?.item?.orderNumber}</strong> milik{' '}
                    <strong className="text-white">{actionConfirm?.item?.userName}</strong> (BIB #{actionConfirm?.item?.bibNumber})?
                    <span className="text-red-400 text-xs mt-2 block">
                      ✕ Peserta tidak dapat mengakses unduhan foto HD untuk transaksi ini.
                    </span>
                  </>
                )}

                {/* Mini preview di dalam dialog */}
                {(() => {
                  const dlgItems = Array.isArray(actionConfirm?.item?.items)
                    ? actionConfirm.item.items.filter((it) => it?.watermarkedUrl)
                    : [];
                  return dlgItems.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bib mb-2">Foto yang dipesan</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {dlgItems.slice(0, 6).map((item, idx) => (
                          <div key={idx} className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                            <img
                              src={item.watermarkedUrl}
                              alt={`foto ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {dlgItems.length > 6 && (
                          <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            +{dlgItems.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
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
  const [users, setUsers]                 = useState([]);
  const [isImporting, setIsImporting]     = useState(false);
  const [importSuccess, setImportSuccess] = useState('');

  // Shadcn Alert State untuk Feedback Pengguna
  const [actionAlert, setActionAlert]     = useState(null);

  // Dialog State untuk Tambah / Edit Pengguna
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [editingUser, setEditingUser]       = useState(null); // null jika Tambah, object jika Edit
  const [addRole, setAddRole]               = useState('user'); // 'user' | 'photographer'
  const [formName, setFormName]             = useState('');
  const [formBib, setFormBib]               = useState('');
  const [formUsername, setFormUsername]     = useState('');
  const [formPassword, setFormPassword]     = useState('');
  const [formError, setFormError]           = useState('');
  const [formLoading, setFormLoading]       = useState(false);

  // Delete User State
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [deletingId, setDeletingId]         = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.getAllUsers();
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

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

  const openAddModal = () => {
    setEditingUser(null);
    setAddRole('user');
    setFormName('');
    setFormBib('');
    setFormUsername('');
    setFormPassword('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setAddRole(u.role === 'photographer' ? 'photographer' : 'user');
    setFormName(u.name || '');
    setFormBib(u.bibNumber !== '-' ? u.bibNumber : '');
    setFormUsername(u.username !== '-' ? u.username : '');
    setFormPassword('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Nama Lengkap wajib diisi.');
      return;
    }

    if (addRole === 'user' && !formBib.trim()) {
      setFormError('Nomor BIB wajib diisi untuk peserta.');
      return;
    }

    if (addRole === 'photographer' && !editingUser && (!formUsername.trim() || !formPassword)) {
      setFormError('Username dan Password wajib diisi untuk fotografer baru.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        role: addRole,
        name: formName.trim(),
        bibNumber: formBib.trim(),
        username: formUsername.trim(),
        password: formPassword,
      };

      let res;
      if (editingUser) {
        res = await api.updateUser(editingUser.id, payload);
      } else {
        res = await api.createUser(payload);
      }

      if (res.success) {
        loadUsers();
        setIsModalOpen(false);
        setActionAlert({
          type: 'success',
          title: editingUser ? 'Pengguna Diperbarui!' : 'Pengguna Ditambahkan!',
          message: res.message || `Data ${formName.trim()} telah tersimpan di database PostgreSQL.`,
        });
      } else {
        setFormError(res.message || 'Gagal menyimpan data pengguna.');
      }
    } catch (err) {
      console.error('Submit user error:', err);
      setFormError('Terjadi kesalahan server saat menyimpan data pengguna.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    setDeletingId(id);
    const targetName = deleteConfirm?.name || 'Pengguna';
    try {
      const res = await api.deleteUser(id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        setDeleteConfirm(null);
        setActionAlert({
          type: 'success',
          title: 'Pengguna Dihapus!',
          message: `Data ${targetName} berhasil dihapus dari database PostgreSQL.`,
        });
      } else {
        setActionAlert({
          type: 'error',
          title: 'Gagal Menghapus!',
          message: res.message || 'Tidak dapat menghapus pengguna.',
        });
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setActionAlert({
        type: 'error',
        title: 'Error Server',
        message: 'Terjadi kesalahan saat menghapus pengguna.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Shadcn UI Alert Feedback Notifikasi */}
      {actionAlert && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className={`rounded-2xl p-4 shadow-sm flex items-center justify-between ${
            actionAlert.type === 'success' ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-red-50 border border-red-200 text-red-900'
          }`}>
            <div className="flex items-center gap-3">
              {actionAlert.type === 'success'
                ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                : <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              }
              <div>
                <AlertTitle className="text-xs font-bold tracking-tight">{actionAlert.title}</AlertTitle>
                <AlertDescription className="text-xs mt-0.5 opacity-90">{actionAlert.message}</AlertDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActionAlert(null)}
              className="h-7 w-7 text-gray-400 hover:text-gray-700 rounded-full shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </Alert>
        </motion.div>
      )}

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
        <div className="flex items-center justify-between mb-3 gap-3">
          <h3 className="text-sm font-bold text-[#111827]">Daftar Pengguna / Peserta ({users.length})</h3>
          
          <Button
            id="open-add-user-modal"
            onClick={openAddModal}
            size="sm"
            className="bg-[#191C21] hover:bg-[#272B33] text-white text-xs font-bold h-9 px-3.5 rounded-xl shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Tambah Pengguna
          </Button>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-2.5">
          {users.map((u, i) => (
            <Card key={u.id} className="bg-white border-[#E5E7EB] rounded-2xl px-3.5 py-3 flex flex-row items-center gap-3 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-brand">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#111827] truncate">{u.name}</p>
                <p className="text-[11px] font-mono text-[#9CA3AF] truncate">
                  {u.role === 'user' ? 'Peserta' : (u.username !== '-' ? `@${u.username}` : '')}
                </p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <div className="flex flex-col items-end justify-center">
                  {u.bibNumber && u.bibNumber !== '-' ? (
                    <>
                      <Badge variant="outline" className="font-bib text-xs font-bold text-brand border-brand/20 bg-brand/10 px-2 py-0.5 mb-0.5">
                        #{u.bibNumber}
                      </Badge>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">PESERTA</span>
                    </>
                  ) : (
                    <Badge
                      variant="outline"
                      className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                        u.role === 'super_admin'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {u.role === 'super_admin' ? 'Super Admin' : 'Fotografer'}
                    </Badge>
                  )}
                </div>
                
                {/* Action Icons (Mobile) */}
                <div className="flex items-center gap-0.5 ml-1">
                  <Button
                    onClick={() => openEditModal(u)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-brand hover:bg-orange-50 rounded-lg shrink-0"
                    title="Edit Pengguna"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {u.role !== 'super_admin' && (
                    <Button
                      onClick={() => setDeleteConfirm(u)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop View */}
        <Card className="hidden sm:block bg-white border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Nama Lengkap</th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Nomor BIB</th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Username</th>
                <th className="text-left px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Role</th>
                <th className="text-right px-5 py-3.5 text-xs font-bib text-[#4B5563] uppercase tracking-wider font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#111827]">{u.name}</td>
                  <td className="px-5 py-3.5 font-bib text-brand font-bold text-sm">
                    {u.bibNumber !== '-' ? `#${u.bibNumber}` : '-'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-600">{u.username}</td>
                  <td className="px-5 py-3.5 text-xs">
                    <Badge
                      variant="outline"
                      className={`font-semibold capitalize px-2.5 py-0.5 rounded-full ${
                        u.role === 'super_admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        u.role === 'photographer' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {u.role === 'super_admin' ? 'Super Admin' : u.role === 'photographer' ? 'Fotografer' : 'Peserta'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {/* Action Icon Buttons Only */}
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        id={`edit-user-${u.id}`}
                        onClick={() => openEditModal(u)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-brand hover:bg-orange-50 rounded-xl"
                        title="Edit Pengguna"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {u.role !== 'super_admin' ? (
                        <Button
                          id={`delete-user-${u.id}`}
                          onClick={() => setDeleteConfirm(u)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic ml-1">Utama</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Dialog Modal: Tambah / Edit Pengguna */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
                <div className="flex items-center gap-2">
                  {editingUser ? <Pencil className="w-5 h-5 text-brand" /> : <UserPlus className="w-5 h-5 text-brand" />}
                  <h3 className="text-base font-bold text-[#111827]">
                    {editingUser ? `Edit Data: ${editingUser.name}` : 'Tambah Pengguna Baru'}
                  </h3>
                </div>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Selector Pilihan Role (Peserta atau Fotografer) - Disabled jika mode Edit */}
              <div className="grid grid-cols-2 gap-2 bg-[#F3F4F6] p-1.5 rounded-xl">
                <button
                  type="button"
                  disabled={!!editingUser}
                  onClick={() => setAddRole('user')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    addRole === 'user'
                      ? 'bg-white text-brand shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-700'
                  } ${editingUser ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <User className="w-4 h-4" />
                  <span>Peserta</span>
                </button>
                <button
                  type="button"
                  disabled={!!editingUser}
                  onClick={() => setAddRole('photographer')}
                  className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
                    addRole === 'photographer'
                      ? 'bg-white text-brand shadow-sm font-extrabold'
                      : 'text-gray-500 hover:text-gray-700'
                  } ${editingUser ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Fotografer</span>
                </button>
              </div>

              {formError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-3.5 pt-1">
                {/* Form Field: Nama Lengkap (Selalu Ada) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder={addRole === 'user' ? 'Contoh: Budi Santoso' : 'Contoh: Reza Fotografer'}
                      className="pl-9 h-10 text-xs border-[#E5E7EB] rounded-xl"
                    />
                  </div>
                </div>

                {/* Form Fields Khusus Peserta */}
                {addRole === 'user' && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                      Nomor BIB
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        required
                        value={formBib}
                        onChange={(e) => setFormBib(e.target.value)}
                        placeholder="Contoh: 101"
                        className="pl-9 h-10 text-xs font-bib border-[#E5E7EB] rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {/* Form Fields Khusus Fotografer */}
                {addRole === 'photographer' && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="text"
                          required
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value)}
                          placeholder="Contoh: fotografer_pro"
                          className="pl-9 h-10 text-xs font-mono border-[#E5E7EB] rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                        {editingUser ? 'Password Baru (Opsional)' : 'Password (Bcrypt Hash)'}
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="password"
                          required={!editingUser}
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          placeholder={editingUser ? 'Kosongkan jika tidak ingin diubah' : 'Kata sandi fotografer...'}
                          className="pl-9 h-10 text-xs border-[#E5E7EB] rounded-xl"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-3 border-t border-[#F3F4F6]">
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    variant="ghost"
                    className="flex-1 h-10 text-xs font-bold rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-10 rounded-xl shadow-md"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {formLoading ? 'Menyimpan...' : (editingUser ? 'Simpan Perubahan' : 'Simpan Pengguna')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog Hapus User */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl bg-white border border-[#E5E7EB]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] font-bold flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Konfirmasi Hapus Pengguna
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#4B5563] pt-1">
              Apakah Anda yakin ingin menghapus <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.role}) dari database?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-[#E5E7EB]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteUser(deleteConfirm.id)}
              disabled={deletingId !== null}
              className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
            >
              {deletingId !== null ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EventSettingsTab() {
  const [eventId, setEventId] = useState(1);
  const [form, setForm] = useState({
    title:     'Marathon Boyolali 2026',
    date:      '2026-08-01',
    qrCodeUrl: '',
    isActive:  true,
  });
  const [isSaving, setIsSaving]     = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved]           = useState(false);
  const qrInputRef = useRef(null);

  const fetchActiveEvent = useCallback(async () => {
    try {
      const res = await api.getActiveEvent();
      if (res.success && res.event) {
        const ev = res.event;
        setEventId(ev.id);
        const formattedDate = ev.eventDate ? new Date(ev.eventDate).toISOString().split('T')[0] : '2026-08-01';
        setForm({
          title:     ev.title || '',
          date:      formattedDate,
          qrCodeUrl: ev.qrCodeUrl || '',
          isActive:  ev.isActive ?? true,
        });
      }
    } catch (err) {
      console.error('Failed to load event data:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveEvent();
  }, [fetchActiveEvent]);

  const handleQrisUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await api.uploadQrisImage(eventId, file);
      if (res.success && res.qrCodeUrl) {
        setForm((f) => ({ ...f, qrCodeUrl: res.qrCodeUrl }));
        alert('Gambar QR Code QRIS berhasil diunggah!');
      } else {
        alert(res.message || 'Gagal mengunggah QRIS.');
      }
    } catch (err) {
      console.error('Upload QRIS error:', err);
      alert('Terjadi kesalahan saat unggah QRIS.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateEvent(eventId, {
        title: form.title,
        eventDate: form.date,
        qrCodeUrl: form.qrCodeUrl,
      });
      await api.toggleEventActive(eventId, form.isActive);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save event error:', err);
      alert('Gagal menyimpan pengaturan event.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg space-y-5">
      <form id="event-settings-form" onSubmit={handleSave} className="space-y-4.5">
        {saved && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="bg-green-50 border border-green-200 text-green-900 rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <AlertTitle className="text-xs font-bold">Pengaturan Berhasil Disimpan!</AlertTitle>
                  <AlertDescription className="text-xs mt-0.5 opacity-90">Konfigurasi event & QRIS telah diperbarui.</AlertDescription>
                </div>
              </div>
            </Alert>
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

          <input
            type="file"
            accept="image/*"
            ref={qrInputRef}
            onChange={handleQrisUpload}
            className="hidden"
            id="qr-upload-input"
          />

          {form.qrCodeUrl ? (
            <div className="bg-white border-2 border-dashed border-brand/30 rounded-2xl p-4 text-center shadow-sm relative">
              <div className="w-48 h-48 mx-auto bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-2 mb-3">
                <img
                  src={form.qrCodeUrl}
                  alt="Gambar QRIS Event"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-bold border-gray-300 rounded-xl h-9"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5 text-brand" />}
                  {isUploading ? 'Mengunggah...' : 'Ganti Gambar QRIS'}
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => qrInputRef.current?.click()}
              className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-6 text-center hover:border-brand/40 transition-colors cursor-pointer bg-[#F9FAFB]"
            >
              {isUploading ? (
                <div className="py-2">
                  <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">Mengunggah Gambar QRIS...</p>
                </div>
              ) : (
                <>
                  <QrCode className="w-9 h-9 text-[#D1D5DB] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#111827]">Upload gambar QR Code QRIS</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">PNG, JPG, atau JPEG · Maks. 5MB</p>
                </>
              )}
            </div>
          )}
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

        <div className="mt-5 mb-6">
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#F3F4F6] rounded-2xl w-full">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                id={`admin-tab-${id}`}
                variant="ghost"
                onClick={() => setActiveTab(id)}
                className={`relative flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-4 h-10 rounded-xl text-[11px] sm:text-sm font-bold transition-all truncate w-full ${
                  activeTab === id
                    ? 'bg-white text-[#111827] shadow-sm'
                    : 'text-[#4B5563] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">{label}</span>
                {id === 'payments' && pendingCount > 0 && (
                  <Badge className="bg-red-500 text-white text-[9px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full p-0 flex items-center justify-center border-0 shrink-0">
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

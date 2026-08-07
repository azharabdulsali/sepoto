import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Check,
  X,
  Camera,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import ProtectedPhoto from "../ProtectedPhoto";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { formatRupiah, STATUS_LABELS } from "./adminUtils.js";
import { StatusBadge } from "./StatusBadge";

export default function TransactionsTab({
  transactions = [],
  loading = false,
  onUpdateStatus,
  events = [],
  selectedEventFilter = "all",
  onEventFilterChange,
}) {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loadingId, setLoadingId] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Action Feedback Alert (Approve / Reject)
  const [actionAlert, setActionAlert] = useState(null);

  const updateStatus = async (id, newStatus, targetItem = null) => {
    setLoadingId(id);
    const item = targetItem || actionConfirm?.item || selectedDetailTx;
    try {
      const res = await api.updateTransactionStatus(id, newStatus);
      if (res.success) {
        if (onUpdateStatus) onUpdateStatus(id, newStatus);
        const isApproved = newStatus === "approved";
        setActionAlert({
          type: "success",
          title: isApproved ? "Pembayaran Disetujui!" : "Pembayaran Ditolak!",
          message: `Transaksi ${item?.orderNumber || ""} milik ${item?.userName || "Peserta"} telah berhasil ${isApproved ? "disetujui" : "ditolak"}.`,
        });
      } else {
        setActionAlert({
          type: "error",
          title: "Gagal Mengubah Status",
          message: res.message || "Gagal mengubah status transaksi.",
        });
      }
    } catch (err) {
      console.error("Update status error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Mengubah Status",
        message: "Terjadi kesalahan koneksi saat mengubah status.",
      });
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchFilter = filter === "all" || t.status === filter;
    const q = search.trim().toLowerCase();
    if (!q) return matchFilter;

    const matchUserName = t.userName && t.userName.toLowerCase().includes(q);
    const matchOrderNumber = t.orderNumber && t.orderNumber.toLowerCase().includes(q);
    const matchBibNumber = t.bibNumber && String(t.bibNumber).toLowerCase().includes(q);
    const matchTxId = t.id && String(t.id).toLowerCase().includes(q);

    return matchFilter && (matchUserName || matchOrderNumber || matchBibNumber || matchTxId);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Shadcn UI Alert Feedback Notifikasi */}
      {actionAlert && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert
            className={`rounded-2xl p-4 shadow-sm flex items-center justify-between ${
              actionAlert.type === "success"
                ? "bg-green-50 border border-green-200 text-green-900"
                : "bg-red-50 border border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {actionAlert.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              ) : (
                <X className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <AlertTitle className="text-xs font-bold tracking-tight">
                  {actionAlert.title}
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5 opacity-90">
                  {actionAlert.message}
                </AlertDescription>
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

      <div className="flex flex-col sm:flex-row gap-2.5 items-center">
        <InputGroup className="h-11 border-[#E5E7EB] rounded-xl bg-white flex-1 w-full">
          <InputGroupAddon align="inline-start">
            <Search className="w-4 h-4 text-[#4B5563]" />
          </InputGroupAddon>
          <InputGroupInput
            id="payment-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan Nomor Pesanan, Nama, Nomor BIB, atau ID..."
            className="text-xs sm:text-sm font-medium text-[#111827]"
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                onClick={() => setSearch("")}
                title="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        {/* Filter Event Dropdown untuk Super Admin pada Menu Pembayaran */}
        {isSuperAdmin && events.length > 0 && (
          <Select
            value={String(selectedEventFilter)}
            onValueChange={(val) =>
              onEventFilterChange && onEventFilterChange(val)
            }
          >
            <SelectTrigger
              id="payment-event-filter"
              className="!h-11 w-full sm:w-48 border border-[#E5E7EB] rounded-xl px-4 text-sm bg-white font-medium text-[#111827] shadow-sm flex items-center justify-between shrink-0"
            >
              <SelectValue placeholder="Pilih Event...">
                {selectedEventFilter === "all"
                  ? "Semua Event"
                  : events.find(
                      (e) => String(e.id) === String(selectedEventFilter),
                    )?.title || "Pilih Event..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50">
              <SelectGroup>
                <SelectItem value="all">
                  Semua Event ({events.length})
                </SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={String(ev.id)}>
                    {ev.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        <Select value={filter} onValueChange={(val) => setFilter(val)}>
          <SelectTrigger
            id="payment-status-filter"
            className="!h-11 w-full sm:w-44 border border-[#E5E7EB] rounded-xl px-4 text-sm bg-white font-medium text-[#111827] shadow-sm flex items-center justify-between shrink-0"
          >
            <SelectValue placeholder="Status...">
              {STATUS_LABELS[filter] || "Pilih Status..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50">
            <SelectGroup>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="bg-white border-[#E5E7EB] rounded-2xl p-4 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="space-y-2 py-1">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3.5 w-24 rounded-md" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                </div>
              </div>
              <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <Skeleton className="h-2.5 w-16 rounded mb-1" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-white border-[#E5E7EB] rounded-2xl">
          <p className="text-sm text-[#4B5563] font-medium">
            Tidak ada transaksi ditemukan.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {paginated.map((t) => (
              <Card
                key={t.id}
                onClick={() => setSelectedDetailTx(t)}
                className="bg-white border-[#E5E7EB] rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-brand/40 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                    <span className="font-bib text-xs font-bold text-[#111827] group-hover:text-brand transition-colors">
                      {t.orderNumber}
                    </span>
                    <StatusBadge status={t.status} />
                  </div>

                  <div className="py-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Pemesan:</span>
                      <strong className="text-[#111827] font-semibold truncate max-w-[160px]">
                        {t.userName}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Nomor BIB:</span>
                      <Badge
                        variant="secondary"
                        className="font-bib text-[10px] bg-brand/10 text-brand border-0 px-2 py-0.5"
                      >
                        BIB #{t.bibNumber}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Jumlah Foto:</span>
                      <span className="font-semibold text-[#111827]">
                        {Array.isArray(t.items) ? t.items.length : t.items || 0} foto
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Waktu:</span>
                      <span className="text-gray-600 text-[11px]">
                        {t.createdAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bib uppercase tracking-widest block">
                      Total Bayar
                    </span>
                    <span className="font-bib font-bold text-base text-brand">
                      {formatRupiah(t.total)}
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-1 text-xs font-semibold text-brand group-hover:translate-x-0.5 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailTx(t);
                    }}
                  >
                    Detail
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Shadcn UI Pagination Bar */}
          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 px-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Tampilkan</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 px-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 bg-white focus:outline-none focus:border-brand"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>dari <strong>{filtered.length}</strong> transaksi</span>
              </div>

              <Pagination className="w-auto mx-0">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              isActive={p === currentPage}
                              onClick={() => setCurrentPage(p)}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        </React.Fragment>
                      );
                    })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Shadcn UI AlertDialog Konfirmasi Approve / Tolak */}
      <AlertDialog
        open={Boolean(actionConfirm)}
        onOpenChange={(open) => !open && setActionConfirm(null)}
      >
        <AlertDialogContent className="rounded-2xl bg-white border border-[#E5E7EB]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] font-bold">
              {actionConfirm?.type === "approve"
                ? "Setujui Transaksi Pembayaran?"
                : "Tolak Transaksi Pembayaran?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#4B5563] pt-1">
              {actionConfirm?.type === "approve"
                ? `Apakah Anda yakin ingin menyetujui transaksi ${actionConfirm?.item?.orderNumber} milik ${actionConfirm?.item?.userName}?`
                : `Apakah Anda yakin ingin menolak transaksi ${actionConfirm?.item?.orderNumber} milik ${actionConfirm?.item?.userName}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-[#E5E7EB]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionConfirm) {
                  const targetId = actionConfirm.item.id;
                  const targetStatus =
                    actionConfirm.type === "approve" ? "approved" : "rejected";
                  const targetItem = actionConfirm.item;
                  setActionConfirm(null);
                  updateStatus(targetId, targetStatus, targetItem);
                }
              }}
              className={`rounded-xl text-xs font-bold text-white shadow-md ${
                actionConfirm?.type === "approve"
                  ? "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                  : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
              }`}
            >
              {actionConfirm?.type === "approve"
                ? "Ya, Approve Pembayaran"
                : "Ya, Tolak Pembayaran"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Detail Rincian Transaksi / Pesanan */}
      <AlertDialog
        open={Boolean(selectedDetailTx)}
        onOpenChange={(open) => !open && setSelectedDetailTx(null)}
      >
        <AlertDialogContent className="bg-white rounded-3xl border-[#E5E7EB] w-[92vw] max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col shadow-2xl">
          {/* Modal Header */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#111827]">
                  Rincian Pesanan
                </h3>
                <StatusBadge status={selectedDetailTx?.status} />
              </div>
              <p className="font-bib text-xs text-[#4B5563] mt-0.5">
                {selectedDetailTx?.orderNumber}
              </p>
            </div>
            <Button
              onClick={() => setSelectedDetailTx(null)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
            {/* Informative Grid */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">
                  Nama Pemesan
                </span>
                <strong className="text-[#111827] text-sm">
                  {selectedDetailTx?.userName}
                </strong>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">
                  Nomor BIB Tag
                </span>
                <Badge
                  variant="secondary"
                  className="font-bib text-xs bg-brand/10 text-brand border-0 px-2 py-0.5 mt-0.5"
                >
                  BIB #{selectedDetailTx?.bibNumber}
                </Badge>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">
                  Waktu Transaksi
                </span>
                <span className="text-[#111827] font-semibold">
                  {selectedDetailTx?.createdAt}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">
                  Total Pembayaran
                </span>
                <span className="text-brand font-bib font-bold text-sm">
                  {formatRupiah(selectedDetailTx?.total)}
                </span>
              </div>
            </div>

            {/* Audit Info if Approved/Rejected */}
            {selectedDetailTx?.status !== "pending" &&
              selectedDetailTx?.approvedByName && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs flex items-center justify-between">
                  <span className="text-gray-500 font-medium">
                    {selectedDetailTx?.status === "approved"
                      ? "Disetujui oleh:"
                      : "Ditolak oleh:"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-[#111827]">
                      {selectedDetailTx?.approvedByName}
                    </strong>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-2 py-0.5 font-bold"
                    >
                      {selectedDetailTx?.approvedByRole === "super_admin"
                        ? "Super Admin"
                        : "Event Admin"}
                    </Badge>
                  </div>
                </div>
              )}

            {/* Bukti Pembayaran */}
            {selectedDetailTx?.paymentProofUrl ? (
              <div>
                <h4 className="text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold mb-2.5 flex items-center justify-between">
                  <span>Bukti Pembayaran</span>
                  <span className="text-[10px] text-brand font-normal normal-case">Klik foto untuk perbesar</span>
                </h4>
                <div
                  onClick={() =>
                    setPreviewImage({
                      url: selectedDetailTx.paymentProofUrl,
                      title: "Bukti Pembayaran",
                      subtitle: `Order ${selectedDetailTx.orderNumber} • Pemesan: ${selectedDetailTx.userName}`,
                    })
                  }
                  className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] shadow-xs cursor-pointer hover:border-brand transition-all group relative"
                >
                  <div className="relative max-h-56 overflow-hidden flex items-center justify-center bg-black/5">
                    <img
                      src={selectedDetailTx.paymentProofUrl}
                      alt="Bukti pembayaran"
                      className="w-full max-h-56 object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-brand px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Perbesar Bukti Bayar
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-green-50 border-t border-green-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[11px] font-semibold text-green-700">Bukti pembayaran sudah diupload</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Lihat Full
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5">
                <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[11px] text-amber-700 font-medium">Belum ada bukti pembayaran yang diupload</span>
              </div>
            )}

            {/* Itemized Photo List */}
            <div>
              <h4 className="text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold mb-2.5 flex items-center justify-between">
                <span>
                  Foto Yang Dipesan (
                  {Array.isArray(selectedDetailTx?.items)
                    ? selectedDetailTx.items.length
                    : 0}
                  )
                </span>
                <span className="text-[10px] text-brand font-normal normal-case">Klik foto untuk perbesar</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.isArray(selectedDetailTx?.items) &&
                  selectedDetailTx.items.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() =>
                        item?.watermarkedUrl &&
                        setPreviewImage({
                          url: item.watermarkedUrl,
                          title: item.originalFilename || `Foto #${item.photoId || idx + 1}`,
                          subtitle: `Harga: ${formatRupiah(item.price || 0)}`,
                        })
                      }
                      className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs cursor-pointer hover:border-brand hover:shadow-md transition-all group relative"
                    >
                      <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                        {item?.watermarkedUrl ? (
                          <>
                            <ProtectedPhoto
                              src={item.watermarkedUrl}
                              alt={item.originalFilename || `Foto #${idx + 1}`}
                              className="w-full h-full"
                              imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                              <span className="text-white text-[10px] font-bold bg-brand px-2 py-1 rounded-lg shadow-md flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Perbesar
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-2 text-[11px]">
                        <p
                          className="font-semibold text-[#111827] truncate"
                          title={item.originalFilename}
                        >
                          {item.originalFilename || `Foto #${item.photoId}`}
                        </p>
                        <p className="font-bib text-brand font-bold text-xs mt-0.5">
                          {formatRupiah(item.price || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Modal Footer Actions (Approve / Reject) */}
          {selectedDetailTx?.status === "pending" && (
            <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                onClick={() => {
                  setActionConfirm({
                    type: "reject",
                    item: selectedDetailTx,
                  });
                  setSelectedDetailTx(null);
                }}
                disabled={loadingId === selectedDetailTx?.id}
                variant="outline"
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] sm:text-xs font-bold h-10 rounded-xl px-2 sm:px-4 flex items-center justify-center gap-1 sm:gap-1.5 min-w-0 shadow-xs"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Tolak Pembayaran</span>
              </Button>
              <Button
                onClick={() => {
                  setActionConfirm({
                    type: "approve",
                    item: selectedDetailTx,
                  });
                  setSelectedDetailTx(null);
                }}
                disabled={loadingId === selectedDetailTx?.id}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[11px] sm:text-xs font-bold h-10 rounded-xl shadow-sm px-2 sm:px-4 flex items-center justify-center gap-1 sm:gap-1.5 min-w-0"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Approve Pembayaran</span>
              </Button>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox Preview Modal untuk Rincian Transaksi */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-3xl w-full bg-[#191C21] rounded-3xl overflow-hidden border border-white/10 shadow-2xl text-white flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-brand" />
                    {previewImage.title || "Pratinjau Gambar"}
                  </h3>
                  {previewImage.subtitle && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {previewImage.subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] max-h-[70vh] p-3">
                <ProtectedPhoto
                  src={previewImage.url}
                  alt={previewImage.title || "Preview"}
                  className="w-full h-full max-h-[68vh] flex items-center justify-center"
                  imgClassName="w-full h-full object-contain max-h-[68vh] rounded-xl select-none"
                />
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-[#191C21] flex items-center justify-between gap-3">
                <span className="text-xs text-gray-400">Klik tombol atau latar luar untuk menutup</span>
                <Button
                  onClick={() => setPreviewImage(null)}
                  className="h-10 px-5 rounded-xl bg-brand hover:bg-[#C2410C] text-white text-xs font-bold shadow-md"
                >
                  Tutup Pratinjau
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

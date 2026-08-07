import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Settings,
  Search,
  X,
  MoreHorizontal,
  Eye,
  Check,
  XCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Receipt,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { formatRupiah } from "./adminUtils.js";
import { StatusBadge } from "./StatusBadge";

export default function OverviewTab({
  transactions = [],
  events = [],
  photographers = [],
  selectedEventFilter = "all",
  onEventFilterChange,
  onUpdateStatus,
}) {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  // Table Filters & States
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [photographerFilter, setPhotographerFilter] = useState("all");
  const [loadingId, setLoadingId] = useState(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);

  // Filter photographers based on selectedEventFilter (Cascading Filter)
  const availablePhotographers = useMemo(() => {
    if (!selectedEventFilter || selectedEventFilter === "all") {
      return photographers;
    }
    return photographers.filter(
      (p) => String(p.eventId) === String(selectedEventFilter),
    );
  }, [photographers, selectedEventFilter]);

  // Reset photographer filter if current selection is not available in selected event
  useEffect(() => {
    if (
      photographerFilter !== "all" &&
      !availablePhotographers.some(
        (p) => String(p.id) === String(photographerFilter),
      )
    ) {
      setPhotographerFilter("all");
    }
  }, [selectedEventFilter, availablePhotographers, photographerFilter]);

  // Filter transactions by photographer
  const filteredByPhotographer = useMemo(() => {
    if (photographerFilter === "all") return transactions;
    return transactions.filter(
      (t) =>
        Array.isArray(t.items) &&
        t.items.some(
          (item) => String(item.photographerId) === String(photographerFilter),
        ),
    );
  }, [transactions, photographerFilter]);

  // Summary Metrics
  const pending = filteredByPhotographer.filter((t) => t.status === "pending").length;
  const approved = filteredByPhotographer.filter((t) => t.status === "approved").length;
  const rejected = filteredByPhotographer.filter((t) => t.status === "rejected").length;
  const totalRevenue = filteredByPhotographer
    .filter((t) => t.status === "approved")
    .reduce((s, t) => {
      if (photographerFilter === "all") return s + (t.total || 0);
      const photoSum = (t.items || [])
        .filter(
          (item) => String(item.photographerId) === String(photographerFilter),
        )
        .reduce((acc, item) => acc + Number(item.price || 0), 0);
      return s + photoSum;
    }, 0);

  const stats = [
    {
      label: "Menunggu Verifikasi",
      value: pending,
      sub: "transaksi",
      cls: "bg-amber-50/80 border-amber-200",
      textCls: "text-amber-700",
    },
    {
      label: "Disetujui",
      value: approved,
      sub: "transaksi",
      cls: "bg-green-50/80 border-green-200",
      textCls: "text-green-700",
    },
    {
      label: "Ditolak",
      value: rejected,
      sub: "transaksi",
      cls: "bg-red-50/80 border-red-200",
      textCls: "text-red-600",
    },
    {
      label: "Total Pendapatan",
      value: formatRupiah(totalRevenue),
      sub: "dari order approved",
      cls: "bg-brand/5 border-brand/20",
      textCls: "text-brand",
    },
  ];

  // Format Waktu Helper
  const formatDate = (dateVal) => {
    if (!dateVal) return "-";
    if (typeof dateVal === "string" && dateVal.length > 0 && !dateVal.includes("Invalid")) {
      return dateVal;
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateVal);
    }
  };

  // Update Status Handler
  const handleUpdateStatus = useCallback(
    async (id, newStatus, targetItem) => {
      setLoadingId(id);
      const item = targetItem || selectedDetailTx;
      try {
        const res = await api.updateTransactionStatus(id, newStatus);
        if (res.success) {
          if (onUpdateStatus) onUpdateStatus(id, newStatus);
          if (selectedDetailTx && selectedDetailTx.id === id) {
            setSelectedDetailTx((prev) =>
              prev ? { ...prev, status: newStatus } : null,
            );
          }
          const isApproved = newStatus === "approved";
          setActionAlert({
            type: "success",
            title: isApproved ? "Pembayaran Disetujui!" : "Pembayaran Ditolak!",
            message: `Transaksi ${item?.orderNumber || ""} milik ${item?.userName || "Peserta"} telah berhasil ${isApproved ? "disetujui" : "ditolak"}.`,
          });
          setTimeout(() => setActionAlert(null), 4000);
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
    },
    [selectedDetailTx, onUpdateStatus],
  );

  // Data terfilter berdasarkan Status Dropdown & Global Search & Fotografer
  const filteredData = useMemo(() => {
    return filteredByPhotographer.filter((t) => {
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const q = globalFilter.trim().toLowerCase();
      if (!q) return matchStatus;

      const matchOrder = t.orderNumber && String(t.orderNumber).toLowerCase().includes(q);
      const matchName = t.userName && t.userName.toLowerCase().includes(q);
      const matchBib = t.bibNumber && String(t.bibNumber).toLowerCase().includes(q);

      return matchStatus && (matchOrder || matchName || matchBib);
    });
  }, [filteredByPhotographer, statusFilter, globalFilter]);

  // TanStack Table Column Definitions
  const columns = useMemo(
    () => [
      {
        accessorKey: "orderNumber",
        header: "Nomor Pesanan",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-bold text-[#111827]">
            {row.original.orderNumber || `#ORD-${row.original.id}`}
          </span>
        ),
      },
      {
        accessorKey: "userName",
        header: "Nama Peserta",
        cell: ({ row }) => (
          <div className="font-bold text-xs text-[#111827]">
            {row.original.userName}
          </div>
        ),
      },
      {
        accessorKey: "bibNumber",
        header: "Nomor BIB",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className="font-bib text-xs font-bold text-brand border-brand/20 bg-brand/10 px-2 py-0.5"
          >
            #{row.original.bibNumber}
          </Badge>
        ),
      },
      {
        accessorKey: "itemCount",
        header: "Jumlah Foto",
        cell: ({ row }) => {
          const count = Array.isArray(row.original.items)
            ? row.original.items.length
            : row.original.items || 0;
          return <span className="text-xs text-gray-600 font-medium">{count} foto</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Waktu",
        cell: ({ row }) => (
          <span className="text-xs text-gray-500 font-mono">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "total",
        header: "Total Bayar",
        cell: ({ row }) => (
          <span className="text-xs font-bold text-brand font-bib">
            {formatRupiah(row.original.total)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => {
          const tx = row.original;
          const isLoading = loadingId === tx.id;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-8 w-8 inline-flex items-center justify-center text-gray-500 hover:text-[#111827] hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                title="Menu Aksi"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                ) : (
                  <MoreHorizontal className="w-4 h-4" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 p-1">
                <DropdownMenuItem
                  onClick={() => setSelectedDetailTx(tx)}
                  className="text-xs font-medium text-gray-700 hover:text-brand hover:bg-orange-50 rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2.5"
                >
                  <Eye className="w-3.5 h-3.5 text-brand" />
                  Lihat Detail & Bukti
                </DropdownMenuItem>

                {tx.status !== "approved" && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-100 my-1" />
                    <DropdownMenuItem
                      onClick={() => setActionConfirm({ type: "approved", item: tx })}
                      className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Setujui Pembayaran
                    </DropdownMenuItem>
                  </>
                )}

                {tx.status !== "rejected" && (
                  <DropdownMenuItem
                    onClick={() => setActionConfirm({ type: "rejected", item: tx })}
                    className="text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer flex items-center gap-2 py-2 px-2.5"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    Tolak Pembayaran
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [loadingId, setSelectedDetailTx, setActionConfirm],
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Super Admin: Event Scope Filter */}
      {isSuperAdmin && events.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:px-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand shrink-0" />
            <span className="text-xs font-bold text-[#111827]">
              Filter Event Overview:
            </span>
          </div>
          <Select
            value={String(selectedEventFilter)}
            onValueChange={(val) =>
              onEventFilterChange && onEventFilterChange(val)
            }
          >
            <SelectTrigger className="!h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium w-full sm:w-[210px] shrink-0 shadow-xs">
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
        </div>
      )}

      {/* Action Alert Banner */}
      {actionAlert && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          <Alert
            className={`rounded-2xl p-4 shadow-sm flex items-center justify-between ${
              actionAlert.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {actionAlert.type === "success" ? (
                <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <div>
                <AlertTitle className="text-xs font-bold">
                  {actionAlert.title}
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5 opacity-90">
                  {actionAlert.message}
                </AlertDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setActionAlert(null)}
              className="h-7 w-7 text-gray-500 hover:bg-gray-200/50 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </Alert>
        </motion.div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map(({ label, value, sub, cls, textCls }) => (
          <motion.div
            key={label}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <Card className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm ${cls}`}>
              <p className={`text-base sm:text-2xl font-bold font-bib ${textCls} truncate`}>
                {value}
              </p>
              <p className="text-xs font-bold text-[#111827] mt-0.5 truncate">
                {label}
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#4B5563] mt-0.5 truncate">
                {sub}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Data Table Overview Transaksi Peserta (TanStack Table) ── */}
      <Card className="bg-white border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F3F4F6] pb-3.5">
          <div>
            <h3 className="text-sm font-bold text-[#111827]">
              Daftar Transaksi Peserta ({filteredData.length})
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Kelola dan pantau seluruh status transaksi peserta event.
            </p>
          </div>

          {/* Search Bar & Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Cari pesanan, nama, BIB..."
                className="pl-9 pr-7 h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium shadow-xs"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Status Select */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="!h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium w-[130px] shrink-0 shadow-xs">
                <SelectValue placeholder="Status...">
                  {statusFilter === "all"
                    ? "Semua Status"
                    : statusFilter === "pending"
                      ? "Menunggu"
                      : statusFilter === "approved"
                        ? "Disetujui"
                        : "Ditolak"}
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

            {/* Filter Fotografer Select */}
            {availablePhotographers.length > 0 && (
              <Select
                value={photographerFilter}
                onValueChange={setPhotographerFilter}
              >
                <SelectTrigger className="!h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium w-[160px] shrink-0 shadow-xs">
                  <SelectValue placeholder="Fotografer...">
                    {photographerFilter === "all"
                      ? "Semua Fotografer"
                      : availablePhotographers.find(
                          (p) => String(p.id) === String(photographerFilter),
                        )?.name || "Fotografer..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50">
                  <SelectGroup>
                    <SelectItem value="all">
                      Semua Fotografer ({availablePhotographers.length})
                    </SelectItem>
                    {availablePhotographers.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden space-y-3">
          {table.getRowModel().rows.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-500 font-medium">
              Tidak ada transaksi yang cocok.
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const tx = row.original;
              return (
                <Card
                  key={tx.id}
                  className="bg-[#F9FAFB] border-[#E5E7EB] rounded-xl p-3.5 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#111827]">
                      {tx.orderNumber || `#ORD-${tx.id}`}
                    </span>
                    <StatusBadge status={tx.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#111827]">{tx.userName}</p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        BIB #{tx.bibNumber} · {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand font-bib">
                        {formatRupiah(tx.total)}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {Array.isArray(tx.items) ? tx.items.length : tx.items || 0} foto
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-end gap-2 border-t border-gray-200/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDetailTx(tx)}
                      className="h-8 text-xs font-bold border-gray-300 rounded-lg px-3 bg-white"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-brand" />
                      Detail
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Desktop View: TanStack Data Table */}
        <div className="hidden md:block rounded-xl border border-[#E5E7EB] overflow-hidden">
          <Table>
            <TableHeader className="bg-[#F9FAFB]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-b border-[#E5E7EB]">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-xs font-bib uppercase tracking-wider text-[#4B5563] font-bold h-10 px-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-[#F3F4F6]">
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-xs text-gray-500 font-medium"
                  >
                    Tidak ada data transaksi yang sesuai dengan kriteria.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-[#F9FAFB] transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-3 text-xs">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer Pagination Controls */}
        {table.getPageCount() > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-gray-500 font-medium">
              Menampilkan {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} -{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                filteredData.length,
              )}{" "}
              dari {filteredData.length} transaksi
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="h-8 text-xs font-bold border-gray-300 rounded-lg px-2.5"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-xs font-bold text-gray-700 px-1">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="h-8 text-xs font-bold border-gray-300 rounded-lg px-2.5"
              >
                Selanjutnya
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Detail & Bukti Pembayaran */}
      <Dialog
        open={Boolean(selectedDetailTx)}
        onOpenChange={(open) => !open && setSelectedDetailTx(null)}
      >
        <DialogContent className="max-w-md w-full bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-2xl z-50">
          <DialogHeader className="border-b border-[#F3F4F6] pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-brand" />
              <DialogTitle className="text-sm font-bold text-[#111827]">
                Detail Transaksi Peserta
              </DialogTitle>
            </div>
          </DialogHeader>

          {selectedDetailTx && (
            <div className="space-y-4 pt-2">
              {/* Event Info */}
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Nomor Pesanan:</span>
                  <span className="font-mono font-bold text-[#111827]">
                    {selectedDetailTx.orderNumber || `#ORD-${selectedDetailTx.id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Nama Peserta:</span>
                  <span className="font-bold text-[#111827]">{selectedDetailTx.userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Nomor BIB:</span>
                  <span className="font-bib font-bold text-brand">#{selectedDetailTx.bibNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Waktu Transaksi:</span>
                  <span className="font-mono text-[#111827]">{formatDate(selectedDetailTx.createdAt)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/80 pt-1.5">
                  <span className="text-gray-500 font-bold">Total Pembayaran:</span>
                  <span className="font-bib font-bold text-brand text-sm">
                    {formatRupiah(selectedDetailTx.total)}
                  </span>
                </div>
              </div>

              {/* Bukti Pembayaran Image */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bib uppercase tracking-wider text-gray-500 font-bold">
                  Bukti Transfer Pembayaran:
                </label>
                {selectedDetailTx.paymentProofUrl || selectedDetailTx.proofUrl || selectedDetailTx.payment_proof_url ? (
                  <div className="w-full h-56 rounded-xl border border-gray-200 overflow-hidden bg-black/5 flex items-center justify-center p-1 relative">
                    <img
                      src={selectedDetailTx.paymentProofUrl || selectedDetailTx.proofUrl || selectedDetailTx.payment_proof_url}
                      alt="Bukti Transfer"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="w-full py-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 font-medium">
                    Belum ada bukti pembayaran diunggah.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F3F4F6]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDetailTx(null)}
                  className="text-xs font-bold border-gray-300 rounded-xl h-10 px-4 text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </Button>

                <div className="flex items-center gap-2">
                  {selectedDetailTx.status !== "rejected" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setActionConfirm({
                          type: "rejected",
                          item: selectedDetailTx,
                        })
                      }
                      disabled={loadingId === selectedDetailTx.id}
                      className="text-xs font-bold border-red-200 text-red-600 hover:bg-red-50 rounded-xl h-10 px-4"
                    >
                      Tolak
                    </Button>
                  )}
                  {selectedDetailTx.status !== "approved" && (
                    <Button
                      type="button"
                      onClick={() =>
                        setActionConfirm({
                          type: "approved",
                          item: selectedDetailTx,
                        })
                      }
                      disabled={loadingId === selectedDetailTx.id}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 shadow-md shadow-emerald-600/20"
                    >
                      {loadingId === selectedDetailTx.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      )}
                      Setujui
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shadcn UI AlertDialog Konfirmasi Setujui / Tolak */}
      <AlertDialog
        open={Boolean(actionConfirm)}
        onOpenChange={(open) => !open && setActionConfirm(null)}
      >
        <AlertDialogContent className="rounded-2xl bg-white border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] font-bold text-base">
              {actionConfirm?.type === "approved"
                ? "Setujui Transaksi Pembayaran?"
                : "Tolak Transaksi Pembayaran?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#4B5563] pt-1 leading-relaxed">
              {actionConfirm?.type === "approved"
                ? `Apakah Anda yakin ingin menyetujui transaksi ${actionConfirm?.item?.orderNumber || ""} milik ${actionConfirm?.item?.userName || "Peserta"}?`
                : `Apakah Anda yakin ingin menolak transaksi ${actionConfirm?.item?.orderNumber || ""} milik ${actionConfirm?.item?.userName || "Peserta"}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-3 flex flex-row items-center justify-end">
            <AlertDialogCancel
              onClick={() => setActionConfirm(null)}
              className="rounded-xl text-xs font-bold border-[#E5E7EB] h-10 px-4 mt-0"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionConfirm) {
                  handleUpdateStatus(
                    actionConfirm.item.id,
                    actionConfirm.type,
                    actionConfirm.item,
                  );
                  setActionConfirm(null);
                }
              }}
              className={`rounded-xl text-xs font-bold h-10 px-4 ${
                actionConfirm?.type === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
              }`}
            >
              {actionConfirm?.type === "approved" ? "Ya, Setujui" : "Ya, Tolak"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

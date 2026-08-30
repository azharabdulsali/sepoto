import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Loader2,
  Camera,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import ProtectedPhoto from "../ProtectedPhoto";
import { api } from "../../services/api";
import { formatRupiah, formatRupiahInput, parseRupiahInput } from "./adminUtils.js";
import PhotoPreviewModal from "./PhotoPreviewModal";

export default function AdminPhotosTab({
  events = [],
  photographers = [],
  selectedEventFilter = "all",
  onEventFilterChange,
}) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [photographerFilter, setPhotographerFilter] = useState("all");
  const [previewPhoto, setPreviewPhoto] = useState(null);

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

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkBib, setBulkBib] = useState("");
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // Edit Single Photo Modal
  const [editPhoto, setEditPhoto] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editBib, setEditBib] = useState("");
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  // Delete Confirm
  const [deletePhotoTarget, setDeletePhotoTarget] = useState(null);
  const [deleteBulkConfirm, setDeleteBulkConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action Feedback Alert (Super Admin / Admin)
  const [actionAlert, setActionAlert] = useState(null);

  // Pagination State (Super Admin)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAdminPhotos(selectedEventFilter, currentPage, pageSize, photographerFilter);
      if (res.success && res.photos) {
        setPhotos(res.photos);
        setTotalPhotos(res.total || res.photos.length);
        setTotalPages(res.totalPages || 1);
      } else {
        setPhotos([]);
        setTotalPhotos(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Fetch Admin Photos Error:", err);
      setPhotos([]);
      setTotalPhotos(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [selectedEventFilter, currentPage, pageSize, photographerFilter]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const filtered = useMemo(() => {
    return photos.filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;

      const matchSearch =
        (p.bibTags && p.bibTags.toLowerCase().includes(q)) ||
        (p.originalFilename && p.originalFilename.toLowerCase().includes(q)) ||
        (p.photographerName && p.photographerName.toLowerCase().includes(q));

      return matchSearch;
    });
  }, [photos, search]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    if (!editPhoto) return;
    setIsSavingSingle(true);
    try {
      const finalPrice = editPrice !== "" ? Number(editPrice) : 0;
      const res = await api.updatePhotoAdmin(editPhoto.id, {
        price: finalPrice,
        bibTags: editBib,
      });
      if (res.success) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === editPhoto.id
              ? {
                  ...p,
                  price: finalPrice,
                  bibTags: editBib,
                  updatedByName: res.photo?.updatedByName || "Super Admin",
                  updatedByRole: "super_admin",
                }
              : p,
          ),
        );
        setActionAlert({
          type: "success",
          title: "Berhasil Disimpan!",
          message: `Detail foto #${editPhoto.id} tersimpan di database.`,
        });
        setEditPhoto(null);
        fetchPhotos();
      } else {
        setActionAlert({
          type: "error",
          title: "Gagal Menyimpan",
          message: res.message || "Terjadi kesalahan saat menyimpan ke database.",
        });
      }
    } catch (err) {
      console.error("Save single error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Menyimpan",
        message: "Terjadi kesalahan koneksi saat menyimpan ke database.",
      });
    } finally {
      setIsSavingSingle(false);
    }
  };

  const handleSaveBulk = async (e) => {
    e.preventDefault();
    if (selectedIds.size === 0) return;
    setIsSavingBulk(true);
    const count = selectedIds.size;
    try {
      const res = await api.bulkUpdatePhotosAdmin({
        photoIds: Array.from(selectedIds),
        price: bulkPrice,
        bibTags: bulkBib,
      });
      if (res.success) {
        setIsBulkOpen(false);
        setBulkPrice("");
        setBulkBib("");
        setSelectedIds(new Set());
        setActionAlert({
          type: "success",
          title: "Tersimpan ke Database!",
          message: `Berhasil memperbarui ${count} foto di database.`,
        });
        fetchPhotos();
      } else {
        setActionAlert({
          type: "error",
          title: "Gagal Menyimpan",
          message: res.message || "Terjadi kesalahan saat memperbarui foto secara massal.",
        });
      }
    } catch (err) {
      console.error("Save bulk error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Menyimpan",
        message: "Terjadi kesalahan koneksi saat menyimpan secara massal.",
      });
    } finally {
      setIsSavingBulk(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePhotoTarget) return;
    setIsDeleting(true);
    const targetId = deletePhotoTarget.id;
    try {
      const res = await api.deletePhotoAdmin(targetId);
      if (res.success) {
        setPhotos((prev) => prev.filter((p) => p.id !== targetId));
        setActionAlert({
          type: "success",
          title: "Foto Berhasil Dihapus!",
          message: `Foto #${targetId} telah berhasil dihapus dari galeri & server cloud.`,
        });
        setDeletePhotoTarget(null);
      } else {
        setActionAlert({
          type: "error",
          title: "Gagal Menghapus Foto",
          message: res.message || "Terjadi kesalahan server saat menghapus foto.",
        });
      }
    } catch (err) {
      console.error("Delete photo error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Menghapus Foto",
        message: "Terjadi kesalahan koneksi server saat menghapus foto.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    try {
      for (const id of idsToDelete) {
        try {
          await api.deletePhotoAdmin(id);
        } catch (err) {
          console.error("Failed to delete photo admin", id, err);
        }
      }
      setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      setDeleteBulkConfirm(false);
      setActionAlert({
        type: "success",
        title: "Foto Berhasil Dihapus!",
        message: `${idsToDelete.length} foto telah berhasil dihapus secara permanen.`,
      });
    } catch (err) {
      console.error("Bulk delete admin error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Menghapus Foto",
        message: "Terjadi kesalahan server saat menghapus foto terpilih.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const allChecked =
    filtered.length > 0 && selectedIds.size === filtered.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < filtered.length;

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
      {/* Top Bar: Search, Event Select Filter & Checkbox All */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <InputGroup className="h-11 border-[#E5E7EB] rounded-xl bg-white flex-1">
            <InputGroupAddon align="inline-start">
              <Search className="w-4 h-4 text-[#4B5563]" />
            </InputGroupAddon>
            <InputGroupInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari foto berdasarkan Nomor Unik, fotografer, atau berkas..."
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

          {/* Event Filter Select Dropdown */}
          {events.length > 0 && (
            <Select
              value={String(selectedEventFilter)}
              onValueChange={(val) =>
                onEventFilterChange && onEventFilterChange(val)
              }
            >
              <SelectTrigger className="!h-11 w-44 sm:w-48 border border-[#E5E7EB] rounded-xl px-3.5 text-xs bg-white font-medium text-[#111827] shadow-xs flex items-center justify-between shrink-0">
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

          {/* Photographer Filter Select Dropdown */}
          {availablePhotographers.length > 0 && (
            <Select
              value={photographerFilter}
              onValueChange={setPhotographerFilter}
            >
              <SelectTrigger className="!h-11 w-44 sm:w-48 border border-[#E5E7EB] rounded-xl px-3.5 text-xs bg-white font-medium text-[#111827] shadow-xs flex items-center justify-between shrink-0">
                <SelectValue placeholder="Fotografer...">
                  {photographerFilter === "all"
                    ? "Semua Fotografer"
                    : availablePhotographers.find(
                        (p) => String(p.id) === String(photographerFilter)
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

        {/* Checkbox Select All */}
        <div className="flex items-center gap-2.5 px-4 h-11 bg-white border border-[#E5E7EB] rounded-xl shadow-xs shrink-0">
          <Checkbox
            id="select-all-photos-checkbox"
            checked={allChecked}
            indeterminate={isIndeterminate}
            onCheckedChange={toggleSelectAll}
          />
          <label
            htmlFor="select-all-photos-checkbox"
            className="text-xs font-bold text-[#111827] cursor-pointer select-none"
          >
            {selectedIds.size > 0
              ? `Pilih Semua (${selectedIds.size}/${filtered.length})`
              : `Pilih Semua (${filtered.length})`}
          </label>
        </div>
      </div>

      {/* Floating Action Bar untuk Edit Massal */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-brand/5 border border-brand/20 rounded-2xl shadow-xs"
          >
            <div className="flex items-center justify-between sm:justify-start gap-2.5">
              <Badge className="bg-brand text-white font-bold text-xs px-3 py-1 rounded-full shrink-0">
                {selectedIds.size} Foto Terpilih
              </Badge>
              <span className="text-xs text-gray-600 hidden sm:inline font-medium">
                Siap untuk diubah harga atau label secara bersamaan
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedIds(new Set())}
                className="flex-1 sm:flex-initial h-9 text-xs font-bold border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl whitespace-nowrap"
              >
                Batalkan Pilihan
              </Button>
              <Button
                size="sm"
                onClick={() => setIsBulkOpen(true)}
                className="flex-1 sm:flex-initial h-9 text-xs font-bold bg-brand hover:bg-[#C2410C] text-white rounded-xl gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit ({selectedIds.size})</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteBulkConfirm(true)}
                className="flex-1 sm:flex-initial h-9 text-xs font-bold rounded-xl px-3 gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selectedIds.size})</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card
              key={i}
              className="overflow-hidden bg-white border border-[#E5E7EB] rounded-2xl p-0 shadow-xs"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-4 w-14 rounded-full" />
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-6 rounded-lg" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-white border-[#E5E7EB] rounded-2xl">
          <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-[#111827]">
            Tidak Ada Foto Ditemukan
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Belum ada foto yang diunggah atau sesuai kriteria pencarian.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((photo) => {
            const isSelected = selectedIds.has(photo.id);
            const isUpdated = Boolean(photo.updatedByName);
            return (
              <Card
                key={photo.id}
                className={`group relative overflow-hidden bg-white border rounded-2xl transition-all shadow-xs hover:shadow-md ${
                  isSelected
                    ? "border-brand ring-2 ring-brand/20"
                    : "border-[#E5E7EB]"
                }`}
              >
                {/* Shadcn UI Select Checkbox */}
                <div
                  className="absolute top-2.5 left-2.5 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    id={`select-photo-${photo.id}`}
                    checked={isSelected}
                    onCheckedChange={() => toggleSelectOne(photo.id)}
                    className="bg-white/90 shadow-md backdrop-blur-xs border-white/80 data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                  />
                </div>

                {/* Photo Image Preview */}
                <div
                  onClick={() => setPreviewPhoto(photo)}
                  className="aspect-[4/5] overflow-hidden bg-[#F3F4F6] cursor-pointer group/img relative"
                >
                  <ProtectedPhoto
                    src={photo.watermarkedUrl}
                    alt={photo.originalFilename}
                    loading="lazy"
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Price Tag Overlay */}
                  <div className="absolute bottom-2 right-2 z-10">
                    <Badge className="bg-black/70 backdrop-blur-md text-white font-bib text-[11px] font-bold border-0 px-2 py-0.5">
                      {formatRupiah(photo.price || 0)}
                    </Badge>
                  </div>
                </div>

                {/* Photo Details & Audit Trail */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span
                      className="font-semibold text-[#111827] truncate"
                      title={photo.originalFilename}
                    >
                      {photo.originalFilename}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 flex-wrap">
                    {photo.bibTags ? (
                      <Badge
                        variant="outline"
                        className="font-bib text-[10px] bg-brand/10 text-brand border-brand/20 px-1.5 py-0"
                      >
                        Label: {photo.bibTags}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="font-bib text-[10px] bg-gray-100 text-gray-500 border-gray-200 px-1.5 py-0"
                      >
                        Tanpa Label
                      </Badge>
                    )}
                    <span className="text-[10px] text-gray-500 truncate">
                      by {photo.photographerName}
                    </span>
                  </div>

                  {/* Audit Trail Badge (Siapa yang set harga / Label) */}
                  <div className="pt-1 border-t border-gray-100 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400 truncate">
                      {isUpdated ? (
                        <span
                          title={`Diset oleh ${photo.updatedByName} (${photo.updatedByRole})`}
                        >
                          Diset:{" "}
                          <strong className="text-gray-700">
                            {photo.updatedByName}
                          </strong>{" "}
                          (
                          {photo.updatedByRole === "super_admin"
                            ? "Super Admin"
                            : "Fotografer"}
                          )
                        </span>
                      ) : (
                        <span className="italic text-gray-400">
                          Default sistem
                        </span>
                      )}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditPhoto(photo);
                          setEditPrice(photo.price || "");
                          setEditBib(photo.bibTags || "");
                        }}
                        className="p-1 text-gray-500 hover:text-brand transition-colors"
                        title="Edit Harga & Label"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePhotoTarget(photo)}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Shadcn UI Pagination Bar (Super Admin) */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E5E7EB]">
          <p className="text-xs text-gray-500 font-medium">
            Menampilkan Halaman <strong className="text-gray-900">{currentPage}</strong> dari{" "}
            <strong className="text-gray-900">{totalPages}</strong> (Total {totalPhotos} Foto)
          </p>
          <Pagination className="justify-end w-auto m-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Modal Edit Single Photo */}
      <AlertDialog
        open={Boolean(editPhoto)}
        onOpenChange={(open) => !open && setEditPhoto(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl border-[#E5E7EB] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Edit Harga & Label Foto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Perbarui harga jual dan nomor unik/label untuk berkas{" "}
              <strong>{editPhoto?.originalFilename}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSaveSingle} className="space-y-3.5 my-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Harga Foto (Rp)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(editPrice)}
                onChange={(e) => setEditPrice(parseRupiahInput(e.target.value))}
                placeholder="Contoh: 50.000"
                className="h-10 text-xs border-[#E5E7EB] rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nomor Unik Tag
              </label>
              <Input
                type="text"
                value={editBib}
                onChange={(e) => setEditBib(e.target.value)}
                placeholder="Contoh: 101, A101, atau A-101"
                className="h-10 text-xs font-bib border-[#E5E7EB] rounded-xl"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Gunakan koma jika terdapat lebih dari 1 peserta (misal: 101,
                102).
              </p>
            </div>

            <AlertDialogFooter className="pt-2 gap-2">
              <AlertDialogCancel
                type="button"
                disabled={isSavingSingle}
                className="rounded-xl text-xs h-10"
              >
                Batal
              </AlertDialogCancel>
              <Button
                type="submit"
                disabled={isSavingSingle}
                className="bg-brand hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold h-10"
              >
                {isSavingSingle ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Edit Bulk Photos */}
      <AlertDialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <AlertDialogContent className="bg-[#FFFFFF] rounded-2xl border-[#E5E7EB] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Edit ({selectedIds.size} Foto)
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Atur harga atau label sekaligus untuk {selectedIds.size} foto
              yang dipilih.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSaveBulk} className="space-y-3.5 my-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Set Harga Baru (Rp) (Opsional)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={formatRupiahInput(bulkPrice)}
                onChange={(e) => setBulkPrice(parseRupiahInput(e.target.value))}
                placeholder="Biarkan kosong jika tidak diubah (contoh: 50.000)"
                className="h-10 text-xs border-[#E5E7EB] rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Set Label Baru (Opsional)
              </label>
              <Input
                type="text"
                value={bulkBib}
                onChange={(e) => setBulkBib(e.target.value)}
                placeholder="Contoh: 101 atau A101 (kosongkan jika tidak diubah)"
                className="h-10 text-xs font-bib border-[#E5E7EB] rounded-xl"
              />
            </div>

            <AlertDialogFooter className="pt-2 gap-2">
              <AlertDialogCancel
                type="button"
                disabled={isSavingBulk}
                className="rounded-xl text-xs h-10"
              >
                Batal
              </AlertDialogCancel>
              <Button
                type="submit"
                disabled={isSavingBulk}
                className="bg-brand hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold h-10"
              >
                {isSavingBulk ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Terapkan Ke Semua"
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Hapus Confirm */}
      <AlertDialog
        open={Boolean(deletePhotoTarget)}
        onOpenChange={(open) => !open && setDeletePhotoTarget(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl border-[#E5E7EB] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Konfirmasi Hapus Foto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Apakah Anda yakin ingin menghapus foto{" "}
              <strong>{deletePhotoTarget?.originalFilename}</strong> secara
              permanen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2 gap-2">
            <AlertDialogCancel
              type="button"
              disabled={isDeleting}
              className="rounded-xl text-xs h-10"
            >
              Batal
            </AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-10"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Hapus Massal Confirm (Super Admin) */}
      <AlertDialog open={deleteBulkConfirm} onOpenChange={setDeleteBulkConfirm}>
        <AlertDialogContent className="bg-white rounded-2xl border-[#E5E7EB] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Hapus ({selectedIds.size} Foto)?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Apakah Anda yakin ingin menghapus <strong>{selectedIds.size} foto</strong> yang dipilih secara permanen dari database? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2 gap-2">
            <AlertDialogCancel
              type="button"
              disabled={isDeleting}
              className="rounded-xl text-xs h-10"
            >
              Batal
            </AlertDialogCancel>
            <Button
              onClick={handleDeleteBulk}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold h-10"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {isDeleting ? "Menghapus..." : "Ya, Hapus Terpilih"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lightbox Modal Preview Foto untuk Super Admin */}
      <AnimatePresence>
        {previewPhoto && (
          <PhotoPreviewModal
            photo={previewPhoto}
            onClose={() => setPreviewPhoto(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

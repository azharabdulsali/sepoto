import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Trash2,
  X,
  Search,
  Loader2,
  CheckCircle2,
  Eye,
  Pencil,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ProtectedPhoto from "../ProtectedPhoto";
import { api } from "../../services/api";
import {
  formatRupiah,
  formatRupiahInput,
  parseRupiahInput,
} from "./photographerUtils";
import PhotoPreviewModal from "./PhotoPreviewModal";

export default function MyPhotosTab({ onPhotosChange }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [bulkEditPrice, setBulkEditPrice] = useState("");
  const [bulkEditBib, setBulkEditBib] = useState("");
  const [search, setSearch] = useState("");

  // Shadcn UI Alert, AlertDialog & Preview State
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [actionAlert, setActionAlert] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // { type: 'single' | 'bulk', photoId?: number, count: number }
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  // Single Photo Edit Modal State
  const [editPhoto, setEditPhoto] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editBib, setEditBib] = useState("");
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getMyPhotos();
      if (res.success && res.photos) {
        setPhotos(res.photos);
        onPhotosChange?.(res.photos.length);
      } else {
        setPhotos([]);
        onPhotosChange?.(0);
      }
    } catch (err) {
      console.error("Fetch my photos error:", err);
      setPhotos([]);
      onPhotosChange?.(0);
    } finally {
      setLoading(false);
    }
  }, [onPhotosChange]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const filtered = photos.filter(
    (p) =>
      !search || p.bibTags?.includes(search) || String(p.id).includes(search),
  );

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  // Simpan detail harga & BIB massal ke Database PostgreSQL via Modal Dialog
  const handleSaveBulk = async (e) => {
    e.preventDefault();
    if (selected.size === 0) return;
    if (!bulkEditPrice && !bulkEditBib.trim()) {
      setActionAlert({
        type: "error",
        title: "Tidak Ada Perubahan",
        message: "Masukkan set harga baru atau BIB tag baru terlebih dahulu.",
      });
      return;
    }

    setIsSavingBulk(true);
    try {
      const newPrice = bulkEditPrice !== "" ? Number(bulkEditPrice) : undefined;
      const newBib = bulkEditBib.trim() !== "" ? bulkEditBib.trim() : undefined;

      let successCount = 0;
      for (const id of Array.from(selected)) {
        const updatePayload = {};
        if (newPrice !== undefined) updatePayload.price = newPrice;
        if (newBib !== undefined) updatePayload.bibTags = newBib;

        try {
          const res = await api.updatePhoto(id, updatePayload);
          if (res.success) successCount++;
        } catch (err) {
          console.error("Failed to update photo", id, err);
        }
      }

      setPhotos((prev) =>
        prev.map((p) => {
          if (!selected.has(p.id)) return p;
          return {
            ...p,
            ...(newPrice !== undefined ? { price: newPrice } : {}),
            ...(newBib !== undefined ? { bibTags: newBib } : {}),
          };
        }),
      );

      const count = selected.size;
      setIsBulkOpen(false);
      setBulkEditPrice("");
      setBulkEditBib("");
      setSelected(new Set());

      setActionAlert({
        type: "success",
        title: "Tersimpan ke Database!",
        message: `Berhasil memperbarui ${count} foto di database.`,
      });
    } catch (err) {
      console.error("Save bulk error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Menyimpan",
        message: "Terjadi kesalahan saat memperbarui foto secara massal.",
      });
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Simpan detail foto individual ke Database PostgreSQL via Modal Dialog
  const handleSaveSinglePhoto = async (e) => {
    e.preventDefault();
    if (!editPhoto) return;

    setIsSavingSingle(true);
    try {
      const finalPrice = editPrice !== "" ? Number(editPrice) : 0;
      const res = await api.updatePhoto(editPhoto.id, {
        price: finalPrice,
        bibTags: editBib,
      });

      if (res.success) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === editPhoto.id
              ? { ...p, price: finalPrice, bibTags: editBib }
              : p,
          ),
        );
        setEditPhoto(null);
        setActionAlert({
          type: "success",
          title: "Berhasil Disimpan!",
          message: `Detail foto #${editPhoto.id} tersimpan di database.`,
        });
      } else {
        setActionAlert({
          type: "error",
          title: "Gagal Menyimpan",
          message: res.message || "Terjadi kesalahan saat menyimpan ke database.",
        });
      }
    } catch (err) {
      console.error("Save photo error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Menyimpan",
        message: "Terjadi kesalahan koneksi saat menyimpan ke database.",
      });
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Memicu Modal Konfirmasi Hapus Single
  const requestDeleteSingle = (photoId) => {
    setDeleteConfirmModal({
      type: "single",
      photoId,
      count: 1,
    });
  };

  // Memicu Modal Konfirmasi Hapus Bulk (Terpilih)
  const requestDeleteBulk = () => {
    if (selected.size === 0) return;
    setDeleteConfirmModal({
      type: "bulk",
      photoId: null,
      count: selected.size,
    });
  };

  // Eksekusi Penghapusan Foto setelah Konfirmasi di AlertDialog
  const confirmDelete = async () => {
    if (!deleteConfirmModal) return;
    setIsDeleting(true);
    const count = deleteConfirmModal.count;

    try {
      if (deleteConfirmModal.type === "single" && deleteConfirmModal.photoId) {
        const id = deleteConfirmModal.photoId;
        await api.deletePhoto(id);
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else if (deleteConfirmModal.type === "bulk") {
        const ids = Array.from(selected);
        for (const id of ids) {
          try {
            await api.deletePhoto(id);
          } catch (err) {
            console.error("Failed to delete photo", id, err);
          }
        }
        setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
        setSelected(new Set());
      }

      setDeleteConfirmModal(null);
      setActionAlert({
        type: "success",
        title: "Foto Berhasil Dihapus!",
        message: `${count} foto telah berhasil dihapus secara permanen dari galeri & server.`,
      });
      onPhotosChange?.(photos.length - count);
    } catch (err) {
      console.error("Delete photo error:", err);
      setActionAlert({
        type: "error",
        title: "Gagal Menghapus Foto",
        message: "Terjadi kesalahan server saat menghapus foto.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmModal(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Shadcn UI Alert Feedback Notifikasi */}
      {actionAlert && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className={`rounded-2xl p-4 shadow-sm flex items-center justify-between ${
            actionAlert.type === "success" ? "bg-green-50 border border-green-200 text-green-900" : "bg-red-50 border border-red-200 text-red-900"
          }`}>
            <div className="flex items-center gap-3">
              {actionAlert.type === "success"
                ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                : <X className="w-5 h-5 text-red-600 shrink-0" />
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

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <InputGroup className="h-11 border-[#E5E7EB] rounded-xl bg-white flex-1">
          <InputGroupAddon align="inline-start">
            <Search className="w-4 h-4 text-[#4B5563]" />
          </InputGroupAddon>
          <InputGroupInput
            id="manage-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan BIB atau ID foto..."
            className="text-xs sm:text-sm font-bib text-[#111827]"
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton onClick={() => setSearch("")} title="Bersihkan pencarian">
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <p className="text-sm font-medium text-[#4B5563] self-center shrink-0">
          {photos.length} foto · <span className="font-bold text-[#111827]">{selected.size} dipilih</span>
        </p>
      </div>

      {/* Sticky Floating Multi-select Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="sticky top-16 z-30 bg-[#191C21]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xl text-white my-2"
          >
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <Badge className="bg-brand text-white font-bold font-bib text-xs px-2.5 py-0.5 shrink-0">
                {selected.size} Foto Terpilih
              </Badge>
              <span className="text-xs text-gray-300 hidden md:inline">
                Siap untuk diubah harga atau tag BIB secara bersamaan
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(new Set())}
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
                <span>Edit ({selected.size})</span>
              </Button>
              <Button
                id="delete-selected-btn"
                onClick={requestDeleteBulk}
                variant="destructive"
                size="sm"
                className="flex-1 sm:flex-initial h-9 text-xs font-bold rounded-xl px-3 gap-1.5 shadow-sm whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus ({selected.size})</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(() => {
        const allChecked = filtered.length > 0 && selected.size === filtered.length;
        const isIndeterminate = selected.size > 0 && selected.size < filtered.length;
        return (
          <div className="flex items-center gap-2.5 px-4 h-11 bg-white border border-[#E5E7EB] rounded-xl shadow-xs w-fit">
            <Checkbox
              id="photographer-select-all"
              checked={allChecked}
              indeterminate={isIndeterminate}
              onCheckedChange={toggleAll}
            />
            <label
              htmlFor="photographer-select-all"
              className="text-xs font-bold text-[#111827] cursor-pointer select-none"
            >
              {selected.size > 0
                ? `Pilih Semua (${selected.size}/${filtered.length})`
                : `Pilih Semua (${filtered.length})`}
            </label>
          </div>
        );
      })()}

      {/* Grid Foto */}
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
          <ImageIcon className="w-12 h-12 text-[#D1D5DB] mx-auto mb-3" />
          <p className="font-bold text-[#111827]">Belum Ada Foto Unggahan</p>
          <p className="text-xs text-[#4B5563] mt-1">
            Gunakan tab <strong>Upload Foto</strong> untuk menambahkan foto hasil jepretan Anda.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map((photo) => {
            const isSelected = selected.has(photo.id);
            const imgUrl = photo.watermarkedUrl || photo.watermarked_url || "";

            return (
              <motion.div key={photo.id} whileHover={{ y: -2 }}>
                <Card
                  className={`group relative overflow-hidden bg-white border rounded-2xl transition-all shadow-xs hover:shadow-md ${
                    isSelected ? "border-brand ring-2 ring-brand/20" : "border-[#E5E7EB]"
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
                      onCheckedChange={() => toggleSelect(photo.id)}
                      className="bg-white/90 shadow-md backdrop-blur-xs border-white/80 data-checked:bg-brand data-checked:border-brand"
                    />
                  </div>

                  {/* Image & Price Overlay */}
                  <div
                    onClick={() => setPreviewPhoto(photo)}
                    className="aspect-[4/5] overflow-hidden bg-[#F3F4F6] cursor-pointer group/img relative"
                  >
                    <ProtectedPhoto
                      src={imgUrl}
                      alt={`Foto ${photo.id}`}
                      loading="lazy"
                      className="w-full h-full"
                      imgClassName="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Price Tag Overlay (Rp 10.000 or Rp 0) */}
                    <div className="absolute bottom-2 right-2 z-10">
                      <Badge className="bg-black/70 backdrop-blur-md text-white font-bib text-[11px] font-bold border-0 px-2 py-0.5">
                        {formatRupiah(photo.price || 0)}
                      </Badge>
                    </div>
                  </div>

                  {/* Details, BIB Tag, and Action Buttons (Pencil & Trash2) */}
                  <div className="p-3 space-y-1.5 bg-white">
                    <div className="flex items-center justify-between gap-1 text-xs">
                      <span
                        className="font-semibold text-[#111827] truncate"
                        title={photo.originalFilename || photo.original_filename || `Foto #${photo.id}`}
                      >
                        {photo.originalFilename || photo.original_filename || `Foto #${photo.id}`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-0.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {photo.bibTags ? (
                          <Badge
                            variant="outline"
                            className="font-bib text-[10px] bg-brand/10 text-brand border-brand/20 px-1.5 py-0"
                          >
                            BIB #{photo.bibTags}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="font-bib text-[10px] bg-gray-100 text-gray-500 border-gray-200 px-1.5 py-0"
                          >
                            Tanpa BIB
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          id={`edit-single-photo-${photo.id}`}
                          onClick={() => {
                            setEditPhoto(photo);
                            setEditPrice(photo.price || "");
                            setEditBib(photo.bibTags || "");
                          }}
                          className="p-1.5 text-gray-500 hover:text-brand hover:bg-orange-50 rounded-lg transition-colors"
                          title="Edit Harga & BIB"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          id={`delete-single-photo-${photo.id}`}
                          onClick={() => requestDeleteSingle(photo.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus foto ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Shadcn UI AlertDialog Konfirmasi Hapus Foto */}
      <AlertDialog open={!!deleteConfirmModal} onOpenChange={() => setDeleteConfirmModal(null)}>
        <AlertDialogContent className="rounded-2xl bg-white border border-[#E5E7EB]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#111827] font-bold flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              Konfirmasi Hapus Foto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#4B5563] pt-1">
              Apakah Anda yakin ingin menghapus <strong>{deleteConfirmModal?.count} foto</strong> ini secara permanen dari galeri dan server cloud?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-xs font-bold border-[#E5E7EB]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {isDeleting ? "Menghapus..." : "Ya, Hapus Foto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Edit Bulk Photos (Fotografer) */}
      <AlertDialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <AlertDialogContent className="bg-white rounded-2xl border-[#E5E7EB] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Edit ({selected.size} Foto)
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Atur harga atau tag BIB sekaligus untuk {selected.size} foto yang dipilih.
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
                value={formatRupiahInput(bulkEditPrice)}
                onChange={(e) => setBulkEditPrice(parseRupiahInput(e.target.value))}
                placeholder="Biarkan kosong jika tidak diubah (contoh: 50.000)"
                className="h-10 text-xs border-[#E5E7EB] rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Set BIB Tag Baru (Opsional)
              </label>
              <Input
                type="text"
                value={bulkEditBib}
                onChange={(e) => setBulkEditBib(e.target.value)}
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

      {/* Modal Edit Single Photo (Fotografer) */}
      <AlertDialog open={Boolean(editPhoto)} onOpenChange={(open) => !open && setEditPhoto(null)}>
        <AlertDialogContent className="bg-white rounded-2xl border-[#E5E7EB] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-[#111827]">
              Edit Detail Foto
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-gray-500">
              Perbarui harga jual dan nomor BIB untuk berkas <strong>{editPhoto?.originalFilename || editPhoto?.original_filename || `Foto #${editPhoto?.id}`}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <form onSubmit={handleSaveSinglePhoto} className="space-y-3.5 my-2">
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
                Nomor BIB Tag
              </label>
              <Input
                type="text"
                value={editBib}
                onChange={(e) => setEditBib(e.target.value)}
                placeholder="Contoh: 101, A101, atau A-101"
                className="h-10 text-xs font-bib border-[#E5E7EB] rounded-xl"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Gunakan koma jika terdapat lebih dari 1 peserta (misal: 101, 102).
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

      {/* Lightbox Modal Preview Foto untuk Fotografer */}
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

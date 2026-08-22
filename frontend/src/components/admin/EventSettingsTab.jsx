import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Upload,
  Check,
  X,
  Loader2,
  QrCode,
  UserPlus,
  MapPin,
  Image as ImageIcon,
  Info,
  Phone,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

export default function EventSettingsTab({ events = [], onRefreshEvents }) {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || 1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newBannerUrl, setNewBannerUrl] = useState("");
  const [newQr, setNewQr] = useState("");
  const [newWhatsappNumber, setNewWhatsappNumber] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [form, setForm] = useState({
    title: "",
    date: "",
    location: "",
    bannerUrl: "",
    qrCodeUrl: "",
    whatsappNumber: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const qrInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // State untuk fitur hapus semua foto event
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteEventTitle, setDeleteEventTitle] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const fetchEventData = useCallback(async (evId) => {
    try {
      const res = await api.getAllEvents();
      if (res.success && res.events) {
        const ev =
          res.events.find((e) => Number(e.id) === Number(evId)) ||
          res.events[0];
        if (ev) {
          const formattedDate = ev.eventDate
            ? new Date(ev.eventDate).toISOString().split("T")[0]
            : "";
          setSelectedEventId(ev.id);
          setForm({
            title: ev.title || "",
            date: formattedDate,
            location: ev.location || "",
            bannerUrl: ev.bannerUrl || ev.logoUrl || "",
            qrCodeUrl: ev.qrCodeUrl || "",
            whatsappNumber: ev.whatsappNumber || "08214689756",
            isActive: ev.isActive ?? true,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load event data:", err);
    }
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      fetchEventData(selectedEventId);
    }
  }, [events, selectedEventId, fetchEventData]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!newTitle.trim() || !newDate) {
      setCreateError("Nama Event dan Tanggal Event wajib diisi.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await api.createEvent({
        title: newTitle.trim(),
        eventDate: newDate,
        location: newLocation.trim(),
        bannerUrl: newBannerUrl.trim(),
        qrCodeUrl: newQr.trim(),
        whatsappNumber: newWhatsappNumber.trim() || "08214689756",
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDate("");
        setNewLocation("");
        setNewBannerUrl("");
        setNewQr("");
        setNewWhatsappNumber("");
        if (onRefreshEvents) onRefreshEvents();
        alert(`Event "${newTitle.trim()}" berhasil dibuat!`);
      } else {
        setCreateError(res.message || "Gagal membuat event.");
      }
    } catch (err) {
      console.error("Create event error:", err);
      setCreateError("Terjadi kesalahan server saat membuat event.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    setUploadSuccess(false);
    try {
      const res = await api.uploadEventBanner(selectedEventId, file);
      if (res.success && res.bannerUrl) {
        setForm((f) => ({ ...f, bannerUrl: res.bannerUrl }));
        setUploadMessage("Gambar banner/logo event berhasil diunggah dan diperbarui!");
        setUploadSuccess(true);
        if (onRefreshEvents) onRefreshEvents();
        setTimeout(() => setUploadSuccess(false), 4000);
      } else {
        alert(res.message || "Gagal mengunggah gambar event.");
      }
    } catch (err) {
      console.error("Upload banner error:", err);
      alert("Terjadi kesalahan saat unggah gambar event.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleQrisUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    try {
      const res = await api.uploadQrisImage(selectedEventId, file);
      if (res.success && res.qrCodeUrl) {
        setForm((f) => ({ ...f, qrCodeUrl: res.qrCodeUrl }));
        setUploadMessage("Gambar QR Code QRIS berhasil diunggah dan diperbarui!");
        setUploadSuccess(true);
        if (onRefreshEvents) onRefreshEvents();
        setTimeout(() => setUploadSuccess(false), 4000);
      } else {
        alert(res.message || "Gagal mengunggah QRIS.");
      }
    } catch (err) {
      console.error("Upload QRIS error:", err);
      alert("Terjadi kesalahan saat unggah QRIS.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateEvent(selectedEventId, {
        title: form.title,
        eventDate: form.date,
        location: form.location,
        bannerUrl: form.bannerUrl,
        qrCodeUrl: form.qrCodeUrl,
        whatsappNumber: form.whatsappNumber,
      });
      await api.toggleEventActive(selectedEventId, form.isActive);
      if (onRefreshEvents) onRefreshEvents();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save event error:", err);
      alert("Gagal menyimpan pengaturan event.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAllPhotos = async () => {
    setDeleteError("");
    setDeleteSuccess("");

    if (!deletePassword.trim()) {
      setDeleteError("Password Super Admin wajib diisi.");
      return;
    }
    if (!deleteEventTitle.trim()) {
      setDeleteError("Nama event wajib diketik ulang untuk konfirmasi.");
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await api.deleteAllEventPhotos(
        selectedEventId,
        deletePassword,
        deleteEventTitle
      );
      if (res.success) {
        setDeleteSuccess(res.message || "Semua foto berhasil dihapus.");
        setDeletePassword("");
        setDeleteEventTitle("");
        setTimeout(() => {
          setIsDeleteModalOpen(false);
          setDeleteSuccess("");
          if (onRefreshEvents) onRefreshEvents();
        }, 3000);
      } else {
        setDeleteError(res.message || "Gagal menghapus foto event.");
      }
    } catch (err) {
      console.error("Delete all event photos error:", err);
      setDeleteError(err?.message || "Terjadi kesalahan saat menghapus foto event.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Super Admin: Event Switcher & Add New Event Button */}
      {isSuperAdmin && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4.5 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#111827] block">
                Pilih Event untuk Dikelola:
              </span>
              <span className="text-[11px] text-[#6B7280]">
                Pilih event dari daftar untuk memperbarui informasi, QRIS, dan status aktif.
              </span>
            </div>
            <Button
              id="open-create-event-modal"
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-9 px-4 rounded-xl shadow-sm shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Tambah Event Baru
            </Button>
          </div>

          {events.length > 0 && (
            <Select
              value={String(selectedEventId)}
              onValueChange={(val) => setSelectedEventId(val)}
            >
              <SelectTrigger className="!h-11 w-full border-[#E5E7EB] rounded-xl text-xs bg-white font-medium">
                <SelectValue placeholder="Pilih Event...">
                  {events.find((e) => String(e.id) === String(selectedEventId))
                    ?.title || "Pilih Event..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E7EB] rounded-xl shadow-lg z-50">
                <SelectGroup>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={String(ev.id)}>
                      {ev.title} {ev.isActive ? "(Aktif)" : "(Non-Aktif)"}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Modal Tambah Event Baru */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-[#E5E7EB] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F3F4F6] pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-brand" />
                  <h3 className="text-base font-bold text-[#111827]">
                    Tambah Event Baru
                  </h3>
                </div>
                <Button
                  onClick={() => setIsCreateModalOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {createError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="space-y-3.5 pt-1">
                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    Nama Event
                  </label>
                  <Input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Dingklik Mountain Run vol.2"
                    className="h-10 text-xs border-[#E5E7EB] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    Tanggal Event
                  </label>
                  <Input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-10 text-xs border-[#E5E7EB] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    Lokasi Event (Opsional)
                  </label>
                  <Input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Contoh: Wisata Gunung Dingklik, Tuban, Jatim"
                    className="h-10 text-xs border-[#E5E7EB] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    URL Gambar / Banner Event (Opsional)
                  </label>
                  <Input
                    type="text"
                    value={newBannerUrl}
                    onChange={(e) => setNewBannerUrl(e.target.value)}
                    placeholder="Contoh: https://... (opsional)"
                    className="h-10 text-xs border-[#E5E7EB] rounded-xl"
                  />
                  <div className="bg-orange-50/80 border border-orange-200/80 rounded-xl p-2.5 text-[11px] text-orange-950 flex items-start gap-2 mt-1">
                    <Info className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                    <span>Rekomendasi Banner: Rasio <strong>16:9</strong> (1920×1080 px atau min. 1200×675 px), maks. 5MB.</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    URL QRIS (Opsional)
                  </label>
                  <Input
                    type="text"
                    value={newQr}
                    onChange={(e) => setNewQr(e.target.value)}
                    placeholder="Contoh: https://... (opsional)"
                    className="h-10 text-xs border-[#E5E7EB] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                    Nomor WhatsApp Konfirmasi Event
                  </label>
                  <Input
                    type="text"
                    value={newWhatsappNumber}
                    onChange={(e) => setNewWhatsappNumber(e.target.value)}
                    placeholder="Contoh: 08214689756"
                    className="h-10 text-xs border-[#E5E7EB] rounded-xl"
                  />
                  <p className="text-[11px] text-gray-500">
                    Nomor WA penerima konfirmasi pesanan event ini. (Default: 08214689756)
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 h-10 text-xs font-bold border-[#E5E7EB] rounded-xl"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLoading}
                    className="flex-1 h-10 text-xs font-bold bg-brand hover:bg-[#C2410C] text-white rounded-xl shadow-md shadow-orange-600/20"
                  >
                    {createLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Buat Event"
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      {uploadSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <AlertTitle className="text-xs font-bold text-emerald-900">
                  Unggah Berhasil!
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5 text-emerald-700">
                  {uploadMessage || "Data event telah berhasil diunggah dan diperbarui."}
                </AlertDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setUploadSuccess(false)}
              className="h-7 w-7 text-emerald-600 hover:bg-emerald-100 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </Alert>
        </motion.div>
      )}

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-green-50 border border-green-200 text-green-900 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 shrink-0" />
              <div>
                <AlertTitle className="text-xs font-bold">
                  Pengaturan Berhasil Disimpan!
                </AlertTitle>
                <AlertDescription className="text-xs mt-0.5 opacity-90">
                  Konfigurasi event, lokasi & banner telah diperbarui.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* 2-Column Responsive Form Layout (Kiri & Kanan di Desktop, Stacked 1 Kolom di Mobile) */}
      <form
        id="event-settings-form"
        onSubmit={handleSave}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
      >
        {/* ── Kolom Kiri: Informasi Dasar Event & Banner ── */}
        <Card className="bg-white border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-[#F3F4F6] pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-brand" />
              <h3 className="text-sm font-bold text-[#111827]">Pengaturan Informasi Event</h3>
            </div>
            <Badge
              variant="outline"
              className={`font-bib text-[10px] uppercase px-2.5 py-0.5 rounded-full ${
                form.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {form.isActive ? "AKTIF" : "NON-AKTIF"}
            </Badge>
          </div>

          <div className="space-y-4">
            {/* Nama Event */}
            <div className="space-y-1.5">
              <label
                htmlFor="event-title"
                className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold"
              >
                Nama Event
              </label>
              <Input
                id="event-title"
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Masukkan nama event..."
                className="h-11 border-[#E5E7EB] rounded-xl text-sm bg-white"
              />
            </div>

            {/* Tanggal Event */}
            <div className="space-y-1.5">
              <label
                htmlFor="event-date"
                className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold"
              >
                Tanggal Event
              </label>
              <Input
                id="event-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="h-11 border-[#E5E7EB] rounded-xl text-sm bg-white"
              />
            </div>

            {/* Lokasi Event */}
            <div className="space-y-1.5">
              <label
                htmlFor="event-location"
                className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold"
              >
                Lokasi Event (Opsional)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="event-location"
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="Contoh: Wisata gunung dingklik, Ds Ngimbang, Tuban, Jatim"
                  className="pl-9 h-11 border-[#E5E7EB] rounded-xl text-sm bg-white"
                />
              </div>
            </div>

            {/* Nomor WhatsApp Konfirmasi Event */}
            <div className="space-y-1.5">
              <label
                htmlFor="event-whatsapp"
                className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold"
              >
                Nomor WhatsApp Konfirmasi Event
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="event-whatsapp"
                  type="text"
                  value={form.whatsappNumber}
                  onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                  placeholder="Contoh: 08214689756"
                  className="pl-9 h-11 border-[#E5E7EB] rounded-xl text-sm bg-white"
                />
              </div>
              <p className="text-[11px] text-gray-500">
                Nomor WhatsApp admin yang menerima pesan konfirmasi pesanan event ini. (Default: 08214689756)
              </p>
            </div>

            {/* Gambar / Banner Event Upload Box */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bib uppercase tracking-widest text-[#4B5563] font-bold">
                  Gambar / Banner Event (Opsional)
                </label>
              </div>

              {/* Informative Helper Card untuk Spesifikasi Banner Ideal */}
              <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-3 text-xs text-orange-950 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-orange-950 text-[11px] uppercase tracking-wider">
                    Ukuran & Dimensi Banner Ideal (Landing Page):
                  </p>
                  <ul className="text-[11px] text-orange-900/90 leading-relaxed space-y-0.5 list-disc list-inside">
                    <li>Rasio Aspek: <strong>16:9</strong> (Landscape / Horisontal)</li>
                    <li>Resolusi Disarankan: <strong>1920 × 1080 px</strong> (atau min. <strong>1200 × 675 px</strong>)</li>
                    <li>Format Berkas: <strong>JPG, PNG, atau WebP</strong> (Maks. 5MB)</li>
                  </ul>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                className="hidden"
                id="banner-upload-input"
              />

              {form.bannerUrl ? (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl p-3.5 space-y-3">
                  <div className="w-full h-36 sm:h-40 rounded-xl overflow-hidden border border-[#E5E7EB] shadow-xs relative bg-black/5">
                    <img
                      src={form.bannerUrl}
                      alt="Banner Event"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-gray-500 truncate max-w-[200px]">
                      Gambar event terpasang
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isUploadingBanner}
                      className="text-xs font-bold border-gray-300 rounded-xl h-8 px-3 bg-white hover:bg-gray-50 shrink-0"
                    >
                      {isUploadingBanner ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 mr-1.5 text-brand" />
                      )}
                      {isUploadingBanner ? "Mengunggah..." : "Ganti Gambar Event"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-5 text-center hover:border-brand/40 transition-colors cursor-pointer bg-[#F9FAFB] space-y-1"
                >
                  {isUploadingBanner ? (
                    <div className="py-2">
                      <Loader2 className="w-7 h-7 text-brand animate-spin mx-auto mb-1" />
                      <p className="text-xs font-bold text-gray-600">
                        Mengunggah Gambar Event...
                      </p>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-[#D1D5DB] mx-auto mb-1" />
                      <p className="text-xs font-semibold text-[#111827]">
                        Upload Gambar / Banner Event
                      </p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        Rasio 16:9 · PNG, JPG, atau WebP · Maks. 5MB
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Status Event Toggle Box */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#111827]">Status Akses Event</p>
                <p className="text-[11px] text-[#6B7280]">
                  {form.isActive
                    ? "Aktif — Peserta & fotografer dapat login dan mengakses galeri."
                    : "Non-Aktif — Akses login peserta & fotografer ditutup."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  id="toggle-event-active"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, isActive: checked }))
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                id="save-event-settings"
                type="submit"
                disabled={isSaving}
                className="w-full bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-11 rounded-xl shadow-md shadow-orange-600/20 transition-all"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isSaving ? "Menyimpan Pengaturan..." : "Simpan Pengaturan Event"}
              </Button>
            </div>
          </div>
        </Card>

        {/* ── Kolom Kanan: Pengaturan Pembayaran QRIS ── */}
        <Card className="bg-white border-[#E5E7EB] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-[#F3F4F6] pb-3 flex items-center gap-2">
            <QrCode className="w-4.5 h-4.5 text-brand" />
            <h3 className="text-sm font-bold text-[#111827]">QR Code Pembayaran QRIS Statis</h3>
          </div>

          <p className="text-xs text-[#6B7280] leading-relaxed">
            Unggah gambar QR Code QRIS yang akan ditampilkan kepada peserta saat checkout pembayaran pesanan foto.
          </p>

          <input
            type="file"
            accept="image/*"
            ref={qrInputRef}
            onChange={handleQrisUpload}
            className="hidden"
            id="qr-upload-input"
          />

          {form.qrCodeUrl ? (
            <div className="bg-[#F9FAFB] border-2 border-dashed border-brand/30 rounded-2xl p-4 sm:p-5 text-center shadow-xs space-y-3">
              <div className="w-48 h-48 sm:w-52 sm:h-52 mx-auto bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm flex items-center justify-center p-2">
                <img
                  src={form.qrCodeUrl}
                  alt="Gambar QRIS Event"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-bold border-gray-300 rounded-xl h-10 px-4 bg-white hover:bg-gray-50 transition-all"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-brand" />
                  )}
                  {isUploading ? "Mengunggah..." : "Ganti Gambar QRIS"}
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => qrInputRef.current?.click()}
              className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center hover:border-brand/40 transition-colors cursor-pointer bg-[#F9FAFB] space-y-2"
            >
              {isUploading ? (
                <div className="py-4">
                  <Loader2 className="w-9 h-9 text-brand animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">
                    Mengunggah Gambar QRIS...
                  </p>
                </div>
              ) : (
                <>
                  <QrCode className="w-10 h-10 text-[#D1D5DB] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#111827]">
                    Upload gambar QR Code QRIS
                  </p>
                  <p className="text-xs text-[#9CA3AF]">
                    PNG, JPG, atau JPEG · Maks. 5MB
                  </p>
                </>
              )}
            </div>
          )}
        </Card>

        {/* ── Danger Zone: Hapus Semua Foto Event (Full-width di bawah 2-kolom) ── */}
        {isSuperAdmin && (
          <Card className="lg:col-span-2 bg-red-50/60 border-red-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="border-b border-red-200 pb-3 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
              <h3 className="text-sm font-bold text-red-800">Zona Berbahaya</h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-red-800">
                  Hapus Semua Foto Event
                </p>
                <p className="text-[11px] text-red-600/80 leading-relaxed">
                  Menghapus <strong>seluruh foto</strong> (file di VPS Hostinger & Cloudflare R2, serta record di database) pada event yang sedang dipilih.
                  Transaksi peserta <strong>tidak akan dihapus</strong>. Aksi ini <strong>tidak dapat dibatalkan</strong>.
                </p>
              </div>
              <Button
                id="open-delete-all-photos-modal"
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(true);
                  setDeleteError("");
                  setDeleteSuccess("");
                  setDeletePassword("");
                  setDeleteEventTitle("");
                  setShowDeletePassword(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-10 px-5 rounded-xl shadow-sm shrink-0 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Hapus Semua Foto
              </Button>
            </div>
          </Card>
        )}
      </form>

      {/* Modal Konfirmasi Hapus Semua Foto Event */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-red-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-800">
                      Konfirmasi Hapus Semua Foto
                    </h3>
                    <p className="text-[11px] text-red-600/80">
                      Aksi ini tidak dapat dibatalkan
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleteLoading}
                  className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Info event yang dipilih */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                <p className="text-xs text-red-700">
                  Anda akan menghapus <strong>seluruh foto</strong> pada event:
                </p>
                <p className="text-sm font-bold text-red-900 mt-1">
                  {events.find((e) => String(e.id) === String(selectedEventId))?.title || "—"}
                </p>
              </div>

              {/* Notifikasi Error / Sukses */}
              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3 flex items-start gap-2">
                  <X className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
              {deleteSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl p-3 flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{deleteSuccess}</span>
                </div>
              )}

              {!deleteSuccess && (
                <div className="space-y-3">
                  {/* Input: Ketik Nama Event */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#374151] flex items-center gap-1">
                      Ketik Nama Event
                      <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="delete-confirm-event-title"
                      type="text"
                      value={deleteEventTitle}
                      onChange={(e) => setDeleteEventTitle(e.target.value)}
                      placeholder={events.find((e) => String(e.id) === String(selectedEventId))?.title || "Nama Event..."}
                      disabled={deleteLoading}
                      className="h-10 border-red-200 rounded-xl text-xs bg-white focus:border-red-400 focus:ring-red-400/20"
                    />
                    <p className="text-[10px] text-gray-400">
                      Ketik ulang nama event di atas persis seperti yang tertulis untuk mengonfirmasi.
                    </p>
                  </div>

                  {/* Input: Password Super Admin */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#374151] flex items-center gap-1">
                      Password Super Admin
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="delete-confirm-password"
                        type={showDeletePassword ? "text" : "password"}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Masukkan password Anda"
                        disabled={deleteLoading}
                        className="h-10 border-red-200 rounded-xl text-xs bg-white focus:border-red-400 focus:ring-red-400/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showDeletePassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDeleteModalOpen(false)}
                      disabled={deleteLoading}
                      className="flex-1 text-xs font-bold h-10 rounded-xl border-gray-300"
                    >
                      Batal
                    </Button>
                    <Button
                      id="confirm-delete-all-photos"
                      type="button"
                      onClick={handleDeleteAllPhotos}
                      disabled={deleteLoading || !deletePassword.trim() || !deleteEventTitle.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold h-10 rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      {deleteLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {deleteLoading ? "Menghapus..." : "Hapus Semua Foto"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  const [newQr, setNewQr] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const [form, setForm] = useState({
    title: "",
    date: "",
    qrCodeUrl: "",
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const qrInputRef = useRef(null);

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
            qrCodeUrl: ev.qrCodeUrl || "",
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
        qrCodeUrl: newQr.trim(),
      });
      if (res.success) {
        setIsCreateModalOpen(false);
        setNewTitle("");
        setNewDate("");
        setNewQr("");
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
        qrCodeUrl: form.qrCodeUrl,
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

  return (
    <div className="max-w-lg space-y-5">
      {/* Super Admin: Event Switcher & Add New Event Button */}
      {isSuperAdmin && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#111827]">
              Pilih Event untuk Dikelola:
            </span>
            <Button
              id="open-create-event-modal"
              onClick={() => setIsCreateModalOpen(true)}
              size="sm"
              className="bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-9 px-3.5 rounded-xl shadow-sm"
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
                    placeholder="Contoh: Marathon Bandung 2026"
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

      <form
        id="event-settings-form"
        onSubmit={handleSave}
        className="space-y-4.5"
      >
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
                    Unggah QRIS Berhasil!
                  </AlertTitle>
                  <AlertDescription className="text-xs mt-0.5 text-emerald-700">
                    {uploadMessage || "Gambar QR Code QRIS pembayaran telah berhasil diunggah dan diperbarui."}
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
                    Konfigurasi event & QRIS telah diperbarui.
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}

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
            className="h-11 border-[#E5E7EB] rounded-xl text-sm"
          />
        </div>

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
              className="border-2 border-dashed border-[#E5E7EB] rounded-2xl p-6 text-center hover:border-brand/40 transition-colors cursor-pointer bg-[#F9FAFB]"
            >
              {isUploading ? (
                <div className="py-2">
                  <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">
                    Mengunggah Gambar QRIS...
                  </p>
                </div>
              ) : (
                <>
                  <QrCode className="w-9 h-9 text-[#D1D5DB] mx-auto mb-2" />
                  <p className="text-sm font-semibold text-[#111827]">
                    Upload gambar QR Code QRIS
                  </p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">
                    PNG, JPG, atau JPEG · Maks. 5MB
                  </p>
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
                ? "Event sedang aktif. Peserta dapat mencari dan membeli foto."
                : "Event non-aktif. Peserta tidak dapat mengakses galeri event."}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Switch
              id="toggle-event-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, isActive: checked }))
              }
            />
            <span
              className={`text-xs font-bold font-bib ${form.isActive ? "text-brand" : "text-gray-500"}`}
            >
              {form.isActive ? "AKTIF" : "NON-AKTIF"}
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
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}

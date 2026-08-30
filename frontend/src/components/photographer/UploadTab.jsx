import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CloudUpload,
  X,
  Loader2,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { api } from "../../services/api";

export default function UploadTab({ onUploadSuccess, selectedEventId }) {
  const fileInputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkBib, setBulkBib] = useState("");
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const addFiles = useCallback((files) => {
    const newPreviews = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        price: "",
        bib: "",
      }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setUploadDone(false);
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removePreview = (id) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((p) => p.id !== id);
    });
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    setPreviews((prev) => prev.map((p) => ({ ...p, price: bulkPrice })));
  };

  const applyBulkBib = () => {
    if (!bulkBib.trim()) return;
    setPreviews((prev) => prev.map((p) => ({ ...p, bib: bulkBib.trim() })));
  };

  const applyBulkAll = () => {
    setPreviews((prev) =>
      prev.map((p) => ({
        ...p,
        ...(bulkPrice ? { price: bulkPrice } : {}),
        ...(bulkBib.trim() ? { bib: bulkBib.trim() } : {}),
      })),
    );
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      
      const metadataArray = [];
      previews.forEach((p) => {
        metadataArray.push({
          price: p.price ? Number(p.price) : (bulkPrice ? Number(bulkPrice) : 0),
          bibTag: p.bib ? p.bib.trim() : (bulkBib ? bulkBib.trim() : "")
        });
      });

      // Tetap kirim price dan bibTags global sebagai fallback untuk backward compatibility
      const avgPrice = metadataArray[0]?.price || 0;
      const globalBibs = metadataArray.map(m => m.bibTag).filter(Boolean).join(",") || "";
      
      formData.append("price", avgPrice);
      formData.append("bibTags", globalBibs);
      formData.append("metadata", JSON.stringify(metadataArray)); // Kirim metadata individual

      if (selectedEventId) {
        formData.append("eventId", selectedEventId);
      }

      // Append files AFTER all text fields so multer parses text fields correctly
      previews.forEach((p) => {
        formData.append("photos", p.file);
      });

      const res = await api.uploadPhotos(formData);
      if (res.success) {
        setUploadDone(true);
        setUploadError(null);
        setPreviews([]);
        onUploadSuccess?.();
      } else {
        setUploadError(res.message || "Gagal mengunggah foto.");
      }
    } catch (err) {
      console.error("Upload submit error:", err);
      setUploadError("Terjadi kesalahan koneksi saat mengunggah foto.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Dropzone */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        id="upload-dropzone"
        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-3xl cursor-pointer transition-all py-12 px-4 text-center bg-white/60
          ${
            isDragging
              ? "border-brand bg-brand/5 scale-[1.01] shadow-xl"
              : "border-[#E5E7EB] hover:border-brand/50 hover:bg-[#F9FAFB]"
          }`}
      >
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-brand/20" : "bg-[#F3F4F6]"}`}
        >
          <CloudUpload
            className={`w-8 h-8 ${isDragging ? "text-brand" : "text-[#9CA3AF]"}`}
          />
        </div>
        <div>
          <p className="font-bold text-[#111827] text-base">
            {isDragging
              ? "Lepaskan file di sini"
              : "Drag & drop foto hasil jepretan di sini"}
          </p>
          <p className="text-sm text-[#4B5563] mt-1">
            atau klik untuk pilih file dari laptop / memori kamera
          </p>
          <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-bib font-semibold">
            JPG, PNG, WEBP · Maksimal 20MB per foto
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          id="upload-file-input"
          onChange={(e) => addFiles(e.target.files)}
        />
      </motion.div>

      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <AlertTitle className="text-sm font-bold text-red-900">
                Gagal Mengunggah Foto
              </AlertTitle>
              <AlertDescription className="text-xs text-red-700 leading-relaxed mt-1">
                {uploadError}
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setUploadError(null)}
              className="h-6 w-6 text-red-400 hover:text-red-700 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </Alert>
        </motion.div>
      )}

      {uploadDone && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert className="bg-green-50 border border-green-200 text-green-900 rounded-2xl p-4 shadow-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <AlertTitle className="text-sm font-bold text-green-900 flex items-center gap-2">
                <span>Berhasil Mengunggah Foto!</span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bib bg-green-100 text-green-800 border-green-300"
                >
                  {previews.length || 1} Lampiran Disimpan
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-xs text-green-700 leading-relaxed mt-1">
                Foto aksi beresolusi tinggi berhasil dilampirkan ke sistem.
                Watermark otomatis dan pembatasan pratinjau publik telah aktif.
              </AlertDescription>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* Control Massal */}
      {previews.length > 0 && (
        <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">
              Atur Harga & Label Massal ({previews.length} foto)
            </p>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                id="apply-bulk-all"
                onClick={applyBulkAll}
                disabled={!bulkPrice && !bulkBib.trim()}
                size="sm"
                className="bg-brand hover:bg-[#C2410C] text-white text-xs font-bold h-9 px-4 rounded-xl shadow-md shadow-orange-600/20"
              >
                Terapkan Semua
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#4B5563]">
                Set Harga ke Semua Foto
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#4B5563] font-bold">
                    Rp
                  </span>
                  <Input
                    id="bulk-price-input"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Contoh: 25000"
                    className="pl-8 h-10 border-[#E5E7EB] bg-white text-xs font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <Button
                  id="apply-bulk-price"
                  onClick={applyBulkPrice}
                  disabled={!bulkPrice}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-xs font-bold"
                >
                  Set Harga
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-[#4B5563]">
                Set Label / Nomor Unik ke Semua Foto
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <Input
                    id="bulk-bib-input"
                    type="text"
                    inputMode="numeric"
                    value={bulkBib}
                    onChange={(e) => setBulkBib(e.target.value)}
                    placeholder="Contoh: 105"
                    className="pl-8 h-10 border-[#E5E7EB] bg-white text-xs font-bib"
                  />
                </div>
                <Button
                  id="apply-bulk-bib"
                  onClick={applyBulkBib}
                  disabled={!bulkBib.trim()}
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-xs font-bold"
                >
                  Set Label
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">
            Anda dapat memilih foto individual di bawah jika ingin mengubah
            harga/label tertentu saja.
          </p>
        </Card>
      )}

      {/* Grid Previews & Attachment Group */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">
              {previews.length} foto siap diupload
            </p>
            <Badge
              variant="outline"
              className="font-bib text-[10px] bg-brand/10 text-brand border-brand/20"
            >
              Lampiran Antrean
            </Badge>
          </div>

          <AttachmentGroup className="py-1">
            {previews.map((p, idx) => (
              <Attachment
                key={p.id}
                size="sm"
                orientation="horizontal"
                className="bg-white border-[#E5E7EB] shadow-xs"
              >
                <AttachmentMedia
                  variant="image"
                  className="w-8 h-8 rounded overflow-hidden"
                >
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </AttachmentMedia>
                <AttachmentContent className="pr-1">
                  <AttachmentTitle className="text-xs font-bold text-[#111827]">
                    Foto #{idx + 1}
                  </AttachmentTitle>
                  <AttachmentDescription className="text-[10px] text-gray-500 font-bib">
                    {p.file?.name ? p.file.name : `SEPOTO-RAW-${idx + 1}.jpg`}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction
                    onClick={() => removePreview(p.id)}
                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p) => (
              <Card
                key={p.id}
                className="relative group bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl overflow-hidden p-0 shadow-sm"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => removePreview(p.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  aria-label="Hapus"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="p-2.5 space-y-1.5 bg-white">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF] font-bold">
                      Rp
                    </span>
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={
                        p.price === 0 ||
                        p.price === "0" ||
                        p.price == null ||
                        p.price === ""
                          ? ""
                          : p.price
                      }
                      onChange={(e) =>
                        setPreviews((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, price: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Harga"
                      className="pl-7 h-8 text-xs border-[#E5E7EB] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={p.bib}
                      onChange={(e) =>
                        setPreviews((prev) =>
                          prev.map((x) =>
                            x.id === p.id ? { ...x, bib: e.target.value } : x,
                          ),
                        )
                      }
                      placeholder="Tag Nomor Unik / Label"
                      className="pl-8 h-8 text-xs border-[#E5E7EB] font-bib"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              id="submit-upload-btn"
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full h-13 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-600/25"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Mengupload & memproses watermark...</span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-5 h-5 mr-2" />
                  <span>Upload {previews.length} Foto Sekarang</span>
                </>
              )}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

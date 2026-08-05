import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudUpload, Image as ImageIcon, Trash2, X,
  Camera, Search, Loader2, Tag, CheckCircle2, Eye, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group';
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
import {
  Attachment,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from '@/components/ui/attachment';
import AppShell from '../components/AppShell';
import ProtectedPhoto from '../components/ProtectedPhoto';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(v ?? 0);

const formatRupiahInput = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const cleanStr = String(val).replace(/\D/g, '');
  if (!cleanStr) return '';
  return new Intl.NumberFormat('id-ID').format(Number(cleanStr));
};

const parseRupiahInput = (val) => {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
};

// ─── Lightbox Modal Preview Foto untuk Fotografer ────────────────────────
function PhotoPreviewModal({ photo, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!photo) return null;

  const imgUrl = photo.watermarkedUrl || photo.watermarked_url || photo.originalUrl || '';
  const bibVal = photo.bibTags ?? photo.bib_tags ?? '';
  const priceVal = photo.price ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full bg-[#191C21] rounded-3xl overflow-hidden border border-white/10 shadow-2xl text-white flex flex-col max-h-[90vh]"
      >
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Camera className="w-4 h-4 text-brand" />
            <span className="text-sm font-bold">Pratinjau Hasil Jepretan</span>
            {bibVal && (
              <Badge className="font-bib text-[10px] bg-brand text-white border-0 px-2 py-0.5">
                BIB #{bibVal}
              </Badge>
            )}
            <Badge variant="outline" className="font-bib text-[10px] bg-white/10 text-white border-white/20">
              ID #{photo.id}
            </Badge>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Tutup pratinjau"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Image Container */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] max-h-[60vh] p-2">
          <ProtectedPhoto
            src={imgUrl}
            alt={`Pratinjau Foto ID ${photo.id}`}
            className="w-full h-full max-h-[58vh] flex items-center justify-center"
            imgClassName="w-full h-full object-contain max-h-[58vh] rounded-xl select-none"
          />
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#191C21] flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bib uppercase tracking-widest text-gray-400">Status Harga Galeri</p>
            <p className="font-bib text-xl font-bold text-brand">
              {Number(priceVal) > 0 ? `Rp ${Number(priceVal).toLocaleString('id-ID')}` : 'Belum Diberi Harga (Rp 0)'}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={onClose}
            className="h-11 px-6 rounded-xl border-white/20 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-bold shrink-0"
          >
            Tutup
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UploadTab({ onUploadSuccess }) {
  const fileInputRef           = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkPrice, setBulkPrice]     = useState('');
  const [bulkBib, setBulkBib]         = useState('');
  const [uploadDone, setUploadDone]   = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const addFiles = useCallback((files) => {
    const newPreviews = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({
        id:    crypto.randomUUID(),
        file,
        url:   URL.createObjectURL(file),
        price: '',
        bib:   '',
      }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setUploadDone(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

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
    setPreviews((prev) => prev.map((p) => ({
      ...p,
      ...(bulkPrice ? { price: bulkPrice } : {}),
      ...(bulkBib.trim() ? { bib: bulkBib.trim() } : {}),
    })));
  };

  const handleUpload = async () => {
    if (previews.length === 0) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      previews.forEach((p) => {
        formData.append('photos', p.file);
      });

      const avgPrice = previews[0]?.price ? Number(previews[0].price) : (bulkPrice ? Number(bulkPrice) : 0);
      const bibs = previews.map((p) => p.bib).filter(Boolean).join(',') || bulkBib || '';

      formData.append('price', avgPrice);
      formData.append('bibTags', bibs);

      const res = await api.uploadPhotos(formData);
      if (res.success) {
        setUploadDone(true);
        setUploadError(null);
        setPreviews([]);
        onUploadSuccess?.();
      } else {
        setUploadError(res.message || 'Gagal mengunggah foto.');
      }
    } catch (err) {
      console.error('Upload submit error:', err);
      setUploadError('Terjadi kesalahan koneksi saat mengunggah foto.');
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
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        id="upload-dropzone"
        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-3xl cursor-pointer transition-all py-12 px-4 text-center bg-white/60
          ${isDragging
            ? 'border-brand bg-brand/5 scale-[1.01] shadow-xl'
            : 'border-[#E5E7EB] hover:border-brand/50 hover:bg-[#F9FAFB]'
          }`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-brand/20' : 'bg-[#F3F4F6]'}`}>
          <CloudUpload className={`w-8 h-8 ${isDragging ? 'text-brand' : 'text-[#9CA3AF]'}`} />
        </div>
        <div>
          <p className="font-bold text-[#111827] text-base">
            {isDragging ? 'Lepaskan file di sini' : 'Drag & drop foto hasil jepretan di sini'}
          </p>
          <p className="text-sm text-[#4B5563] mt-1">atau klik untuk pilih file dari laptop / memori kamera</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-bib font-semibold">JPG, PNG, WEBP · Maksimal 20MB per foto</p>
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
                <Badge variant="outline" className="text-[10px] font-bib bg-green-100 text-green-800 border-green-300">
                  {previews.length || 1} Lampiran Disimpan
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-xs text-green-700 leading-relaxed mt-1">
                Foto aksi beresolusi tinggi berhasil dilampirkan ke sistem. Watermark otomatis dan pembatasan pratinjau publik telah aktif.
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
              Atur Harga & BIB Massal ({previews.length} foto)
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
              <label className="block text-[11px] font-bold text-[#4B5563]">Set Harga ke Semua Foto</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#4B5563] font-bold">Rp</span>
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
              <label className="block text-[11px] font-bold text-[#4B5563]">Set Nomor BIB ke Semua Foto</label>
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
                  Set BIB
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">Anda dapat memilih foto individual di bawah jika ingin mengubah harga/BIB tertentu saja.</p>
        </Card>
      )}

      {/* Grid Previews & Attachment Group */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111827]">{previews.length} foto siap diupload</p>
            <Badge variant="outline" className="font-bib text-[10px] bg-brand/10 text-brand border-brand/20">
              Lampiran Antrean
            </Badge>
          </div>

          <AttachmentGroup className="py-1">
            {previews.map((p, idx) => (
              <Attachment key={p.id} size="sm" orientation="horizontal" className="bg-white border-[#E5E7EB] shadow-xs">
                <AttachmentMedia variant="image" className="w-8 h-8 rounded overflow-hidden">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </AttachmentMedia>
                <AttachmentContent className="pr-1">
                  <AttachmentTitle className="text-xs font-bold text-[#111827]">Foto #{idx + 1}</AttachmentTitle>
                  <AttachmentDescription className="text-[10px] text-gray-500 font-bib">
                    {p.file?.name ? p.file.name : `SEPOTO-RAW-${idx + 1}.jpg`}
                  </AttachmentDescription>
                </AttachmentContent>
                <AttachmentActions>
                  <AttachmentAction onClick={() => removePreview(p.id)} className="h-6 w-6 text-gray-400 hover:text-red-500">
                    <X className="w-3 h-3" />
                  </AttachmentAction>
                </AttachmentActions>
              </Attachment>
            ))}
          </AttachmentGroup>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p) => (
              <Card key={p.id} className="relative group bg-[#F9FAFB] border-[#E5E7EB] rounded-2xl overflow-hidden p-0 shadow-sm">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
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
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF] font-bold">Rp</span>
                    <Input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={p.price === 0 || p.price === '0' || p.price == null || p.price === '' ? '' : p.price}
                      onChange={(e) =>
                        setPreviews((prev) =>
                          prev.map((x) => x.id === p.id ? { ...x, price: e.target.value } : x)
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
                          prev.map((x) => x.id === p.id ? { ...x, bib: e.target.value } : x)
                        )
                      }
                      placeholder="Tag BIB"
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
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /><span>Mengupload & memproses watermark...</span></>
              ) : (
                <><CloudUpload className="w-5 h-5 mr-2" /><span>Upload {previews.length} Foto Sekarang</span></>
              )}
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ManageTab({ onPhotosChange }) {
  const [photos, setPhotos]               = useState([]);
  const [selected, setSelected]           = useState(new Set());
  const [bulkEditPrice, setBulkEditPrice] = useState('');
  const [bulkEditBib, setBulkEditBib]     = useState('');
  const [search, setSearch]               = useState('');

  // Shadcn UI Alert, AlertDialog & Preview State
  const [previewPhoto, setPreviewPhoto]   = useState(null);
  const [actionAlert, setActionAlert]     = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null); // { type: 'single' | 'bulk', photoId?: number, count: number }
  const [isDeleting, setIsDeleting]       = useState(false);
  const [isBulkOpen, setIsBulkOpen]       = useState(false);
  const [isSavingBulk, setIsSavingBulk]   = useState(false);

  // Single Photo Edit Modal State
  const [editPhoto, setEditPhoto]         = useState(null);
  const [editPrice, setEditPrice]         = useState('');
  const [editBib, setEditBib]             = useState('');
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  const loadPhotos = useCallback(async () => {
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
      console.error('Fetch my photos error:', err);
      setPhotos([]);
      onPhotosChange?.(0);
    }
  }, [onPhotosChange]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const filtered = photos.filter((p) =>
    !search || p.bibTags?.includes(search) || String(p.id).includes(search)
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
        type: 'error',
        title: 'Tidak Ada Perubahan',
        message: 'Masukkan set harga baru atau BIB tag baru terlebih dahulu.',
      });
      return;
    }

    setIsSavingBulk(true);
    try {
      const newPrice = bulkEditPrice !== '' ? Number(bulkEditPrice) : undefined;
      const newBib = bulkEditBib.trim() !== '' ? bulkEditBib.trim() : undefined;

      let successCount = 0;
      for (const id of Array.from(selected)) {
        const updatePayload = {};
        if (newPrice !== undefined) updatePayload.price = newPrice;
        if (newBib !== undefined) updatePayload.bibTags = newBib;

        try {
          const res = await api.updatePhoto(id, updatePayload);
          if (res.success) successCount++;
        } catch (err) {
          console.error('Failed to update photo', id, err);
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
        })
      );

      const count = selected.size;
      setIsBulkOpen(false);
      setBulkEditPrice('');
      setBulkEditBib('');
      setSelected(new Set());

      setActionAlert({
        type: 'success',
        title: 'Tersimpan ke Database!',
        message: `Berhasil memperbarui ${count} foto di database.`,
      });
    } catch (err) {
      console.error('Save bulk error:', err);
      setActionAlert({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan saat memperbarui foto secara massal.',
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
      const finalPrice = editPrice !== '' ? Number(editPrice) : 0;
      const res = await api.updatePhoto(editPhoto.id, {
        price: finalPrice,
        bibTags: editBib,
      });

      if (res.success) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === editPhoto.id
              ? { ...p, price: finalPrice, bibTags: editBib }
              : p
          )
        );
        setEditPhoto(null);
        setActionAlert({
          type: 'success',
          title: 'Berhasil Disimpan!',
          message: `Detail foto #${editPhoto.id} tersimpan di database.`,
        });
      } else {
        setActionAlert({
          type: 'error',
          title: 'Gagal Menyimpan',
          message: res.message || 'Terjadi kesalahan saat menyimpan ke database.',
        });
      }
    } catch (err) {
      console.error('Save photo error:', err);
      setActionAlert({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Terjadi kesalahan koneksi saat menyimpan ke database.',
      });
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Memicu Modal Konfirmasi Hapus Single
  const requestDeleteSingle = (photoId) => {
    setDeleteConfirmModal({
      type: 'single',
      photoId,
      count: 1,
    });
  };

  // Memicu Modal Konfirmasi Hapus Bulk (Terpilih)
  const requestDeleteBulk = () => {
    if (selected.size === 0) return;
    setDeleteConfirmModal({
      type: 'bulk',
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
      if (deleteConfirmModal.type === 'single' && deleteConfirmModal.photoId) {
        const id = deleteConfirmModal.photoId;
        await api.deletePhoto(id);
        setPhotos((prev) => prev.filter((p) => p.id !== id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else if (deleteConfirmModal.type === 'bulk') {
        const ids = Array.from(selected);
        for (const id of ids) {
          try {
            await api.deletePhoto(id);
          } catch (err) {
            console.error('Failed to delete photo', id, err);
          }
        }
        setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
        setSelected(new Set());
      }

      setDeleteConfirmModal(null);
      setActionAlert({
        type: 'success',
        title: 'Foto Berhasil Dihapus!',
        message: `${count} foto telah berhasil dihapus secara permanen dari galeri & server.`,
      });
      onPhotosChange?.(photos.length - count);
    } catch (err) {
      console.error('Delete photo error:', err);
      setActionAlert({
        type: 'error',
        title: 'Gagal Menghapus Foto',
        message: 'Terjadi kesalahan server saat menghapus foto.',
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
            actionAlert.type === 'success' ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-red-50 border border-red-200 text-red-900'
          }`}>
            <div className="flex items-center gap-3">
              {actionAlert.type === 'success'
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
              <InputGroupButton onClick={() => setSearch('')} title="Bersihkan pencarian">
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
            className="sticky top-16 z-30 bg-[#191C21]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl text-white my-2"
          >
            <div className="flex items-center gap-2">
              <Badge className="bg-brand text-white font-bold font-bib text-xs px-2.5 py-0.5">
                {selected.size} Foto Terpilih
              </Badge>
              <span className="text-xs text-gray-300 hidden md:inline">
                Siap untuk diubah harga atau tag BIB secara bersamaan
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(new Set())}
                className="h-9 text-xs font-bold border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl"
              >
                Batalkan Pilihan
              </Button>
              <Button
                size="sm"
                onClick={() => setIsBulkOpen(true)}
                className="h-9 text-xs font-bold bg-brand hover:bg-[#C2410C] text-white rounded-xl gap-1.5 shadow-sm"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit ({selected.size})</span>
              </Button>
              <Button
                id="delete-selected-btn"
                onClick={requestDeleteBulk}
                variant="destructive"
                size="sm"
                className="h-9 text-xs font-bold rounded-xl px-3 gap-1.5 shadow-sm"
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
      {filtered.length === 0 ? (
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
            const imgUrl = photo.watermarkedUrl || photo.watermarked_url || '';

            return (
              <motion.div key={photo.id} whileHover={{ y: -2 }}>
                <Card
                  className={`group relative overflow-hidden bg-white border rounded-2xl transition-all shadow-xs hover:shadow-md ${
                    isSelected ? 'border-brand ring-2 ring-brand/20' : 'border-[#E5E7EB]'
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
                            setEditPrice(photo.price || '');
                            setEditBib(photo.bibTags || '');
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
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Foto'}
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
                  'Terapkan Ke Semua'
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
                  'Simpan Perubahan'
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

export default function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedCount, setUploadedCount] = useState(0);

  const fetchUploadedCount = useCallback(async () => {
    try {
      const res = await api.getMyPhotos();
      if (res.success && res.photos) {
        setUploadedCount(res.photos.length);
      } else {
        setUploadedCount(0);
      }
    } catch (err) {
      console.error('Fetch uploaded count error:', err);
      setUploadedCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUploadedCount();
  }, [fetchUploadedCount]);

  const tabs = [
    { id: 'upload', label: 'Upload Foto', icon: CloudUpload },
    { id: 'manage', label: 'Kelola Foto', icon: ImageIcon },
  ];

  return (
    <AppShell>
      <div className="max-w-screen-lg mx-auto px-4 pb-12">

        <div className="py-6 md:py-8 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-blue-600 bg-blue-50 border-blue-200 px-3 py-1 rounded-full mb-2">
                <Camera className="w-3.5 h-3.5" />
                Fotografer
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-[#111827] tracking-tight">
                Dashboard Fotografer
              </h1>
              <p className="text-sm text-[#4B5563] mt-1">
                Selamat datang, <span className="font-semibold text-[#111827]">{currentUser?.name}</span>
              </p>
            </div>
            <div className="text-right shrink-0 bg-white border border-[#E5E7EB] rounded-2xl px-3.5 py-1.5 shadow-sm">
              <p className="text-xl font-bold text-[#111827] font-bib">{uploadedCount}</p>
              <p className="text-[10px] text-[#4B5563]">foto diupload</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-5 mb-6 bg-[#F3F4F6] p-1 rounded-2xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              id={`tab-${id}`}
              variant="ghost"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-bold transition-all ${
                activeTab === id
                  ? 'bg-white text-[#111827] shadow-md'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'upload' ? (
              <UploadTab onUploadSuccess={fetchUploadedCount} />
            ) : (
              <ManageTab onPhotosChange={(count) => {
                if (typeof count === 'number') {
                  setUploadedCount(count);
                } else {
                  fetchUploadedCount();
                }
              }} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

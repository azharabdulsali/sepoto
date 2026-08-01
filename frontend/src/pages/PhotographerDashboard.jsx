import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudUpload, Image as ImageIcon, Check, Trash2, X,
  Camera, Search, Loader2, CheckSquare, Square, Tag, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
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
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const DUMMY_UPLOADED = Array.from({ length: 12 }, (_, i) => ({
  id:              i + 1,
  watermarkedUrl:  `https://picsum.photos/seed/photo${i + 1}/400/500`,
  price:           i % 3 === 0 ? 25000 : i % 3 === 1 ? 35000 : 0,
  bibTags:         i % 4 === 0 ? String(100 + i) : '',
  uploadedAt:      new Date(Date.now() - i * 3600000).toLocaleString('id-ID'),
}));

function UploadTab() {
  const fileInputRef           = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkPrice, setBulkPrice]     = useState('');
  const [bulkBib, setBulkBib]         = useState('');
  const [uploadDone, setUploadDone]   = useState(false);

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

      const avgPrice = previews[0]?.price || bulkPrice || 25000;
      const bibs = previews.map((p) => p.bib).filter(Boolean).join(',') || bulkBib || '';

      formData.append('price', avgPrice);
      formData.append('bibTags', bibs);

      const res = await api.uploadPhotos(formData);
      if (res.success) {
        setUploadDone(true);
        setPreviews([]);
      } else {
        alert(res.message || 'Gagal mengunggah foto.');
      }
    } catch (err) {
      console.error('Upload submit error:', err);
      alert('Terjadi kesalahan saat mengunggah foto.');
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
                    step="1000"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Contoh: 25000"
                    className="pl-8 h-10 border-[#E5E7EB] bg-white text-xs font-semibold"
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
                      value={p.price}
                      onChange={(e) =>
                        setPreviews((prev) =>
                          prev.map((x) => x.id === p.id ? { ...x, price: e.target.value } : x)
                        )
                      }
                      placeholder="Harga"
                      className="pl-7 h-8 text-xs border-[#E5E7EB]"
                    />
                  </div>
                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                    <Input
                      type="text"
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

function ManageTab() {
  const [photos, setPhotos]               = useState([]);
  const [selected, setSelected]           = useState(new Set());
  const [bulkEditPrice, setBulkEditPrice] = useState('');
  const [bulkEditBib, setBulkEditBib]     = useState('');
  const [search, setSearch]               = useState('');

  const loadPhotos = useCallback(async () => {
    try {
      const res = await api.getMyPhotos();
      if (res.success && res.photos) {
        setPhotos(res.photos);
      } else {
        setPhotos(DUMMY_UPLOADED);
      }
    } catch (err) {
      console.error('Fetch my photos error:', err);
      setPhotos(DUMMY_UPLOADED);
    }
  }, []);

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

  const applyBulkPrice = async () => {
    if (!bulkEditPrice || selected.size === 0) return;
    const newPrice = Number(bulkEditPrice);
    for (const id of Array.from(selected)) {
      try {
        await api.updatePhotoPrice(id, newPrice);
      } catch (err) {
        console.error('Failed to update price for photo', id, err);
      }
    }
    setPhotos((prev) =>
      prev.map((p) => selected.has(p.id) ? { ...p, price: newPrice } : p)
    );
    setBulkEditPrice('');
  };

  const applyBulkBib = () => {
    if (!bulkEditBib.trim() || selected.size === 0) return;
    setPhotos((prev) =>
      prev.map((p) => selected.has(p.id) ? { ...p, bibTags: bulkEditBib.trim() } : p)
    );
    setBulkEditBib('');
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    for (const id of Array.from(selected)) {
      try {
        await api.deletePhoto(id);
      } catch (err) {
        console.error('Failed to delete photo', id, err);
      }
    }
    setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
  };

  const updatePrice = (id, price) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, price: Number(price) } : p));
  };

  const updateBib = (id, bib) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, bibTags: bib } : p));
  };

  return (
    <div className="space-y-4">
      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563] pointer-events-none z-10" />
          <Input
            id="manage-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari BIB atau ID foto..."
            className="pl-10 h-11 border-[#E5E7EB] rounded-xl text-sm font-bib"
          />
        </div>
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
            className="sticky top-16 z-30 my-2"
          >
            <Card className="bg-[#191C21]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-3.5 shadow-2xl text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-brand">{selected.size} foto dipilih</span>
                <Button
                  id="delete-selected-btn"
                  onClick={deleteSelected}
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs font-bold rounded-xl px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Hapus Terpilih
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-bold">Rp</span>
                    <Input
                      id="multi-price-input"
                      type="number"
                      min="0"
                      value={bulkEditPrice}
                      onChange={(e) => setBulkEditPrice(e.target.value)}
                      placeholder="Harga baru"
                      className="pl-7 h-9 bg-white/10 border-white/20 text-white text-xs rounded-xl"
                    />
                  </div>
                  <Button
                    id="apply-multi-price"
                    onClick={applyBulkPrice}
                    disabled={!bulkEditPrice}
                    size="sm"
                    className="h-9 bg-brand hover:bg-[#C2410C] text-white text-xs font-bold shrink-0 rounded-xl"
                  >
                    Set Harga
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      id="multi-bib-input"
                      type="text"
                      value={bulkEditBib}
                      onChange={(e) => setBulkEditBib(e.target.value)}
                      placeholder="Nomor BIB baru"
                      className="pl-8 h-9 bg-white/10 border-white/20 text-white text-xs font-bib rounded-xl"
                    />
                  </div>
                  <Button
                    id="apply-multi-bib"
                    onClick={applyBulkBib}
                    disabled={!bulkEditBib.trim()}
                    size="sm"
                    className="h-9 bg-brand hover:bg-[#C2410C] text-white text-xs font-bold shrink-0 rounded-xl"
                  >
                    Set BIB
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <Button
          id="select-all-btn"
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="text-sm font-semibold text-[#4B5563] hover:text-[#111827] px-0 h-auto"
        >
          {selected.size === filtered.length && filtered.length > 0
            ? <CheckSquare className="w-4 h-4 text-brand mr-1.5" />
            : <Square className="w-4 h-4 mr-1.5" />
          }
          <span>{selected.size === filtered.length && filtered.length > 0 ? 'Batalkan semua' : 'Pilih semua'}</span>
        </Button>
      </div>

      {/* Grid Foto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((photo) => {
          const isSelected = selected.has(photo.id);
          return (
            <motion.div key={photo.id} whileHover={{ y: -2 }}>
              <Card
                className={`relative rounded-2xl overflow-hidden border-2 transition-all p-0 shadow-sm ${
                  isSelected ? 'border-brand shadow-md shadow-orange-500/20' : 'border-transparent'
                }`}
              >
                <button
                  id={`select-photo-${photo.id}`}
                  onClick={() => toggleSelect(photo.id)}
                  className="absolute top-2.5 left-2.5 z-10 w-5 h-5 rounded-md border-2 border-white/80 bg-black/30 flex items-center justify-center transition-colors shadow-md"
                  style={{ background: isSelected ? '#EA580C' : 'rgba(0,0,0,0.3)', borderColor: isSelected ? '#EA580C' : 'rgba(255,255,255,0.8)' }}
                  aria-label={`Pilih foto ${photo.id}`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>

                <div className="aspect-[4/5] overflow-hidden bg-[#F3F4F6]">
                  <img
                    src={photo.watermarkedUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="bg-white px-2.5 py-2.5 space-y-1.5">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#9CA3AF] font-bold">Rp</span>
                    <Input
                      type="number"
                      min="0"
                      value={photo.price}
                      onChange={(e) => updatePrice(photo.id, e.target.value)}
                      placeholder="Harga"
                      className="pl-7 h-8 text-xs font-bold border-[#E5E7EB]"
                    />
                  </div>

                  <div className="relative">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                    <Input
                      type="text"
                      value={photo.bibTags ?? ''}
                      onChange={(e) => updateBib(photo.id, e.target.value)}
                      placeholder="Tag BIB"
                      className="pl-8 h-8 text-xs font-bib border-[#E5E7EB]"
                    />
                  </div>

                  <p className="text-[10px] text-[#9CA3AF] text-right font-medium">{photo.uploadedAt}</p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');

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
              <p className="text-xl font-bold text-[#111827] font-bib">{DUMMY_UPLOADED.length}</p>
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
            {activeTab === 'upload' ? <UploadTab /> : <ManageTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

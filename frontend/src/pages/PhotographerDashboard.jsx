import React, { useState, useRef, useCallback } from 'react';
import {
  CloudUpload, Image as ImageIcon, Check, Trash2, X,
  Camera, Search, Loader2, CheckSquare, Square, Tag, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v ?? 0);

const DUMMY_UPLOADED = Array.from({ length: 12 }, (_, i) => ({
  id:              i + 1,
  watermarkedUrl:  `https://picsum.photos/seed/photo${i + 1}/400/500`,
  price:           i % 3 === 0 ? 25000 : i % 3 === 1 ? 35000 : 0,
  bibTags:         i % 4 === 0 ? String(100 + i) : '',
  uploadedAt:      new Date(Date.now() - i * 3600000).toLocaleString('id-ID'),
}));

// ─── TAB 1: Upload Foto ────────────────────────────────────────────────
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
    await new Promise((r) => setTimeout(r, 1500));
    setIsUploading(false);
    setUploadDone(true);
    setPreviews([]);
  };

  return (
    <div className="space-y-5">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        id="upload-dropzone"
        className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl cursor-pointer transition-all py-10 px-4 text-center
          ${isDragging
            ? 'border-brand bg-brand/5 scale-[1.01]'
            : 'border-[#E5E7EB] hover:border-brand/50 hover:bg-[#F9FAFB]'
          }`}
      >
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-brand/20' : 'bg-[#F3F4F6]'}`}>
          <CloudUpload className={`w-7 h-7 ${isDragging ? 'text-brand' : 'text-[#9CA3AF]'}`} />
        </div>
        <div>
          <p className="font-semibold text-[#111827]">
            {isDragging ? 'Lepaskan file di sini' : 'Drag & drop foto di sini'}
          </p>
          <p className="text-sm text-[#4B5563] mt-1">atau klik untuk pilih file dari komputer</p>
          <p className="text-[11px] text-[#9CA3AF] mt-1 font-bib">JPG, PNG, WEBP · Maks. 20MB per file</p>
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
      </div>

      {uploadDone && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
          <Check className="w-4 h-4 text-green-500 shrink-0" />
          Foto berhasil diupload! Sistem akan membuat versi watermark otomatis.
        </div>
      )}

      {/* Control Massal (Bulk Set Harga & BIB) */}
      {previews.length > 0 && (
        <Card className="bg-[#F9FAFB] border-[#E5E7EB] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[#111827]">
              Atur Harga & BIB Massal ({previews.length} foto)
            </p>
            <Button
              id="apply-bulk-all"
              onClick={applyBulkAll}
              disabled={!bulkPrice && !bulkBib.trim()}
              size="sm"
              className="bg-brand hover:bg-[#C2410C] text-white text-xs font-semibold h-8 rounded-lg"
            >
              Terapkan Semua
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Set Harga Massal */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#4B5563]">Set Harga ke Semua Foto</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#4B5563]">Rp</span>
                  <Input
                    id="bulk-price-input"
                    type="number"
                    min="0"
                    step="1000"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    placeholder="Contoh: 25000"
                    className="pl-8 h-9 border-[#E5E7EB] bg-white text-xs"
                  />
                </div>
                <Button
                  id="apply-bulk-price"
                  onClick={applyBulkPrice}
                  disabled={!bulkPrice}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs"
                >
                  Set Harga
                </Button>
              </div>
            </div>

            {/* Set BIB Massal */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#4B5563]">Set Nomor BIB ke Semua Foto</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <Input
                    id="bulk-bib-input"
                    type="text"
                    value={bulkBib}
                    onChange={(e) => setBulkBib(e.target.value)}
                    placeholder="Contoh: 105"
                    className="pl-8 h-9 border-[#E5E7EB] bg-white text-xs font-bib"
                  />
                </div>
                <Button
                  id="apply-bulk-bib"
                  onClick={applyBulkBib}
                  disabled={!bulkBib.trim()}
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs"
                >
                  Set BIB
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#9CA3AF]">Anda dapat mengubah harga & BIB secara individual di setiap kartu foto di bawah jika diperlukan.</p>
        </Card>
      )}

      {/* Grid Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#111827]">{previews.length} foto siap diupload</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p) => (
              <Card key={p.id} className="relative group bg-[#F9FAFB] border-[#E5E7EB] rounded-xl overflow-hidden p-0">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={() => removePreview(p.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Hapus"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Individual photo input */}
                <div className="p-2 space-y-1.5">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF]">Rp</span>
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
                      className="pl-6 h-7 text-[11px] border-[#E5E7EB]"
                    />
                  </div>
                  <div className="relative">
                    <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9CA3AF]" />
                    <Input
                      type="text"
                      value={p.bib}
                      onChange={(e) =>
                        setPreviews((prev) =>
                          prev.map((x) => x.id === p.id ? { ...x, bib: e.target.value } : x)
                        )
                      }
                      placeholder="Tag BIB"
                      className="pl-6 h-7 text-[11px] border-[#E5E7EB] font-bib"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            id="submit-upload-btn"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full h-12 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-600/20"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /><span>Mengupload & membuat watermark...</span></>
            ) : (
              <><CloudUpload className="w-4 h-4 mr-2" /><span>Upload {previews.length} Foto Sekarang</span></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── TAB 2: Kelola Foto ────────────────────────────────────────────────
function ManageTab() {
  const [photos, setPhotos]         = useState(DUMMY_UPLOADED);
  const [selected, setSelected]     = useState(new Set());
  const [bulkEditPrice, setBulkEditPrice] = useState('');
  const [bulkEditBib, setBulkEditBib]     = useState('');
  const [search, setSearch]         = useState('');

  const filtered = photos.filter((p) =>
    !search || p.bibTags?.includes(search) || String(p.id).includes(search)
  );

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
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

  const applyBulkPrice = () => {
    if (!bulkEditPrice || selected.size === 0) return;
    setPhotos((prev) =>
      prev.map((p) => selected.has(p.id) ? { ...p, price: Number(bulkEditPrice) } : p)
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

  const deleteSelected = () => {
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
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563] pointer-events-none z-10" />
          <Input
            id="manage-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari BIB atau ID foto..."
            className="pl-9 h-10 border-[#E5E7EB] rounded-xl text-sm font-bib"
          />
        </div>
        <p className="text-sm text-[#4B5563] self-center shrink-0">
          {photos.length} foto · {selected.size} dipilih
        </p>
      </div>

      {/* Multi-select Action Bar (Bulk Set Harga & BIB untuk foto terpilih) */}
      {selected.size > 0 && (
        <Card className="bg-[#191C21] border border-white/10 rounded-xl px-4 py-3 flex flex-col gap-3 animate-fade-in text-white">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{selected.size} foto dipilih</span>
            <Button
              id="delete-selected-btn"
              onClick={deleteSelected}
              variant="destructive"
              size="sm"
              className="h-7 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Hapus Foto Terpilih
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-white/10">
            {/* Set Harga Massal */}
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">Rp</span>
                <Input
                  id="multi-price-input"
                  type="number"
                  min="0"
                  value={bulkEditPrice}
                  onChange={(e) => setBulkEditPrice(e.target.value)}
                  placeholder="Harga baru"
                  className="pl-7 h-8 bg-white/10 border-white/20 text-white text-xs"
                />
              </div>
              <Button
                id="apply-multi-price"
                onClick={applyBulkPrice}
                disabled={!bulkEditPrice}
                size="sm"
                className="h-8 bg-brand hover:bg-[#C2410C] text-white text-xs font-bold shrink-0"
              >
                Set Harga
              </Button>
            </div>

            {/* Set BIB Massal */}
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  id="multi-bib-input"
                  type="text"
                  value={bulkEditBib}
                  onChange={(e) => setBulkEditBib(e.target.value)}
                  placeholder="Nomor BIB baru"
                  className="pl-8 h-8 bg-white/10 border-white/20 text-white text-xs font-bib"
                />
              </div>
              <Button
                id="apply-multi-bib"
                onClick={applyBulkBib}
                disabled={!bulkEditBib.trim()}
                size="sm"
                className="h-8 bg-brand hover:bg-[#C2410C] text-white text-xs font-bold shrink-0"
              >
                Set BIB
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Select All */}
      <div className="flex items-center gap-2">
        <Button
          id="select-all-btn"
          variant="ghost"
          size="sm"
          onClick={toggleAll}
          className="text-sm text-[#4B5563] hover:text-[#111827] px-0 h-auto"
        >
          {selected.size === filtered.length && filtered.length > 0
            ? <CheckSquare className="w-4 h-4 text-brand mr-1.5" />
            : <Square className="w-4 h-4 mr-1.5" />
          }
          <span>{selected.size === filtered.length && filtered.length > 0 ? 'Batalkan semua' : 'Pilih semua'}</span>
        </Button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((photo) => {
          const isSelected = selected.has(photo.id);
          return (
            <Card
              key={photo.id}
              className={`relative rounded-xl overflow-hidden border-2 transition-all p-0 ${
                isSelected ? 'border-brand shadow-md shadow-orange-500/20' : 'border-transparent'
              }`}
            >
              <button
                id={`select-photo-${photo.id}`}
                onClick={() => toggleSelect(photo.id)}
                className="absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 border-white/80 bg-black/30 flex items-center justify-center transition-colors"
                style={{ background: isSelected ? '#EA580C' : 'rgba(0,0,0,0.3)', borderColor: isSelected ? '#EA580C' : 'rgba(255,255,255,0.8)' }}
                aria-label={`Pilih foto ${photo.id}`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>

              <div className="aspect-[4/5] overflow-hidden bg-[#F3F4F6]">
                <img
                  src={photo.watermarkedUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="bg-white px-2 py-2 space-y-1.5">
                {/* Individual Price edit */}
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF]">Rp</span>
                  <Input
                    type="number"
                    min="0"
                    value={photo.price}
                    onChange={(e) => updatePrice(photo.id, e.target.value)}
                    placeholder="Harga"
                    className="pl-6 h-7 text-[11px] font-semibold border-[#E5E7EB]"
                  />
                </div>

                {/* Individual BIB edit */}
                <div className="relative">
                  <Tag className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9CA3AF]" />
                  <Input
                    type="text"
                    value={photo.bibTags ?? ''}
                    onChange={(e) => updateBib(photo.id, e.target.value)}
                    placeholder="Tag BIB"
                    className="pl-6 h-7 text-[11px] font-bib border-[#E5E7EB]"
                  />
                </div>

                <p className="text-[10px] text-[#9CA3AF] text-right">{photo.uploadedAt}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ────────────────────────────────────────────────────
export default function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');

  const tabs = [
    { id: 'upload', label: 'Upload Foto', icon: CloudUpload },
    { id: 'manage', label: 'Kelola Foto', icon: ImageIcon },
  ];

  return (
    <AppShell>
      <div className="max-w-screen-lg mx-auto px-4 pb-10">

        <div className="py-6 md:py-8 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-blue-600 bg-blue-50 border-blue-200 px-3 py-1 rounded-full mb-2">
                <Camera className="w-3 h-3" />
                Fotografer
              </Badge>
              <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
                Dashboard Fotografer
              </h1>
              <p className="text-sm text-[#4B5563] mt-1">
                Selamat datang, <span className="font-medium text-[#111827]">{currentUser?.name}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-[#111827]">{DUMMY_UPLOADED.length}</p>
              <p className="text-xs text-[#4B5563]">foto diupload</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-5 mb-6 bg-[#F3F4F6] p-1 rounded-xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              id={`tab-${id}`}
              variant="ghost"
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        <div className="animate-fade-in" key={activeTab}>
          {activeTab === 'upload' ? <UploadTab /> : <ManageTab />}
        </div>
      </div>
    </AppShell>
  );
}

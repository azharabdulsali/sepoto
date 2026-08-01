import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Image as ImageIcon, Tag, Check, Trash2, X,
  DollarSign, Camera, Eye, ChevronDown, Search,
  CloudUpload, FileImage, AlertCircle, Loader2, CheckSquare, Square
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

// ─── Format Rupiah ────────────────────────────────────────────────────
const formatRupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v ?? 0);

// ─── Data dummy foto yang sudah diupload fotografer ───────────────────
const DUMMY_UPLOADED = Array.from({ length: 12 }, (_, i) => ({
  id:              i + 1,
  watermarkedUrl:  `https://picsum.photos/seed/photo${i + 1}/400/500`,
  price:           i % 3 === 0 ? 25000 : i % 3 === 1 ? 35000 : 0,
  bibTags:         i % 4 === 0 ? String(100 + i) : '',
  uploadedAt:      new Date(Date.now() - i * 3600000).toLocaleString('id-ID'),
}));

// ─── Tab: Upload ──────────────────────────────────────────────────────
function UploadTab() {
  const fileInputRef           = useRef(null);
  const [previews, setPreviews] = useState([]);  // { file, url, price, bib }
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bulkPrice, setBulkPrice]     = useState('');
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

  const handleUpload = async () => {
    if (previews.length === 0) return;
    setIsUploading(true);
    // TODO: kirim ke POST /api/photos/upload (FormData multipart)
    await new Promise((r) => setTimeout(r, 1500));
    setIsUploading(false);
    setUploadDone(true);
    setPreviews([]);
  };

  return (
    <div className="space-y-5">
      {/* Drag & Drop Zone */}
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

      {/* Success alert */}
      {uploadDone && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl animate-fade-in">
          <Check className="w-4 h-4 text-green-500 shrink-0" />
          Foto berhasil diupload! Sistem akan membuat versi watermark otomatis.
        </div>
      )}

      {/* Bulk price setter */}
      {previews.length > 0 && (
        <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl p-4">
          <p className="text-sm font-semibold text-[#111827] mb-3">
            Atur Harga Massal ({previews.length} foto)
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#4B5563]">Rp</span>
              <input
                id="bulk-price-input"
                type="number"
                min="0"
                step="1000"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Contoh: 25000"
                className="w-full border border-[#E5E7EB] rounded-lg pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:border-brand/50 bg-white"
              />
            </div>
            <button
              id="apply-bulk-price"
              onClick={applyBulkPrice}
              disabled={!bulkPrice}
              className="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-[#C2410C] disabled:opacity-40 transition-colors"
            >
              Terapkan
            </button>
          </div>
          <p className="text-[11px] text-[#9CA3AF] mt-2">Harga bisa diubah per foto secara individual di bawah</p>
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#111827]">{previews.length} foto siap diupload</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {previews.map((p) => (
              <div key={p.id} className="relative group bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl overflow-hidden">
                {/* Thumbnail */}
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={p.url} alt="" className="w-full h-full object-cover" />
                </div>
                {/* Hapus */}
                <button
                  onClick={() => removePreview(p.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Hapus"
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Harga & BIB per item */}
                <div className="p-2 space-y-1.5">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF]">Rp</span>
                    <input
                      type="number"
                      min="0"
                      value={p.price}
                      onChange={(e) =>
                        setPreviews((prev) =>
                          prev.map((x) => x.id === p.id ? { ...x, price: e.target.value } : x)
                        )
                      }
                      placeholder="Harga"
                      className="w-full text-[11px] border border-[#E5E7EB] rounded-md pl-6 pr-2 py-1 focus:outline-none focus:border-brand/50"
                    />
                  </div>
                  <input
                    type="text"
                    value={p.bib}
                    onChange={(e) =>
                      setPreviews((prev) =>
                        prev.map((x) => x.id === p.id ? { ...x, bib: e.target.value } : x)
                      )
                    }
                    placeholder="Tag BIB (opsional)"
                    className="w-full text-[11px] border border-[#E5E7EB] rounded-md px-2 py-1 font-bib focus:outline-none focus:border-brand/50"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <button
            id="submit-upload-btn"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full tap-target flex items-center justify-center gap-2 bg-brand hover:bg-[#C2410C] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-orange-600/20"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Mengupload & membuat watermark...</span></>
            ) : (
              <><Upload className="w-4 h-4" /><span>Upload {previews.length} Foto Sekarang</span></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Kelola Foto ─────────────────────────────────────────────────
function ManageTab() {
  const [photos, setPhotos]         = useState(DUMMY_UPLOADED);
  const [selected, setSelected]     = useState(new Set());
  const [bulkEditPrice, setBulkEditPrice] = useState('');
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

  const applyBulkEdit = () => {
    if (!bulkEditPrice || selected.size === 0) return;
    setPhotos((prev) =>
      prev.map((p) => selected.has(p.id) ? { ...p, price: Number(bulkEditPrice) } : p)
    );
    setSelected(new Set());
    setBulkEditPrice('');
  };

  const deleteSelected = () => {
    setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
  };

  const updatePrice = (id, price) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, price: Number(price) } : p));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
          <input
            id="manage-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari BIB atau ID foto..."
            className="w-full border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand/50 font-bib"
          />
        </div>
        <p className="text-sm text-[#4B5563] self-center shrink-0">
          {photos.length} foto · {selected.size} dipilih
        </p>
      </div>

      {/* Multi-select action bar */}
      {selected.size > 0 && (
        <div className="bg-[#191C21] rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 animate-fade-in">
          <span className="text-white text-sm font-semibold">{selected.size} foto dipilih</span>
          <div className="flex gap-2 flex-1 flex-wrap">
            <div className="flex gap-1 flex-1 min-w-[180px]">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">Rp</span>
                <input
                  id="multi-price-input"
                  type="number"
                  min="0"
                  value={bulkEditPrice}
                  onChange={(e) => setBulkEditPrice(e.target.value)}
                  placeholder="Harga baru"
                  className="w-full bg-white/10 border border-white/20 text-white rounded-lg pl-7 pr-2 py-1.5 text-sm focus:outline-none focus:border-brand/60"
                />
              </div>
              <button
                id="apply-multi-price"
                onClick={applyBulkEdit}
                disabled={!bulkEditPrice}
                className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-[#C2410C] disabled:opacity-40 transition-colors shrink-0"
              >
                Set Harga
              </button>
            </div>
            <button
              id="delete-selected-btn"
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-semibold rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>
        </div>
      )}

      {/* Select all row */}
      <div className="flex items-center gap-2">
        <button
          id="select-all-btn"
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-sm text-[#4B5563] hover:text-[#111827] transition-colors"
        >
          {selected.size === filtered.length && filtered.length > 0
            ? <CheckSquare className="w-4 h-4 text-brand" />
            : <Square className="w-4 h-4" />
          }
          <span>{selected.size === filtered.length && filtered.length > 0 ? 'Batalkan semua' : 'Pilih semua'}</span>
        </button>
      </div>

      {/* Photo grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((photo) => {
          const isSelected = selected.has(photo.id);
          return (
            <div
              key={photo.id}
              className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                isSelected ? 'border-brand shadow-md shadow-orange-500/20' : 'border-transparent'
              }`}
            >
              {/* Checkbox overlay */}
              <button
                id={`select-photo-${photo.id}`}
                onClick={() => toggleSelect(photo.id)}
                className="absolute top-2 left-2 z-10 w-5 h-5 rounded-md border-2 border-white/80 bg-black/30 flex items-center justify-center transition-colors"
                style={{ background: isSelected ? '#EA580C' : 'rgba(0,0,0,0.3)', borderColor: isSelected ? '#EA580C' : 'rgba(255,255,255,0.8)' }}
                aria-label={`Pilih foto ${photo.id}`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>

              {/* Foto */}
              <div className="aspect-[4/5] overflow-hidden bg-[#F3F4F6]">
                <img
                  src={photo.watermarkedUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info bawah */}
              <div className="bg-white px-2 py-2 space-y-1.5">
                {photo.bibTags && (
                  <span className="font-bib text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded">
                    BIB #{photo.bibTags}
                  </span>
                )}
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-[#9CA3AF]">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={photo.price}
                    onChange={(e) => updatePrice(photo.id, e.target.value)}
                    className="w-full border border-[#E5E7EB] rounded-md pl-6 pr-2 py-1 text-[11px] font-semibold focus:outline-none focus:border-brand/50"
                  />
                </div>
                <p className="text-[10px] text-[#9CA3AF]">{photo.uploadedAt}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PhotographerDashboard ────────────────────────────────────────────
export default function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'manage'

  const tabs = [
    { id: 'upload', label: 'Upload Foto', icon: CloudUpload },
    { id: 'manage', label: 'Kelola Foto', icon: ImageIcon },
  ];

  return (
    <AppShell>
      <div className="max-w-screen-lg mx-auto px-4 pb-10">

        {/* Header */}
        <div className="py-6 md:py-8 border-b border-[#E5E7EB]">
          <div className="flex items-start justify-between gap-4">
          <div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bib uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-2">
                <Camera className="w-3 h-3" />
                Fotografer
              </span>
              <h1 className="text-2xl font-semibold text-[#111827] tracking-tight">
                Dashboard Fotografer
              </h1>
              <p className="text-sm text-[#4B5563] mt-1">
                Selamat datang, <span className="font-medium text-[#111827]">{currentUser?.name}</span>
              </p>
            </div>
            {/* Stats — tampil di semua ukuran layar */}
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-[#111827]">{DUMMY_UPLOADED.length}</p>
              <p className="text-xs text-[#4B5563]">foto diupload</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation — full width di mobile */}
        <div className="flex gap-1 mt-5 mb-6 bg-[#F3F4F6] p-1 rounded-xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === id
                  ? 'bg-white text-[#111827] shadow-sm'
                  : 'text-[#4B5563] hover:text-[#111827]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in" key={activeTab}>
          {activeTab === 'upload' ? <UploadTab /> : <ManageTab />}
        </div>
      </div>
    </AppShell>
  );
}

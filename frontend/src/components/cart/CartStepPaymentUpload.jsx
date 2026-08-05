import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  ImageIcon,
  X,
  Loader2,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  MAX_PROOF_SIZE_MB,
  MAX_PROOF_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from "./cartUtils";

export default function CartStepPaymentUpload({
  formattedTotal = "Rp 0",
  itemCount = 0,
  isSubmitting = false,
  checkoutError = "",
  onUploadProof,
}) {
  const proofInputRef = useRef(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [proofError, setProofError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleProofFileChange = (file) => {
    setProofError("");
    if (!file) return;

    if (
      !ACCEPTED_IMAGE_TYPES.includes(file.type) &&
      !file.type.startsWith("image/")
    ) {
      setProofError(
        "Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.",
      );
      return;
    }
    if (file.size > MAX_PROOF_SIZE_BYTES) {
      setProofError(
        `Ukuran file melebihi batas ${MAX_PROOF_SIZE_MB}MB. Pilih file yang lebih kecil.`,
      );
      return;
    }

    setProofFile(file);
    const url = URL.createObjectURL(file);
    setProofPreview(url);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleProofFileChange(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProofFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveProof = () => {
    setProofFile(null);
    setProofPreview(null);
    setProofError("");
    if (proofInputRef.current) proofInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!proofFile) {
      setProofError("Pilih foto bukti pembayaran terlebih dahulu.");
      return;
    }
    onUploadProof(proofFile);
  };

  return (
    <>
      {/* Ringkasan Total */}
      <Card className="bg-brand/5 border-brand/20 rounded-2xl px-4 py-3.5 mb-5 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-[11px] text-[#4B5563] font-bib uppercase tracking-widest font-bold mb-0.5">
            Total Pembayaran
          </p>
          <p className="font-bib text-xl font-bold text-brand font-bold">
            {formattedTotal}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="font-bib text-[10px] bg-brand/10 text-brand px-2.5 py-1"
        >
          {itemCount} Foto
        </Badge>
      </Card>

      {/* WAJIB UPLOAD Alert */}
      <div className="flex items-start gap-3 bg-red-50 border-2 border-red-300 rounded-2xl px-4 py-3.5 mb-5">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-red-700 mb-0.5">
            <span className="text-red-600 mr-1">*</span>
            Upload Bukti Pembayaran Wajib
          </p>
          <p className="text-xs text-red-600 leading-relaxed">
            Pesanan Anda baru akan diproses Admin setelah Anda mengupload bukti
            transfer atau screenshot e-wallet. Maks. {MAX_PROOF_SIZE_MB}MB,
            format JPG / PNG / WebP.
          </p>
        </div>
      </div>

      {/* Upload Drop Zone */}
      <Card className="bg-white border-[#E5E7EB] rounded-2xl overflow-hidden mb-4 shadow-sm">
        <div className="px-4 py-3.5 border-b border-[#F3F4F6] flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-bold text-[#111827]">
            Upload Bukti Pembayaran <span className="text-red-500">*</span>
          </h3>
        </div>

        {proofPreview ? (
          /* Preview file yang sudah dipilih */
          <div className="p-4">
            <div className="relative rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F9FAFB] shadow-sm">
              <img
                src={proofPreview}
                alt="Preview bukti pembayaran"
                className="w-full max-h-64 object-contain"
              />
              <button
                onClick={handleRemoveProof}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                title="Hapus foto"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] font-medium px-3 py-1.5 flex items-center justify-between">
                <span className="truncate max-w-[200px]">
                  {proofFile?.name}
                </span>
                <span className="shrink-0 ml-2">
                  {(proofFile?.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
            <button
              onClick={() => proofInputRef.current?.click()}
              className="mt-2.5 w-full text-xs text-brand hover:text-[#C2410C] font-semibold text-center transition-colors"
            >
              Ganti Foto Bukti
            </button>
          </div>
        ) : (
          /* Drop Zone */
          <div
            onClick={() => proofInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            className={`m-4 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragOver
                ? "border-brand bg-brand/5 scale-[1.01]"
                : "border-[#E5E7EB] hover:border-brand hover:bg-brand/5"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isDragOver ? "bg-brand/20" : "bg-[#F3F4F6]"}`}
            >
              <Upload
                className={`w-7 h-7 transition-colors ${isDragOver ? "text-brand" : "text-[#9CA3AF]"}`}
              />
            </div>
            <p className="text-sm font-bold text-[#111827] mb-1">
              {isDragOver ? "Lepaskan di sini" : "Pilih atau drag foto bukti"}
            </p>
            <p className="text-xs text-[#9CA3AF] text-center leading-relaxed">
              JPG, PNG, GIF, WebP — maks. {MAX_PROOF_SIZE_MB}MB
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={proofInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          id="proof-file-input"
        />
      </Card>

      {/* Proof Error */}
      {proofError && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 font-medium">{proofError}</p>
        </div>
      )}

      {/* Checkout Error */}
      {checkoutError && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 font-medium">{checkoutError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <motion.div
          whileHover={{ scale: proofFile ? 1.02 : 1 }}
          whileTap={{ scale: proofFile ? 0.97 : 1 }}
        >
          <Button
            id="cart-upload-proof-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || !proofFile}
            className="w-full h-14 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-xl shadow-green-600/20 flex items-center justify-center gap-2.5 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mengupload...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 shrink-0" />
                <span>Kirim Pesanan &amp; Upload Bukti</span>
                <ChevronRight className="w-4 h-4 opacity-80 shrink-0" />
              </>
            )}
          </Button>
        </motion.div>

        {!proofFile && (
          <p className="text-[11px] text-red-500 text-center font-medium">
            ⚠ Pilih foto bukti pembayaran terlebih dahulu
          </p>
        )}
      </div>
    </>
  );
}

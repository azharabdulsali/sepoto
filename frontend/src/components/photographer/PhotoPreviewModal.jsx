import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ProtectedPhoto from "../ProtectedPhoto";

export default function PhotoPreviewModal({ photo, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!photo) return null;

  const imgUrl =
    photo.watermarkedUrl || photo.watermarked_url || photo.originalUrl || "";
  const bibVal = photo.bibTags ?? photo.bib_tags ?? "";
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
        transition={{ duration: 0.3, ease: "easeOut" }}
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
            <Badge
              variant="outline"
              className="font-bib text-[10px] bg-white/10 text-white border-white/20"
            >
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
            <p className="text-[10px] font-bib uppercase tracking-widest text-gray-400">
              Status Harga Galeri
            </p>
            <p className="font-bib text-xl font-bold text-brand">
              {Number(priceVal) > 0
                ? `Rp ${Number(priceVal).toLocaleString("id-ID")}`
                : "Belum Diberi Harga (Rp 0)"}
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

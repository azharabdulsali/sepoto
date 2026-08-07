import React from "react";
import { motion } from "framer-motion";
import { Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "./cartUtils";

export default function CartItem({ photo, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="flex items-center gap-3.5 py-3 border-b border-[#F3F4F6] last:border-0 group"
    >
      <div className="w-16 h-20 rounded-xl overflow-hidden bg-[#F3F4F6] shrink-0 border border-[#E5E7EB]">
        <img
          src={photo.watermarkedUrl}
          alt={photo.originalFilename || photo.original_filename || `Foto #${photo.id}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4
          className="font-bold text-xs text-[#111827] truncate mb-0.5"
          title={photo.originalFilename || photo.original_filename || `Foto #${photo.id}`}
        >
          {photo.originalFilename || photo.original_filename || photo.title || photo.name || `Foto #${photo.id}`}
        </h4>

        <div className="flex items-center gap-1.5 mb-1">
          <Camera className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
          <span className="text-xs text-[#4B5563] font-medium truncate">
            {photo.photographerName ?? "Fotografer"}
          </span>
        </div>
        {photo.bibTags && (
          <Badge
            variant="secondary"
            className="font-bib text-[10px] text-brand bg-brand/10 mb-1 px-2 py-0.5"
          >
            BIB #{photo.bibTags}
          </Badge>
        )}
        <p className="text-sm font-bold text-brand">
          {formatRupiah(photo.price)}
        </p>
      </div>

      <Button
        id={`cart-remove-${photo.id}`}
        onClick={() => onRemove(photo.id)}
        variant="ghost"
        size="icon"
        className="shrink-0 w-8 h-8 rounded-lg text-[#9CA3AF] hover:text-red-500 hover:bg-red-50"
        aria-label={`Hapus foto #${photo.id}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

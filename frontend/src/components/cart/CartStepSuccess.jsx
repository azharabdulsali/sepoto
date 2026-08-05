import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CartStepSuccess({
  finalOrderNumber,
  orderNumber,
  whatsappUrl,
}) {
  const navigate = useNavigate();

  return (
    <div className="max-w-lg mx-auto px-4 py-12 flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="w-24 h-24 rounded-3xl bg-green-50 border-2 border-green-200 flex items-center justify-center mb-6 shadow-lg shadow-green-100"
      >
        <CheckCircle2 className="w-12 h-12 text-green-500" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Badge className="bg-green-100 text-green-700 border-green-200 font-bib uppercase tracking-widest text-[10px] px-3 py-1 mb-3">
          Pesanan Berhasil Dibuat
        </Badge>
        <h2 className="text-2xl font-bold text-[#111827] mb-2">
          Bukti Bayar Terkirim!
        </h2>
        <p className="text-sm text-[#4B5563] mb-2 leading-relaxed max-w-sm mx-auto">
          Pesanan Anda sedang menunggu verifikasi Admin. Anda akan menerima
          notifikasi setelah pembayaran dikonfirmasi.
        </p>
        <p className="font-bib text-xs text-[#9CA3AF] mb-8">
          Nomor Order:{" "}
          <strong className="text-[#4B5563]">
            {finalOrderNumber || orderNumber}
          </strong>
        </p>

        <div className="space-y-3 w-full max-w-xs mx-auto">
          {/* Opsional: Konfirmasi via WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="cart-whatsapp-confirm"
            className="w-full h-12 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm rounded-2xl shadow-lg shadow-green-500/20 flex flex-row items-center justify-center gap-2.5 px-4 transition-all"
          >
            <svg
              className="w-5 h-5 fill-current shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span className="whitespace-nowrap">Konfirmasi via WhatsApp</span>
          </a>

          <Button
            onClick={() => navigate("/orders")}
            id="cart-go-to-orders"
            className="w-full h-12 bg-brand hover:bg-[#C2410C] text-white font-bold text-sm rounded-2xl shadow-lg shadow-orange-600/20"
          >
            Lihat Status Pesanan
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <Link
            to="/gallery"
            className="block text-center text-xs text-[#9CA3AF] hover:text-[#4B5563] transition-colors py-2"
          >
            Kembali ke Galeri Foto
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

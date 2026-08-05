import React from "react";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "../../context/AuthContext";
import { formatRupiah } from "./adminUtils.js";

export default function OverviewTab({
  transactions = [],
  events = [],
  selectedEventFilter = "all",
  onEventFilterChange,
}) {
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const pending = transactions.filter((t) => t.status === "pending").length;
  const approved = transactions.filter((t) => t.status === "approved").length;
  const rejected = transactions.filter((t) => t.status === "rejected").length;
  const totalRevenue = transactions
    .filter((t) => t.status === "approved")
    .reduce((s, t) => s + t.total, 0);

  const stats = [
    {
      label: "Menunggu Verifikasi",
      value: pending,
      sub: "transaksi",
      cls: "bg-amber-50/80 border-amber-200",
      textCls: "text-amber-700",
    },
    {
      label: "Disetujui",
      value: approved,
      sub: "transaksi",
      cls: "bg-green-50/80 border-green-200",
      textCls: "text-green-700",
    },
    {
      label: "Ditolak",
      value: rejected,
      sub: "transaksi",
      cls: "bg-red-50/80 border-red-200",
      textCls: "text-red-600",
    },
    {
      label: "Total Pendapatan",
      value: formatRupiah(totalRevenue),
      sub: "dari order approved",
      cls: "bg-brand/5 border-brand/20",
      textCls: "text-brand",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Event Filter untuk Super Admin pada Overview */}
      {isSuperAdmin && events.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E5E7EB] rounded-2xl p-3.5 sm:px-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand shrink-0" />
            <span className="text-xs font-bold text-[#111827]">
              Filter Event Overview:
            </span>
          </div>
          <Select
            value={String(selectedEventFilter)}
            onValueChange={(val) =>
              onEventFilterChange && onEventFilterChange(val)
            }
          >
            <SelectTrigger className="!h-9 border-[#E5E7EB] rounded-xl text-xs bg-white font-medium w-full sm:w-[210px] shrink-0 shadow-xs">
              <SelectValue placeholder="Pilih Event...">
                {selectedEventFilter === "all"
                  ? "Semua Event"
                  : events.find(
                      (e) => String(e.id) === String(selectedEventFilter),
                    )?.title || "Pilih Event..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50">
              <SelectGroup>
                <SelectItem value="all">
                  Semua Event ({events.length})
                </SelectItem>
                {events.map((ev) => (
                  <SelectItem key={ev.id} value={String(ev.id)}>
                    {ev.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {stats.map(({ label, value, sub, cls, textCls }) => (
          <motion.div
            key={label}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <Card
              className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm ${cls}`}
            >
              <p
                className={`text-base sm:text-2xl font-bold font-bib ${textCls} truncate`}
              >
                {value}
              </p>
              <p className="text-xs font-bold text-[#111827] mt-0.5 truncate">
                {label}
              </p>
              <p className="text-[10px] sm:text-[11px] text-[#4B5563] mt-0.5 truncate">
                {sub}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-bold text-[#111827] mb-3">
          Menunggu Approval ({pending})
        </h3>
        {transactions.filter((t) => t.status === "pending").length === 0 ? (
          <Card className="p-8 text-center bg-white border-[#E5E7EB] rounded-2xl">
            <p className="text-sm text-[#4B5563]">
              Tidak ada transaksi yang menunggu verifikasi.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {transactions
              .filter((t) => t.status === "pending")
              .map((t) => (
                <Card
                  key={t.id}
                  className="bg-white border-[#E5E7EB] rounded-2xl p-4 flex flex-row items-center gap-3.5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#111827] truncate">
                      {t.userName}
                    </p>
                    <p className="font-bib text-xs text-[#4B5563] mt-0.5">
                      {t.orderNumber} · BIB #{t.bibNumber}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-brand font-bib">
                      {formatRupiah(t.total)}
                    </p>
                    <p className="text-[11px] text-[#4B5563]">
                      {Array.isArray(t.items) ? t.items.length : t.items || 0}{" "}
                      foto
                    </p>
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

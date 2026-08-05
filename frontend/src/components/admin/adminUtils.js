export const formatRupiah = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(v ?? 0);

export const formatRupiahInput = (val) => {
  if (val === null || val === undefined || val === "") return "";
  const cleanStr = String(val).replace(/\D/g, "");
  if (!cleanStr) return "";
  return new Intl.NumberFormat("id-ID").format(Number(cleanStr));
};

export const parseRupiahInput = (val) => {
  if (!val) return "";
  return String(val).replace(/\D/g, "");
};

export const STATUS_LABELS = {
  all: "Semua Status",
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

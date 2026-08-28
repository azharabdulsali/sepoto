export const WA_ADMIN_NUMBER = "08214689756";
export const MAX_PROOF_SIZE_MB = 5;
export const MAX_PROOF_SIZE_BYTES = MAX_PROOF_SIZE_MB * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount ?? 0);

export const formatWaNumberForUrl = (num) => {
  if (!num) return "628214689756";
  let cleaned = String(num).replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned || "628214689756";
};

export const buildWhatsAppUrl = ({
  orderNumber,
  userName,
  bibNumber,
  items = [],
  total = 0,
  waNumber,
}) => {
  const photoList =
    items && items.length > 0
      ? items
          .map((item, idx) => {
            const fileName =
              item.originalFilename ||
              item.original_filename ||
              item.filename ||
              `IMG_${item.id || item.photoId || idx + 1}.jpg`;
            return `${idx + 1}. ${fileName} (${formatRupiah(item.price)})`;
          })
          .join("\n")
      : "-";

  const message = [
    `*Konfirmasi Pembayaran Sepoto*`,
    ``,
    `*Nomor Order:* ${orderNumber}`,
    `*Nama:* ${userName}`,
    bibNumber ? `*Label:* ${bibNumber}` : "",
    ``,
    `*Daftar Foto yang Dibeli:*`,
    photoList,
    ``,
    `*Total Pembayaran:* ${formatRupiah(total)}`,
    ``,
    `_Bukti transfer sudah diupload. Mohon diverifikasi. Terima kasih!_`,
  ]
    .filter(Boolean)
    .join("\n");

  const finalWaNumber = formatWaNumberForUrl(waNumber || WA_ADMIN_NUMBER);

  return `https://wa.me/${finalWaNumber}?text=${encodeURIComponent(message)}`;
};

export const generateOrderNumberFallback = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `SEPOTO-${year}${month}${day}-0001`;
};

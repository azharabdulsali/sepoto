export const WA_ADMIN_NUMBER = "6281234567890";
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

export const buildWhatsAppUrl = ({
  orderNumber,
  userName,
  bibNumber,
  items = [],
  total = 0,
}) => {
  const photoList = items
    .map(
      (item, idx) =>
        `  ${idx + 1}. Foto ID #${item.id} (BIB: ${item.bibTags ?? "Umum"}) — ${formatRupiah(item.price)}`,
    )
    .join("\n");

  const message = [
    `🎉 *Konfirmasi Pembayaran Sepoto*`,
    ``,
    `📋 *Nomor Order:* ${orderNumber}`,
    `👤 *Nama:* ${userName}`,
    bibNumber ? `🏷️ *BIB:* #${bibNumber}` : "",
    ``,
    `📸 *Daftar Foto yang Dibeli:*`,
    photoList,
    ``,
    `💰 *Total Pembayaran:* ${formatRupiah(total)}`,
    ``,
    `_Bukti transfer sudah diupload. Mohon diverifikasi. Terima kasih!_`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WA_ADMIN_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const generateOrderNumberFallback = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `SEPOTO-${year}${month}${day}-0001`;
};

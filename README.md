# Sepoto 📷

**Sepoto** adalah aplikasi web galeri fotografi dan unduh digital yang dirancang khusus untuk *event* berdurasi singkat (seperti event event umum, wisuda, atau gathering) dengan dukungan *multi-event* bersamaan.

Aplikasi ini bertujuan untuk memudahkan fotografer mengunggah dan memberi harga pada karya mereka per event, memudahkan peserta (*user*) mencari foto pribadi berdasarkan Nomor Unik/Nama pada event yang diikutinya, serta menyediakan alur pembelian digital yang sederhana melalui QRIS statis dan konfirmasi manual via WhatsApp.

---

## 🌟 Fitur Utama

- **Multi-Role Access Control:** Mengelola 4 role: Super Admin, Event Admin, Fotografer, dan Peserta.
- **Multi-Event Scoping:**
  - **Super Admin**: Akses penuh lintas event dengan Filter Event Global di header dashboard.
  - **Event Admin**: Akses dan pengelolaan terkunci khusus untuk event miliknya (overview, verifikasi pembayaran, peserta, dan fotografer).
- **Per-Event Nomor Unik Uniqueness:** Keunikan nomor unik berlaku per event (`idx_users_unique_event_bib`), memungkinkan peserta di event berbeda menggunakan nomor unik yang sama.
- **Isolated Participant Gallery:** Galeri foto peserta secara otomatis menyesuaikan (*scoped*) khusus dengan event yang diikuti peserta.
- **Auto Watermarking:** Otomatis menambahkan watermark pada foto *preview* saat diunggah (menggunakan Node.js + Sharp).
- **Unduhan Aman:** File resolusi tinggi tanpa watermark disimpan secara privat di Cloudflare R2 dan hanya dapat diunduh setelah pembayaran disetujui.
- **Mobile-First Design:** Antarmuka galeri dan sistem checkout yang dioptimalkan untuk perangkat seluler.

---

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan struktur **Monorepo** dengan NPM Workspaces.

- **Frontend:** React.js, Vite, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express.js, Sharp (Image Processing)
- **Database:** PostgreSQL
- **Penyimpanan:** Cloudflare R2 (Object Storage)
- **Hosting:** VPS Hostinger

---

## 📂 Struktur Repositori & Dokumentasi

- `/frontend`: Berisi antarmuka pengguna berbasis React.
- `/backend`: Berisi API server berbasis Node.js/Express.

Dokumen panduan utama:
- [Product Requirement Document.md](Product%20Requirement%20Document.md) - Detail kebutuhan produk dan alur sistem.
- [ARCHITECTURE.md](ARCHITECTURE.md) - Panduan arsitektur sistem & hak akses.
- [DESIGN.md](DESIGN.md) - Panduan UI/UX dan sistem desain.
- [SCHEMA.md](SCHEMA.md) - Skema database PostgreSQL.
- [RULES.md](RULES.md) - Aturan standar koding dan keamanan.
- [AGENT.md](AGENT.md) - Panduan persona dan eksekusi AI.

---

## 🚀 Cara Menjalankan Secara Lokal (Development)

1. **Install dependensi:**
   ```bash
   npm install
   ```

2. **Jalankan aplikasi (Frontend + Backend):**
   ```bash
   npm run dev
   ```

   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:5000`

---

**Sepoto** © 2026.

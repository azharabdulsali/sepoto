# Sepoto 📷

**Sepoto** adalah aplikasi web galeri fotografi dan unduh digital yang dirancang khusus untuk *event* berdurasi singkat (1–2 hari, seperti lari maraton, wisuda, atau gathering) dengan kapasitas peserta maksimal sekitar 500 orang.

Aplikasi ini bertujuan untuk memudahkan fotografer mengunggah dan memberi harga pada karya mereka, memudahkan peserta (*user*) mencari foto pribadi berdasarkan Nomor BIB/Nama, serta menyediakan alur pembelian digital yang sederhana melalui QRIS statis dan konfirmasi manual via WhatsApp.

---

## 🌟 Fitur Utama

- **Multi-Role Access:** Terdiri dari Super Admin, Fotografer, dan User (Peserta).
- **Auto Watermarking:** Otomatis menambahkan watermark pada foto *preview* saat diunggah (menggunakan Node.js + Sharp).
- **Pencarian Cerdas:** Peserta dapat mencari foto mereka menggunakan Nomor BIB.
- **Pembelian & Checkout:** Sistem keranjang belanja (cart) dengan konfirmasi pembayaran statis QRIS yang diarahkan langsung ke WhatsApp Admin.
- **Unduhan Aman:** File resolusi tinggi tanpa watermark disimpan secara privat di Cloudflare R2 dan hanya dapat diunduh setelah pembayaran disetujui.
- **Mobile-First Design:** Antarmuka galeri dan sistem checkout yang dioptimalkan untuk perangkat seluler.

## 🛠️ Teknologi yang Digunakan

Proyek ini dibangun menggunakan struktur **Monorepo** dengan NPM Workspaces.

- **Frontend:** React.js, Vite, Tailwind CSS
- **Backend:** Node.js, Express.js, Sharp (Image Processing)
- **Database:** PostgreSQL
- **Penyimpanan:** Cloudflare R2 (Object Storage)
- **Hosting:** VPS Hostinger

---

## 📂 Struktur Repositori

Proyek ini dibagi menjadi dua bagian utama:
- `/frontend`: Berisi antarmuka pengguna berbasis React.
- `/backend`: Berisi API server berbasis Node.js/Express.

Terdapat juga berbagai dokumen panduan pengembangan di direktori utama:
- [Product Requirement Document.md](Product%20Requirement%20Document.md) - Detail kebutuhan produk dan alur sistem.
- [ARCHITECTURE.md](ARCHITECTURE.md) - Panduan arsitektur sistem.
- [DESIGN.md](DESIGN.md) - Panduan UI/UX dan estetika web.
- [SCHEMA.md](SCHEMA.md) - Skema database PostgreSQL.
- [RULES.md](RULES.md) - Aturan standar koding dan pengembangan.

---

## 🚀 Cara Menjalankan Secara Lokal (Development)

### Prasyarat
- Node.js (versi 18+)
- PostgreSQL (berjalan di lokal atau remote)
- Akun Cloudflare (untuk R2 Storage)

### Instalasi & Menjalankan

1. **Clone repository ini** (jika belum):
   ```bash
   git clone <repo-url>
   cd sepoto
   ```

2. **Install semua dependensi:**
   Karena menggunakan NPM Workspaces, perintah ini akan menginstal modul untuk frontend dan backend secara otomatis:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment:**
   - Duplikat `.env.example` menjadi `.env` di folder `backend/` (jika ada) dan isi kredensial database serta AWS/R2 Anda.

4. **Jalankan Aplikasi:**
   Perintah ini akan menjalankan backend (Nodemon) dan frontend (Vite) secara bersamaan:
   ```bash
   npm run dev
   ```

   - Frontend akan berjalan di: `http://localhost:5173`
   - Backend akan berjalan di: `http://localhost:5000` (tergantung konfigurasi port Anda)

---

**Sepoto** © 2024.

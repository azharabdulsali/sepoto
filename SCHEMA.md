# Database Schema: Sepoto

Dokumen ini mendefinisikan rancangan struktur basis data relasional menggunakan **PostgreSQL** untuk aplikasi **Sepoto**. 

---

## 1. Daftar Tabel (Tables)

### A. Tabel `events`
Menyimpan data *event* aktif maupun arsip event, termasuk konfigurasi dinamis (nama event, tanggal, dan QR Code pembayaran).
* `id` (SERIAL / PRIMARY KEY)
* `title` (VARCHAR(255) / NOT NULL) - Nama event (contoh: "Marathon Boyolali 2026")
* `event_date` (DATE / NOT NULL) - Tanggal pelaksanaan event
* `logo_url` (TEXT / NULL) - Tautan logo event di Cloudflare R2
* `qr_code_url` (TEXT / NOT NULL) - Tautan gambar QRIS statis pembayaran
* `is_active` (BOOLEAN / DEFAULT TRUE) - Status event yang sedang aktif
* `created_at` (TIMESTAMP / DEFAULT CURRENT_TIMESTAMP)

### B. Tabel `users`
Menyimpan akun seluruh pengguna sistem, mencakup **Super Admin**, **Event Admin**, **Fotografer**, dan **User/Peserta**.
* `id` (SERIAL / PRIMARY KEY)
* `event_id` (INT / FOREIGN KEY to `events.id` / ON DELETE SET NULL) - Relasi event khusus untuk `admin`, `photographer`, dan `user`
* `name` (VARCHAR(255) / NOT NULL) - Nama lengkap pengguna
* `username` (VARCHAR(100) / UNIQUE / NULL) - Username autentikasi (Wajib diisi untuk `super_admin`, `admin`, `photographer`)
* `password_hash` (TEXT / NULL) - Password terenkripsi bcrypt (Wajib diisi untuk `super_admin`, `admin`, `photographer`)
* `bib_number` (VARCHAR(50) / NULL) - Nomor dada peserta (Wajib diisi khusus untuk role `user`)
* `role` (VARCHAR(50) / NOT NULL) - Hak akses (`super_admin`, `admin`, `photographer`, `user`)
* `created_at` (TIMESTAMP / DEFAULT CURRENT_TIMESTAMP)

> *Indeks Keunikan:*
> `idx_users_unique_event_bib`: **UNIQUE INDEX ON `users(event_id, bib_number)` WHERE `bib_number IS NOT NULL AND role = 'user'`** (Memastikan Nomor BIB unik per event).

### C. Tabel `photos`
Menyimpan metadata foto yang diunggah oleh fotografer, beserta tautan ke Cloudflare R2 dan harga jualnya.
* `id` (SERIAL / PRIMARY KEY)
* `event_id` (INT / FOREIGN KEY to `events.id` / ON DELETE CASCADE) - Relasi ke event tempat foto diambil
* `photographer_id` (INT / FOREIGN KEY to `users.id` / ON DELETE CASCADE) - Akun fotografer yang mengunggah foto
* `original_url` (TEXT / NOT NULL) - Tautan file asli (clean) di Cloudflare R2 (Privat)
* `watermarked_url` (TEXT / NOT NULL) - Tautan file dengan watermark di Cloudflare R2 (Publik)
* `original_filename` (VARCHAR(255) / NULL) - Nama file asli saat diunggah
* `price` (DECIMAL(10, 2) / DEFAULT 0.00) - Harga jual foto
* `bib_tags` (VARCHAR(255) / NULL) - Tag nomor BIB terkait pada foto (opsional untuk pencarian)
* `orientation` (VARCHAR(20) / DEFAULT 'portrait') - Orientasi foto ('portrait' / 'landscape')
* `created_at` (TIMESTAMP / DEFAULT CURRENT_TIMESTAMP)

### D. Tabel `transactions`
Menyimpan data pesanan/pembelian foto yang dilakukan oleh *user* sebelum dan sesudah disetujui (*approved*).
* `id` (SERIAL / PRIMARY KEY)
* `order_number` (VARCHAR(100) / UNIQUE / NOT NULL) - Nomor order unik (contoh: `SEPOTO-20260801-XXXX`)
* `user_id` (INT / FOREIGN KEY to `users.id` / ON DELETE CASCADE) - Pembeli (peserta)
* `approved_by_id` (INT / FOREIGN KEY to `users.id` / ON DELETE SET NULL) - Admin (Super Admin / Event Admin) yang menyetujui atau menolak transaksi
* `total_amount` (DECIMAL(10, 2) / NOT NULL) - Total harga pembelian foto
* `status` (VARCHAR(50) / DEFAULT 'pending') - Status transaksi (`pending`, `approved`, `rejected`)
* `created_at` (TIMESTAMP / DEFAULT CURRENT_TIMESTAMP)

### E. Tabel `transaction_items`
Tabel relasi many-to-many untuk menghubungkan transaksi dengan foto-foto apa saja yang dibeli dalam satu keranjang (*cart*).
* `id` (SERIAL / PRIMARY KEY)
* `transaction_id` (INT / FOREIGN KEY to `transactions.id` / ON DELETE CASCADE)
* `photo_id` (INT / FOREIGN KEY to `photos.id` / ON DELETE CASCADE)
* `price_at_purchase` (DECIMAL(10, 2) / NOT NULL) - Harga foto saat transaksi dibuat

---

## 2. Relasi Antar Tabel (Entity Relationships)

```text
  [ events ] 1 --------< N [ users ] (Super Admin, Event Admin, Photographer, User)
      |                       ^
      | 1                     | (approved_by_id)
      |                       |
      +------------< N [ photos ] (Diunggah oleh photographer per event)
                          |
                          | 1
                          v N
                    [ transaction_items ] N >-------- 1 [ transactions ]
                                                                |
                                                                | N
                                                                v 1
                                                             [ users ] (Pembeli)
```
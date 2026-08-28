# System Architecture: Sepoto

Dokumen ini menjelaskan rancangan arsitektur perangkat lunak untuk aplikasi **Sepoto**, mencakup struktur direktori, komponen teknologi, alur data (*data flow*), serta mekanisme penyimpanan file dan keamanan *multi-event*.

---

## 1. Arsitektur Tingkat Tinggi (High-Level Architecture)

Aplikasi Sepoto menggunakan arsitektur **Client-Server terpisah** (*Decoupled Architecture*), di mana frontend berjalan di sisi klien (dioptimalkan secara *Mobile-First*) dan backend berdiri sendiri untuk menangani logika bisnis, otentikasi JWT berorientasi *role/event*, serta pemrosesan gambar ber-watermark.

```text
+-------------------------------------------------------------+
|                     CLIENT (Browser HP / Laptop)            |
|                  React (Vite) + Tailwind CSS                |
+-------------------------------------------------------------+
             |                               ^
             | HTTP Requests (REST API /     | JSON Responses /
             | Multipart Form Upload)        | Image URLs
             v                               |
+-------------------------------------------------------------+
|                  BACKEND SERVER (VPS Hostinger)             |
|                   Node.js + Express.js                      |
|  - Auth & Role Management (Super Admin, Admin, Photo, User) |
|  - Multi-Event Scoping & Data Isolation                     |
|  - Image Processing (Sharp Library - Watermarking)          |
+-------------------------------------------------------------+
             |                                      |
             v (S3 API SDK)                         v (SQL Queries)
+-------------------------------+      +----------------------+
|     CLOUDFLARE R2 STORAGE     |      |  POSTGRESQL DATABASE |
|  - /originals (Private)       |      |  - Events & Users    |
|  - /watermarked (Public)      |      |  - Photos per Event  |
|  - Proxy Express for DNS      |      |  - Transactions      |
+-------------------------------+      +----------------------+
```

---

## 2. Struktur Hak Akses (Role-Based Access Control)

1. **Super Admin**: Akses lintas event (`selectedEventFilter`).
2. **Event Admin**: Akses terkunci pada `req.user.eventId`.
3. **Photographer**: Upload foto ke `eventId` miliknya.
4. **User / Peserta**: Login Nama + Nomor Unik, melihat foto galeri `eventId` miliknya.

---

## 3. Alur Data & Keamanan Token

* **JWT Payload:** `{ id, role, name, eventId }`
* **Keunikan Nomor Unik:** Partial unique index PostgreSQL `idx_users_unique_event_bib` pada `(event_id, bib_number)`.
* **Proteksi File RAW:** Foto asli tanpa watermark disimpan privat di Cloudflare R2 dan diakses via presigned URL / ZIP generator setelah status transaksi `approved`.
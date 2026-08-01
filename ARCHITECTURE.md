# System Architecture: Sepoto

Dokumen ini menjelaskan rancangan arsitektur perangkat lunak untuk aplikasi **Sepoto**, mencakup struktur direktori, komponen teknologi, alur data (*data flow*), serta mekanisme penyimpanan file dan keamanan.

---

## 1. Arsitektur Tingkat Tinggi (High-Level Architecture)

Aplikasi Sepoto menggunakan arsitektur **Client-Server terpisah** (*Decoupled Architecture*), di mana frontend berjalan di sisi klien (dioptimalkan secara *Mobile-First*) dan backend berdiri sendiri untuk menangani logika bisnis serta pemrosesan gambar berat.

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
|  - Auth & Role Management                                   |
|  - Image Processing (Sharp Library - Watermarking)          |
+-------------------------------------------------------------+
             |                                      |
             v (S3 API SDK)                         v (SQL Queries)
+-------------------------------+      +----------------------+
|     CLOUDFLARE R2 STORAGE     |      |  POSTGRESQL DATABASE |
|  - /originals (Private)       |      |  - Users & Roles     |
|  - /watermarked (Public)      |      |  - Events & Pricing  |
+-------------------------------+      |  - Transactions      |
                                       +----------------------+
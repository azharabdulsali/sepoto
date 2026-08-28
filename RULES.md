# Development Rules & Guidelines: Sepoto

Dokumen ini berisi panduan, standar penulisan kode, serta aturan operasional yang wajib dipatuhi selama proses pengembangan aplikasi **Sepoto**.

---

## 1. Standar Penulisan Kode (Coding Standards)

### A. Umum & Bahasa
* **Bahasa Kode:** Gunakan bahasa **Inggris** untuk seluruh penulisan variabel, fungsi, nama komponen, tabel database, dan *endpoint* API.
* **Bahasa Komentar / Dokumen:** Gunakan bahasa **Indonesia** untuk dokumentasi internal, pesan *commit*, atau catatan komunikasi jika diperlukan.
* **Format Penulisan:** Terapkan standar modern ECMAScript (ES6+) untuk JavaScript, menggunakan `const` dan `let` (hindari `var`), serta manfaatkan *Arrow Functions* secara konsisten.

### B. Backend (Node.js & Express)
* **Struktur MVC:** Pisahkan logika bisnis dengan jelas:
  * `routes/`: Hanya mendaftarkan endpoint HTTP.
  * `controllers/`: Berisi logika pemrosesan data.
  * `middleware/`: Berisi fungsi validasi token JWT, role checking, dan *Multer upload*.
* **Error Handling:** Setiap blok asinkron (`async/await`) **wajib** dibungkus dengan `try...catch` atau menggunakan *error handler middleware* terpusat agar server Express tidak *crash*.
* **Environment Variables:** Data sensitif seperti kredensial Cloudflare R2, URL database, dan *Secret Key* **dilarang keras** di-*hardcode* di dalam kode; wajib dibaca melalui file `.env` menggunakan `dotenv`.

### C. Frontend (React & Tailwind CSS)
* **Komponen Modular:** Pecah komponen UI menjadi bagian-bagian kecil yang dapat digunakan kembali (*reusable components*).
* **Mobile-First CSS:** Mengutamakan penulisan kelas Tailwind untuk layar kecil terlebih dahulu, lalu gunakan *breakpoint* (`sm:`, `md:`, `lg:`) untuk layar yang lebih besar.
* **State Management:** Gunakan *React Context API* (`AuthContext`, `CartContext`) untuk mengelola status keranjang dan sesi pengguna yang sedang login.

---

## 2. Aturan Keamanan & Otorisasi Berbasis Peran (RBAC)

* **Multi-Role Access Control:**
  * System mendukung 4 role: `super_admin`, `admin` (Event Admin), `photographer`, dan `user` (Peserta).
  * **Event Admin** dibatasi (*scoped*) secara ketat pada `eventId` miliknya. Event Admin **tidak diizinkan** membuat/mengedit/menghapus akun Admin lain, dan **tidak dapat** menghapus akunnya sendiri.
  * **Fotografer** hanya dapat mengelola foto yang diunggah oleh akun mereka sendiri.
* **Proteksi File Asli (Clean Files):** 
  * File foto asli tanpa *watermark* yang disimpan di Cloudflare R2 tidak boleh memiliki tautan publik bebas. Tautan unduh hanya boleh dibuka aksesnya oleh backend setelah status transaksi di database bernilai `approved`.
* **Keunikan Nomor Unik Per Event:**
  * Nomor Unik unik berlaku per event menggunakan `idx_users_unique_event_bib` pada `(event_id, bib_number)`.

---

## 3. Konvensi Penamaan (Naming Conventions)

* **File & Folder (Frontend):** Gunakan *PascalCase* untuk komponen React (contoh: `PhotoGallery.jsx`, `AdminDashboard.jsx`) dan *camelCase* untuk fungsi atau file utilitas.
* **File & Folder (Backend):** Gunakan *camelCase* untuk file penunjang dan *kebab-case* untuk direktori jamak (contoh: `photoController.js`, `authMiddleware.js`).
* **Database (PostgreSQL):** Gunakan *snake_case* untuk nama tabel dan kolom (contoh: tabel `users`, kolom `watermarked_url`, kolom `bib_number`).

---

## 4. Git Commit & Workflow Rules

* **Pesan Commit yang Jelas:** Gunakan awalan deskriptif pada setiap pesan *commit* Git:
  * `feat: ...` (Menambahkan fitur baru)
  * `fix: ...` (Memperbaiki bug)
  * `style: ...` (Perubahan tampilan/styling CSS)
  * `refactor: ...` (Penyusunan ulang kode tanpa mengubah fungsionalitas)
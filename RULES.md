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
  * `middleware/`: Berisi fungsi validasi token, role checking, dan *Multer upload*.
* **Error Handling:** Setiap blok asinkron (`async/await`) **wajib** dibungkus dengan `try...catch` atau menggunakan *error handler middleware* terpusat agar server Express tidak *crash* saat terjadi kegagalan (misalnya saat koneksi Cloudflare R2 gagal).
* **Environment Variables:** Data sensitif seperti kredensial Cloudflare R2, URL database, dan *Secret Key* **dilarang keras** di-*hardcode* di dalam kode; wajib dibaca melalui file `.env` menggunakan `dotenv`.

### C. Frontend (React & Tailwind CSS)
* **Komponen Modular:** Pecah komponen UI menjadi bagian-bagian kecil yang dapat digunakan kembali (*reusable components*), misal: `PhotoCard.jsx`, `CartDrawer.jsx`, `Navbar.jsx`.
* **Mobile-First CSS:** Karena mayoritas pengguna mengakses via *smartphone*, utamakan penulisan kelas Tailwind untuk layar kecil terlebih dahulu, lalu gunakan *breakpoint* (contoh: `md:`, `lg:`) untuk layar yang lebih besar.
* **State Management:** Gunakan *React Context API* atau *Zustand/Pinia* sederhana untuk mengelola status keranjang belanja (*cart*) dan sesi pengguna yang sedang login.

---

## 2. Aturan Keamanan & Manajemen Data (Security Rules)

* **Proteksi File Asli (Clean Files):** 
  * File foto asli tanpa *watermark* yang disimpan di Cloudflare R2 tidak boleh memiliki tautan publik bebas. Tautan unduh hanya boleh diberikan atau dibuka aksesnya oleh backend setelah status transaksi di database bernilai `approved`.
* **Otorisasi Berbasis Peran (RBAC Middleware):**
  * Setiap *endpoint* API sensitif wajib melewati *middleware* pengecekan hak akses (`superadmin`, `photographer`, atau `user`).
  * Fotografer **tidak boleh** bisa menghapus atau mengubah harga foto milik fotografer lain (validasi `photographer_id` wajib dicocokkan di setiap *query update/delete*).
* **Sanitasi Input:** Seluruh data yang dikirimkan user melalui *form* (terutama saat login menggunakan Nama & Nomor BIB) wajib divalidasi untuk mencegah serangan *SQL Injection* atau *XSS*.

---

## 3. Konvensi Penamaan (Naming Conventions)

* **File & Folder (Frontend):** Gunakan *PascalCase* untuk komponen React (contoh: `PhotoGallery.jsx`, `AdminDashboard.jsx`) dan *camelCase* untuk fungsi atau file utilitas (contoh: `formatRupiah.js`, `apiClient.js`).
* **File & Folder (Backend):** Gunakan *camelCase* untuk file penunjang dan *kebab-case* untuk direktori jamak (contoh: `photoController.js`, `authMiddleware.js`).
* **Database (PostgreSQL):** Gunakan *snake_case* untuk nama tabel dan kolom (contoh: tabel `users`, kolom `watermarked_url`, kolom `bib_number`).

---

## 4. Git Commit & Workflow Rules

* **Pesan Commit yang Jelas:** Gunakan awalan deskriptif pada setiap pesan *commit* Git agar riwayat perubahan mudah dilacak:
  * `feat: ...` (Menambahkan fitur baru, misal: *feat: add watermark processing using sharp*)
  * `fix: ...` (Memperbaiki bug, misal: *fix: resolve cart total calculation error*)
  * `style: ...` (Perubahan tampilan/styling CSS)
  * `refactor: ...` (Penyusunan ulang kode tanpa mengubah fungsionalitas)
* **Branching (Opsional tapi Disarankan):** Hindari langsung bekerja di branch `main` untuk perubahan besar. Buat *branch* baru dengan format `feature/nama-fitur` atau `fix/nama-bug`.
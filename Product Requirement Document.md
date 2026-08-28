# Product Requirements Document (PRD): Sepoto
**Versi:** 1.2  
**Nama Produk:** Sepoto (Web-Based Event Photography & Digital Download Platform)  
**Tech Stack:** React (Frontend), Node.js/Express (Backend), PostgreSQL (Database), Cloudflare R2 (Storage), VPS Hostinger (Hosting)  
**Target Akses Utama:** Mobile-First (Responsif untuk Smartphone & Laptop)

---

## 1. Latar Belakang & Tujuan Produk
**Sepoto** adalah aplikasi web galeri fotografi dan unduh digital yang dirancang khusus untuk *event* berdurasi singkat (seperti event event umum, wisuda, atau gathering) dengan dukungan *multi-event* bersamaan. 

Aplikasi ini bertujuan untuk memudahkan fotografer mengunggah dan memberi harga pada karya mereka per event, memudahkan peserta (*user*) mencari foto pribadi berdasarkan Nomor Unik/Nama pada event yang diikutinya, serta menyediakan alur pembelian digital yang sederhana melalui QRIS statis dan konfirmasi manual via WhatsApp.

---

## 2. Hak Akses & Peran Pengguna (User Roles)

### A. Super Admin
* Mengelola seluruh data sistem secara lintas *multi-event*.
* Membuat, mengubah status aktif/nonaktif, dan memilih event yang dikelola.
* Membuat, mengedit, dan menghapus akun **Event Admin**, **Fotografer**, dan **Peserta**.
* Memiliki filter event global pada dashboard untuk memantau overview, transaksi, dan pengguna per event.

### B. Admin Event (Event Admin)
* Login ke dashboard admin dengan hak akses yang diisolasi (*scoped*) khusus untuk **1 event** miliknya.
* Melihat overview pendapatan, verifikasi pembayaran/transaksi, dan daftar peserta/fotografer khusus event miliknya.
* Menambahkan, mengedit, dan menghapus akun Peserta dan Fotografer khusus di event miliknya.
* Mengedit profil/akun miliknya sendiri (nama, username, password), namun tidak dapat menghapus akun miliknya sendiri atau mengelola admin lain.

### C. Fotografer
* Login ke dashboard khusus fotografer.
* Melakukan *bulk upload* foto ke event tempat akunnya terdaftar.
* Menetapkan harga secara satuan atau *multi-select* (massal) untuk beberapa foto sekaligus.
* Mengelola (melihat, menghapus, atau mengubah harga) **hanya** pada foto milik pribadinya sendiri.

### D. User / Peserta Event
* Login menggunakan kombinasi **Nama Lengkap** dan **Nomor Unik** (tanpa password).
* Menjelajahi galeri foto yang tersaring (*scoped*) khusus untuk event yang diikutinya.
* Melakukan *filtering* atau pencarian foto berdasarkan Nomor Unik.
* Memasukkan foto ke keranjang (*cart*) dan melakukan *checkout* QRIS statis dengan konfirmasi WhatsApp.
* Mengunduh foto versi asli beresolusi tinggi (tanpa *watermark*) setelah pembayaran disetujui (*approved*).

---

## 3. Fitur Utama & Alur Sistem (User Flows)

### 3.1 Manajemen Multi-Event & Konfigurasi (Super Admin)
* **Dynamic Event Management:** Super Admin dapat membuat banyak event (Nama Event, Tanggal, Logo, dan File QR Code QRIS pembayaran statis).
* **Global Event Scoping:** Super Admin dapat memilih event tertentu di header dashboard untuk memfilter Overview, Pembayaran, dan Pengguna secara instan.

### 3.2 Impor Data Peserta & Keunikan Nomor Unik Per Event
* **Per-Event Nomor Unik Uniqueness:** Nomor Unik unik berlaku **per event** (menggunakan *Partial Unique Index* PostgreSQL `(event_id, bib_number)`). Peserta di Event A dan Event B dapat menggunakan Nomor Unik yang sama (misal #101).
* **Import CSV/Excel:** Mengunggah daftar peserta (Nama Lengkap & Nomor Unik) untuk pembuatan akun otomatis.

### 3.3 Pengunggahan & Pemrosesan Foto (Fotografer)
* **Bulk Upload & Watermark Otomatis:** Pemrosesan gambar via Node.js + Sharp menghasilkan file asli privat di Cloudflare R2 dan versi watermarked publik.
* **Auto Event Scoped:** Foto yang diunggah otomatis dikaitkan dengan `event_id` milik fotografer.

### 3.4 Galeri Berbasis Event (Peserta)
* **Isolated Participant Gallery:** Saat peserta Event A login, galeri secara otomatis hanya menampilkan foto dari fotografer Event A.

### 3.5 Verifikasi Pembayaran & Unduh
* **Scoped Manual Approval:** Super Admin atau Event Admin memeriksa mutasi dan menyetujui transaksi sesuai event terkait.
* **Secure ZIP Download:** Membuka akses unduhan asli tanpa watermark setelah transaksi disetujui.
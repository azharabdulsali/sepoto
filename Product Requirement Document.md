# Product Requirements Document (PRD): Sepoto
**Versi:** 1.1  
**Nama Produk:** Sepoto (Web-Based Event Photography & Digital Download Platform)  
**Tech Stack:** React (Frontend), Node.js/Express (Backend), PostgreSQL (Database), Cloudflare R2 (Storage), VPS Hostinger (Hosting)  
**Target Akses Utama:** Mobile-First (Responsif untuk Smartphone & Laptop)

---

## 1. Latar Belakang & Tujuan Produk
**Sepoto** adalah aplikasi web galeri fotografi dan unduh digital yang dirancang khusus untuk *event* berdurasi singkat (1–2 hari, seperti lari maraton, wisuda, atau gathering) dengan kapasitas peserta maksimal sekitar 500 orang. 

Aplikasi ini bertujuan untuk memudahkan fotografer mengunggah dan memberi harga pada karya mereka, memudahkan peserta (*user*) mencari foto pribadi berdasarkan Nomor BIB/Nama, serta menyediakan alur pembelian digital yang sederhana melalui QRIS statis dan konfirmasi manual via WhatsApp.

---

## 2. Hak Akses & Peran Pengguna (User Roles)

### A. Super Admin
* Mengelola data keseluruhan sistem secara *multi-event*.
* Mengimpor data peserta secara massal menggunakan file CSV/Excel untuk pembuatan akun user otomatis.
* Membuat, mengubah, dan menghapus akun Fotografer (mendukung lebih dari 1 fotografer per *event*).
* Mengatur konfigurasi *event* aktif (Nama event, tanggal, logo, banner, dan QR statis pembayaran).
* Memverifikasi dan menyetujui (*approve*) konfirmasi pembayaran manual dari user.

### B. Fotografer
* Login ke dashboard khusus fotografer.
* Melakukan *bulk upload* foto hasil jepretannya ke *event* yang sedang aktif.
* Menetapkan harga secara satuan atau *multi-select* (massal) untuk beberapa foto sekaligus.
* Mengelola (melihat, menghapus, atau mengubah harga) **hanya** pada foto milik pribadinya sendiri.

### C. User / Peserta Event
* Login menggunakan kombinasi **Nama Lengkap** dan **Nomor BIB** (tanpa password).
* Menjelajahi galeri foto *event* yang dioptimalkan untuk perangkat seluler.
* Melakukan *filtering* atau pencarian foto berdasarkan Nomor BIB.
* Memasukkan foto ke keranjang (*cart*) atau langsung memilih foto untuk dibeli.
* Melakukan *checkout*, melihat QR statis, dan mengonfirmasi pembayaran secara langsung via tombol WhatsApp dengan templat pesan otomatis (berisi Nomor Order & daftar foto).
* Mengunduh foto versi asli beresolusi tinggi (tanpa *watermark*) setelah pembayaran disetujui (*approved*) oleh Super Admin.

---

## 3. Fitur Utama & Alur Sistem (User Flows)

### 3.1 Manajemen Event & Konfigurasi (Super Admin)
* **Dynamic Event Settings:** Super Admin dapat memperbarui detail *event* (Nama Event, Tanggal, Logo, dan File QR Code pembayaran statis) tanpa mengubah kode program.
* **Arsip Event:** Event yang sudah selesai dapat diarsipkan dan diganti dengan event baru.

### 3.2 Impor Data Peserta & Autentikasi (Super Admin & User)
* **Import CSV/Excel:** Super Admin mengunggah daftar peserta (Kolom: Nama Lengkap, Nomor BIB) untuk men-generate akun user secara instan.
* **Login User:** User masuk dengan mencocokkan Nama Lengkap dan Nomor BIB yang terdaftar di database.

### 3.3 Pengunggahan & Penetapan Harga Foto (Fotografer)
* **Bulk Upload:** Fotografer mengunggah banyak file gambar sekaligus ke server.
* **Watermark Otomatis:** Sistem (backend Node.js + *Sharp*) otomatis membuat 2 versi file: Versi asli (disimpan di Cloudflare R2 privat) dan Versi ber-watermark (ditampilkan di web).
* **Manajemen Harga:** Fotografer dapat mengatur harga per foto secara individual atau memilih beberapa foto sekaligus untuk diberi satu harga seragam.
* **Multi-Photographer Isolation:** Setiap fotografer memiliki area kerja yang terisolasi; mereka hanya dapat mengelola foto yang diunggah oleh akun mereka sendiri.

### 3.4 Galeri & Pencarian (User)
* **Auto-Filter BIB:** Saat user login, sistem otomatis menampilkan atau menandai foto yang sesuai dengan nomor BIB mereka.
* **Manual Search & Grid View:** User dapat menjelajahi galeri dalam bentuk *grid/masonry* dan melakukan pencarian berdasarkan nomor BIB atau filter fotografer.

### 3.5 Keranjang, Checkout, & Pembayaran Statis (User)
* **Cart System:** User dapat memilih 1 atau beberapa foto, memasukkannya ke keranjang, dan melihat total harga.
* **Static QR Checkout:** Saat checkout, sistem menampilkan QR Code pembayaran statis yang sama untuk semua transaksi.
* **WhatsApp Direct Confirmation:** Tombol konfirmasi mengarahkan user langsung ke WhatsApp Super Admin dengan templat pesan otomatis yang memuat **Nomor Order** dan **Daftar Foto yang dibeli**.

### 3.6 Verifikasi Pembayaran & Unduh (Super Admin & User)
* **Manual Approval:** Super Admin memeriksa mutasi pembayaran/bukti chat, lalu menekan tombol *Approve* di panel admin.
* **Secure Download:** Setelah status pesanan *Approved*, sistem membuka akses tautan unduh beresolusi tinggi (tanpa watermark) bagi user.

---

## 4. Kebutuhan Non-Fungsional & Teknis

* **Kapasitas Penyimpanan:** Dirancang untuk menampung estimasi total data 10 GB – 50 GB menggunakan **Cloudflare R2 Object Storage**.
* **Keamanan File:** File foto asli (*clean*) dipisahkan penyimpanannya dan hanya dapat diunduh oleh user yang transaksinya sudah disetujui.
* **Performa Server:** Backend menggunakan VPS Hostinger (KVM 1) untuk menghindari batasan *timeout* saat proses *bulk upload* dan kompresi *Sharp*.
* **Database:** PostgreSQL untuk menyimpan metadata foto, data user, relasi event, dan status transaksi.
* **Mobile-First Approach:**
  * **Responsif:** Tata letak antarmuka dioptimalkan untuk layar seluler (mayoritas akses peserta melalui HP).
  * **Galeri Responsif (Grid/Masonry):** Menyesuaikan ukuran layar (misalnya 2 kolom di HP, 4-5 kolom di laptop) agar nyaman digulir (*scrolling*).
  * **Thumb-Friendly UI:** Tombol aksi krusial (seperti Checkout atau Konfirmasi WhatsApp) ditempatkan di area bawah layar (*sticky bottom bar*) yang mudah dijangkau ibu jari pada perangkat seluler.
  * **Optimasi Thumbnail:** Ukuran gambar galeri dikompres secara optimal agar pemuatan halaman (*loading speed*) tetap cepat di jaringan seluler peserta.
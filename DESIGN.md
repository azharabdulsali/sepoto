---
version: "sepoto-auralis-theme-1.0"
name: "Sepoto x Auralis - Neural Design System"
description: "Design system yang diadaptasi dari Auralis Neural Audio Engine untuk memperkaya antarmuka web Sepoto dengan nuansa modern, kontras tinggi, elemen visual mendalam, dan estetika futuristik."
colors:
  primary: "#EA580C"
  secondary: "#FFFFFF"
  accent: "#FDBA74"
  background: "#FFFFFF"
  surface: "#191C21"
  text-primary: "#111827"
  text-secondary: "#4B5563"
  border: "#E5E7EB"
typography:
  display-lg:
    fontFamily: "Geist, sans-serif"
    fontSize: "64px"
    fontWeight: 500
    lineHeight: "1.04"
    letterSpacing: "0"
  body-md:
    fontFamily: "Geist, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "1.6"
  label-md:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "1.2"
spacing:
  base: "8px"
  gap: "16px"
  card-padding: "24px"
  section-padding: "80px"
rounded:
  card: "8px"
  control: "8px"
  pill: "9999px"
components:
  card:
    background: "Gunakan token surface (#191C21) dengan border tipis dan kedalaman bayangan HTML yang sesuai"
    radius: "Sesuaikan dengan token radius card (8px)"
  button:
    background: "Gunakan warna primary (#EA580C) atau accent (#FDBA74) untuk aksi utama"
    radius: "Gunakan radius control atau pill sesuai tombol pada referensi"
---

# Sepoto x Auralis - Theme & Design System

Source Reference: Neuform Featured Templates (Author: Meng To @mengto) - Auralis Neural Audio Engine.
Tags: modern, dark-surface, contrast, security, input, clean-cta.

## Overview

Panduan desain ini mengintegrasikan gaya visual futuristik berstandar tinggi dari Auralis ke dalam aplikasi web **Sepoto**. Cocok digunakan untuk memberikan pengalaman pengguna (_user experience_) yang elegan pada halaman login super admin, fotografer, maupun galeri interaktif peserta.

## Komposisi & Visual Hierarchy

Pertahankan hierarki visual yang kuat, kontras permukaan gelap (`surface #191C21`) dan latar bersih (`background #FFFFFF`), serta ritme seksi yang rapat namun tetap longgar di bagian _whitespace_.

## Warna (Palette)

- **Primary:** `#EA580C` (Oranye kuat untuk tombol aksi / CTA utama)
- **Secondary:** `#FFFFFF` (Putih bersih)
- **Accent:** `#FDBA74` (Aksen oranye terang untuk sorotan / hover state)
- **Background:** `#FFFFFF` (Latar belakang utama aplikasi)
- **Surface:** `#191C21` (Permukaan kartu, modal, atau panel gelap yang elegan)
- **Text Primary:** `#111827` (Teks utama yang tajam)
- **Text Secondary:** `#4B5563` (Teks pendukung / abu-abu)
- **Border:** `#E5E7EB` (Garis pembatas komponen tipis)

## Tipografi

- **Display / Judul Besar:** Menggunakan font **Geist** untuk kesan modern, bersih, dan berwibawa.
- **Body / Teks Biasa:** Menggunakan font **Geist** dengan ukuran dan ketebalan yang mudah dibaca (_readable_).
- **Label & Metadata (Nomor BIB / Token):** Menggunakan font monospaced **JetBrains Mono** untuk memberikan kesan presisi teknis (sangat cocok untuk nomor BIB peserta maraton di aplikasi Sepoto).

## Layout & Responsivitas (Mobile-First)

- Pertahankan konsistensi _spacing_ berbasis kelipatan 8px (`base: 8px`, `gap: 16px`).
- Karena Sepoto berfokus pada akses _mobile_ (peserta HP), pastikan kartu galeri dan tombol aksi (_checkout_ / _konfirmasi WhatsApp_) mudah dijangkau ibu jari (_thumb-friendly_).

## Motion & Interaksi

- Terapkan transisi yang mulus (_smooth ease_) pada hover tombol, perubahan state keranjang (_cart_), dan transisi buka-tutup modal.
- Hindari animasi berlebihan yang mengganggu performa pemuatan galeri foto.

## Guardrails (Aturan Ketat)

- Jangan merusak struktur kontras antara background terang dan permukaan surface gelap.
- Pertahankan sudut lengkung (_border-radius_) yang konsisten pada tombol dan kartu (`8px`).
- Jaga konsistensi penempatan tombol aksi utama menggunakan warna _primary_ (`#EA580C`).

---
version: "sepoto-auralis-theme-1.1"
name: "Sepoto x Auralis - Neural Design System"
description: "Design system yang diadaptasi dari Auralis Neural Audio Engine untuk memperkaya antarmuka web Sepoto dengan nuansa modern, kontras tinggi, elemen visual mendalam, dan estetika futuristik multi-event."
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
---

# Sepoto x Auralis - Theme & Design System

Panduan desain ini mengintegrasikan gaya visual futuristik berstandar tinggi dari Auralis ke dalam aplikasi web **Sepoto**.

## Multi-Event UI Components

1. **Badge Role Indicator**:
   - **Super Admin**: Badge warna ungu (`bg-purple-50 text-purple-700 border-purple-200`).
   - **Event Admin**: Badge warna amber (`bg-amber-50 text-amber-700 border-amber-200`).
   - **Fotografer**: Badge warna biru (`bg-blue-50 text-blue-700 border-blue-200`).
   - **Peserta**: Badge warna hijau emerald (`bg-emerald-50 text-emerald-700 border-emerald-200`).

2. **Global Event Selector Bar**:
   - Terletak di bawah header Admin Dashboard.
   - **Super Admin**: Dropdown Select pilihan event dinamis dengan teks nama event ramah pengguna.
   - **Event Admin**: Indikator terkunci (*read-only*) yang menampilkan nama event terdaftar milik admin.

3. **Responsive Mobile-First Grid**:
   - Galeri foto menyesuaikan perangkat (2 kolom di HP, 3-5 kolom di tablet/desktop).

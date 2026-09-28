# Visualisasi Data UAS - Project Rules & Guidelines

## 1. Visual Identity & Color Palette

### Category Colors (Hulu vs Hilir)
- **Hulu (Bahan Mentah / Raw / Upstream)**:
  - Base: `#E76F51` (Warm Terracotta)
  - Light: `#F4A261` (Sandy Orange)
  - Dark: `#B84326`
- **Olahan Dasar (Intermediate / Smelted)**:
  - Base: `#E9C46A` (Muted Gold / Brass)
  - Dark: `#C49B30`
- **Hilir (Nilai Tambah Tinggi / Manufactured / Downstream)**:
  - Base: `#2A9D8F` (Persian Green / Deep Teal)
  - Accent: `#457B9D` (Steel Blue)
  - Dark: `#1D6A60`

### Semantic & Background Colors
- **Background**:
  - Main Body: `#0F172A` (Deep Slate / Dark Mode First for data richness) or clean paper dark `#0A0F1D`
  - Card / Panel: `rgba(30, 41, 59, 0.75)` with `backdrop-filter: blur(12px)`
  - Border: `rgba(255, 255, 255, 0.08)`
- **Text**:
  - Primary: `#F8FAFC`
  - Muted: `#94A3B8`
  - Accent: `#38BDF8` (Sky Blue for interactive highlights)

## 2. Typography
- **Headings**: `'DM Sans'`, system fallback `sans-serif` (600, 700 weight)
- **Body / Narrative**: `'DM Sans'`, 400 weight, 1.65 line height, max width 68ch for readability
- **Numbers / Metrics / Chart Labels**: `'DM Mono'`, 500 weight with `font-variant-numeric: tabular-nums`

## 3. Narrative Voice & Tone
- **Tone**: Jurnalistik investigatif dan analitis berbasis data (data-driven investigative journalism), tidak partisan, obyektif, namun memantik refleksi kritis.
- **Bahasa**: Bahasa Indonesia formal-modern untuk narasi utama; istilah teknis ekonomi/perdagangan (FOB, CIF, HHI, YoY, HS Code) dapat dijelaskan dengan tooltip atau glosarium ringkas.

## 4. Visualization Conventions
- **Tooltips**: Harus responsif, menampilkan nama komoditas/sektor, kode HS / kode sektor, nilai (USD atau Rp), share (%), dan growth YoY.
- **Drill-down**: Visualisasi hierarki (treemap/sunburst) harus memiliki breadcrumb yang jelas dan tombol reset view.
- **Sankey**: Node flow harus memiliki batas minimum volume agar link yang terlalu kecil tidak membuat visual berantakan (kelompokkan ke kategori 'Lainnya').
- **Parallel Coordinates & PCA**: Wajib memiliki sinkronisasi seleksi (brushing & linking) antar visualisasi multivariat.

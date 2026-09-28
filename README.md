# Paradoks Hilirisasi: Menakar Transformasi Riil Struktur Ekonomi Indonesia

> **UAS Visualisasi Data**  
> Sebuah narasi visual berbasis jurnalisme data (*scrollytelling*) yang membedah dampak hilirisasi terhadap struktur ekonomi dan rantai nilai perdagangan Indonesia.

---

## 📌 Gambaran Proyek

Pemerintah gencar mempromosikan hilirisasi dan industrialisasi dengan larangan ekspor bahan mentah dan pembangunan smelter. Namun, apakah struktur ekonomi Indonesia benar-benar bergeser ke produk bernilai tambah tinggi?

Web story ini menjawab pertanyaan tersebut melalui 3 sudut pandang visualisasi interaktif:
1. **Hierarki Ekonomi (PDB ADHB & Pertumbuhan)**: *Treemap* dan *Sunburst* dengan fitur *click-to-zoom* dan *breadcrumb drill-down* (3 level hierarki lapangan usaha BPS 2020–2025).
2. **Aliran Perdagangan Global**: *Sankey Diagram* dan *Chord Diagram* memetakan arus komoditas HS 2-Digit ke 15 mitra dagang utama (2024 vs 2025).
3. **Profil Multivariat Komoditas**: *PCA Biplot*, *Clustered Heatmap*, dan *Parallel Coordinates* dengan *brushing & linking* terhubung untuk menganalisis 66 komoditas utama dan 8 variabel.

---

## 🗂️ Struktur Direktori Proyek

```
Visualisasi Data UAS/
├── Dataset/                          # 14 file data mentah (CSV, XLSX, PDF BPS)
│   ├── PDB ADHB 2020 - 2025.csv
│   ├── Laju PDB 2020 - 2025.csv
│   ├── ekspor_hs2_2024_2025.csv
│   ├── impor_hs2_2024_2025.csv
│   ├── EKSPOR 5 NEGARA *.xlsx (3 file)
│   └── IMPOR 5 NEGARA *.xlsx (3 file)
│
├── .agents/                          # Kustomisasi & panduan standar Antigravity
│   ├── skills/
│   │   └── d3-scrollytelling/
│   │       └── SKILL.md              # Best practice D3.js + Scrollama
│   └── rules/
│       └── visdata-rules.md          # Palet warna, tipografi, dan tone editorial
│
├── src/                              # Source code aplikasi web
│   ├── index.html                    # Entry point web story
│   ├── css/
│   │   ├── base.css                  # Token desain, reset, dan tema Slate gelap
│   │   ├── story.css                 # Tata letak Scrollytelling & kartu narasi
│   │   └── charts.css                # Gaya visual komponen D3, tooltip, & legenda
│   ├── js/
│   │   ├── main.js                   # Orkestrator Scrollama & scene manager
│   │   ├── data-loader.js            # Loader data JSON asinkron
│   │   ├── scene-intro.js            # Scene 0: Hook metrik paradoks
│   │   ├── scene-hierarchy.js        # Scene 1: Treemap + Sunburst PDB
│   │   ├── scene-flow.js             # Scene 2: Sankey + Chord aliran dagang
│   │   ├── scene-multivariate.js     # Scene 3: PCA + Parallel Coordinates
│   │   └── utils/
│   │       ├── color-scale.js        # Skala warna kategori (Hulu, Olahan, Hilir)
│   │       ├── tooltip.js            # Tooltip singleton interaktif
│   │       └── responsive.js         # ResizeObserver & debouncing
│   └── data/                         # Data terproses (JSON)
│       ├── pdb-hierarchy.json
│       ├── trade-flow.json
│       ├── commodity-profile.json
│       └── hs2-classification.json
│
├── scripts/
│   ├── preprocess.js                 # Pipeline pemrosesan data mentah ke JSON
│   └── build.js                      # Sinkronisasi build ke folder docs/
│
├── docs/                             # Direktori publikasi GitHub Pages
├── package.json
└── README.md
```

---

## 🚀 Cara Menjalankan

### 1. Prasyarat
- [Node.js](https://nodejs.org/) (versi 18 ke atas)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Pemrosesan Data Mentah ke JSON
Jika ingin memperbarui data hasil ekstraksi dari folder `Dataset/`:
```bash
npm run preprocess
```

### 4. Menjalankan Server Lokal
```bash
npm start
```
Buka browser di `http://localhost:3000`.

### 5. Build untuk GitHub Pages
```bash
npm run build
```
Hasil build siap disajikan melalui folder `docs/`.

---

## 📊 Teknologi yang Digunakan
- **Layout & Styling**: HTML5 Semantik, Vanilla CSS3 (Custom Properties & Modern Grid)
- **Visualisasi Data**: [D3.js v7](https://d3js.org/) + [d3-sankey](https://github.com/d3/d3-sankey)
- **Scrollytelling**: [Scrollama.js](https://github.com/russellsamora/scrollama) (IntersectionObserver)
- **Pengolahan Data**: Node.js + [SheetJS (xlsx)](https://docs.sheetjs.com/)
- **Tipografi**: DM Sans & DM Mono (Google Fonts)

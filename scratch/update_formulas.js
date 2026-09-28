import fs from 'fs';
import katex from 'katex';

function k(tex, display = false) {
  return katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false
  });
}

// Generate KaTeX fragments
const hhiDisplay = k('HHI = \\sum_{i=1}^{n} s_i^2 = \\sum_{i=1}^{n} \\left( \\frac{X_i}{\\sum_{k=1}^n X_k} \\times 100 \\right)^2', true);
const s_i = k('s_i');
const X_i = k('X_i');
const n_sym = k('n');
const hhiGt = k('HHI > 2.500');

const leontiefDisplay = k('X = (I - A)^{-1} Y = L \\cdot Y', true);
const X_sym = k('X');
const A_sym = k('A');
const L_sym = k('L');
const Y_sym = k('Y');
const a_ij = k('a_{ij} = x_{ij} / X_j');
const l_ij = k('L = [l_{ij}]');
const bl_eq = k('BL_j = \\frac{\\sum_{i=1}^n l_{ij}}{\\bar{L}}', false);
const fl_eq = k('FL_i = \\frac{\\sum_{j=1}^n l_{ij}}{\\bar{L}}', false);
const l_bar = k('\\bar{L} = \\frac{1}{n} \\sum_{i=1}^n \\sum_{j=1}^n l_{ij}', false);

// Build Row 4 HTML
const row4Formula = `                  <div class="math-formula-box">
                    <div class="math-formula-header">
                      <span class="math-formula-tag">Persamaan Konsentrasi Pasar</span>
                      <span class="math-formula-source">Metode Standar US DOJ / FTC</span>
                    </div>

                    <div class="math-display-card">
                      ${hhiDisplay}
                    </div>

                    <div class="math-legend-grid">
                      <span class="math-sym">${s_i}</span>
                      <span class="math-sep">:</span>
                      <span class="math-desc">Pangsa pasar ekspor komoditas ke negara mitra ke-<em>i</em> (skala persentase 0&ndash;100)</span>

                      <span class="math-sym">${X_i}</span>
                      <span class="math-sep">:</span>
                      <span class="math-desc">Nilai transaksi ekspor riil komoditas ke negara tujuan <em>i</em> (USD FOB)</span>

                      <span class="math-sym">${n_sym}</span>
                      <span class="math-sep">:</span>
                      <span class="math-desc">Jumlah total seluruh negara mitra dagang tujuan ekspor</span>
                    </div>

                    <div class="math-badge-threshold">
                      <div class="math-threshold-badge">Ambang Risiko Monopsoni</div>
                      <div class="math-threshold-desc">
                        Nilai ${hhiGt} mengindikasikan pasar tujuan sangat terkonsentrasi pada pembeli tunggal.
                      </div>
                    </div>
                  </div>`;

// Build Row 5 HTML
const row5Formula = `                  <div class="math-formula-box">
                    <div class="math-formula-header">
                      <span class="math-formula-tag">Sistem Keseimbangan Antar-Industri</span>
                      <span class="math-formula-source">Model Input-Output Leontief (185 Sektor)</span>
                    </div>

                    <div class="math-display-card">
                      ${leontiefDisplay}
                    </div>

                    <div class="math-legend-grid">
                      <span class="math-sym">${X_sym}</span>
                      <span class="math-sep">:</span>
                      <span class="math-desc">Vektor kolom total output perekonomian nasional (<em>n</em> &times; 1)</span>

                      <span class="math-sym">${A_sym}</span>
                      <span class="math-sep">:</span>
                      <span class="math-desc">Matriks koefisien input teknologi (${a_ij})</span>

                      <span class="math-sym">${L_sym}</span>
                      <span class="math-sep">:</span>
                      <span class="math-desc">Matriks Pengganda Kebalikan Leontief (${l_ij})</span>

                      <span class="math-sym">${Y_sym}</span>
                      <span class="math-sep">:</span>
                      <span class="math-desc">Vektor permintaan akhir domestik dan ekspor neto (<em>n</em> &times; 1)</span>
                    </div>

                    <div class="math-linkage-grid">
                      <div class="math-linkage-card">
                        <div class="math-linkage-header">
                          <span class="math-linkage-name">Daya Penyebaran</span>
                          <span class="math-linkage-pill">Backward Linkage</span>
                        </div>
                        <div class="math-linkage-eq-box">
                          ${bl_eq}
                        </div>
                        <div class="math-linkage-note">
                          Mengukur efek multiplikasi tarikan ke sektor hulu pemasok domestik. Nilai &gt; 1 mencerminkan sektor penghela ekonomi.
                        </div>
                      </div>

                      <div class="math-linkage-card">
                        <div class="math-linkage-header">
                          <span class="math-linkage-name">Derajat Kepekaan</span>
                          <span class="math-linkage-pill">Forward Linkage</span>
                        </div>
                        <div class="math-linkage-eq-box">
                          ${fl_eq}
                        </div>
                        <div class="math-linkage-note">
                          Mengukur sensitivitas dorongan ke sektor hilir pengguna bahan baku saat ekonomi tumbuh. Nilai &gt; 1 mencerminkan sektor pendorong strategis.
                        </div>
                      </div>
                    </div>

                    <div class="math-formula-footer-note">
                      <span class="math-footer-label">Basis Normalisasi:</span>
                      <span>${l_bar} (rata-rata seluruh elemen pengganda matriks Leontief).</span>
                    </div>
                  </div>`;

// Read index.html
let html = fs.readFileSync('src/index.html', 'utf8');

// Replace Row 4 and Row 5 inside index.html
// Let's locate the <tr> for HHI and Input-Output
const hhiRegex = /<tr>\s*<td>\s*<div class="spec-param-title">Indeks Konsentrasi Pasar \(HHI\)[\s\S]*?<\/tr>/;
const ioRegex = /<tr>\s*<td>\s*<div class="spec-param-title">Matriks Keterkaitan Input-Output[\s\S]*?<\/tr>/;

const newRow4 = `<tr>
                <td>
                  <div class="spec-param-title">Indeks Konsentrasi Pasar (HHI)</div>
                  <span class="spec-tag">Herfindahl-Hirschman Index</span>
                </td>
                <td>Analisis Olahan Data Transaksi Ekspor BPS</td>
                <td>Tujuan Ekspor per Kode HS 2-Digit</td>
                <td>
${row4Formula}
                </td>
                <td>Tercantum dalam JSON</td>
              </tr>`;

const newRow5 = `<tr>
                <td>
                  <div class="spec-param-title">Matriks Keterkaitan Input-Output</div>
                  <span class="spec-tag">Model Terbuka Leontief</span>
                </td>
                <td>BPS Tabel Input-Output Indonesia Pemutakhiran 2021-2025</td>
                <td>185 Sektor Transaksi Domestik</td>
                <td>
${row5Formula}
                </td>
                <td>BPS Official Publication</td>
              </tr>`;

if (!hhiRegex.test(html)) {
  console.error('Failed to match HHI row!');
  process.exit(1);
}
if (!ioRegex.test(html)) {
  console.error('Failed to match IO row!');
  process.exit(1);
}

html = html.replace(hhiRegex, newRow4);
html = html.replace(ioRegex, newRow5);

fs.writeFileSync('src/index.html', html, 'utf8');
console.log('Successfully updated src/index.html with pre-rendered KaTeX formulas!');

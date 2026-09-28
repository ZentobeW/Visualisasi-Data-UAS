import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const DATASET_DIR = path.resolve('Dataset');

console.log('=== 1. PDB ADHB ROWS ===');
const adhbRaw = fs.readFileSync(path.join(DATASET_DIR, 'PDB ADHB 2020 - 2025.csv'), 'utf-8');
const adhbLines = adhbRaw.split(/\r?\n/).filter(Boolean);
adhbLines.forEach((l, i) => {
  if (i >= 4) {
    // parse first column
    const match = l.match(/^(".*?"|[^,]+)/);
    const col0 = match ? match[1].replace(/^"|"$/g, '').trim() : '';
    // parse 2025 Tahunan (last column)
    const cols = l.split(',');
    const val2025 = cols[cols.length - 1];
    console.log(`[${i}] "${col0}" -> 2025: ${val2025}`);
  }
});

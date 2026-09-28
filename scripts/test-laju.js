import fs from 'fs';
import path from 'path';

const DATASET_DIR = path.resolve('Dataset');
const lajuRaw = fs.readFileSync(path.join(DATASET_DIR, 'Laju PDB 2020 - 2025.csv'), 'utf-8');
const lajuLines = lajuRaw.split(/\r?\n/).filter(Boolean);

console.log('Laju header row 2:', lajuLines[1]?.slice(0, 150));
console.log('Laju header row 3:', lajuLines[2]?.slice(0, 150));
console.log('Laju header row 4:', lajuLines[3]?.slice(0, 150));

// Let's inspect Sektor C (Industri Pengolahan) row:
const rowC = lajuLines.find(l => l.includes('Industri Pengolahan') && !l.includes('Non Migas') && !l.includes('Batubara'));
console.log('\nRow C:');
const colsC = rowC.split(',');
console.log('Length of cols:', colsC.length);
console.log('Last 10 values:', colsC.slice(-10));

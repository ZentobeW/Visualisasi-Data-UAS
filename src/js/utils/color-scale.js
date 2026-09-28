/**
 * Color Scales & Palettes for Visualizations
 * Tailored for Financial Times / Bloomberg Editorial Journalism (Light Paper Substrate)
 */

export const CATEGORY_COLORS = {
  hulu: '#C2410C',         // Terracotta Rust (Raw/Upstream Mining)
  olahan: '#D97706',       // Warm Amber / Ochre (First-Stage Smelted NPI/FeNi)
  hilir: '#1E40AF',        // Deep Financial Blue / Cobalt (Value-Added / Manufactured)
  jasa: '#475569',         // Slate Charcoal (Services & Logistics)
  lainnya: '#94A3B8'       // Muted Gray (Others)
};

export const CATEGORY_LABELS = {
  hulu: 'Bahan Mentah (Hulu)',
  olahan: 'Olahan Dasar / Smelter',
  hilir: 'Produk Jadi / Bernilai Tambah (Hilir)',
  jasa: 'Jasa & Lainnya',
  lainnya: 'Lainnya'
};

/**
 * Diverging scale for Growth YoY (-20% to +20%) on light background
 * Crimson (negative) -> Neutral Warm Gray (zero) -> Cobalt/Teal/Emerald (positive)
 */
export function getGrowthColor(rate) {
  if (rate === null || rate === undefined || isNaN(rate)) return '#94A3B8';
  if (rate < -5) return '#DC2626';      // Deep Crimson (Contraction > 5%)
  if (rate < 0) return '#F87171';       // Soft Red (Mild Contraction)
  if (rate === 0) return '#9CA3AF';     // Neutral Slate
  if (rate < 5) return '#3B82F6';       // Cobalt Blue (Moderate Growth 0-5%)
  if (rate < 15) return '#0D9488';      // Deep Teal (Strong Growth 5-15%)
  return '#059669';                     // Deep Emerald (Boom > 15%)
}

/**
 * Returns commodity category color based on classification
 */
export function getCommodityColor(category) {
  const key = (category || '').toLowerCase().trim();
  if (key.includes('hulu') || key.includes('raw') || key.includes('mentah') || key.includes('tambang')) {
    return CATEGORY_COLORS.hulu;
  }
  if (key.includes('olahan') || key.includes('smelter') || key.includes('dasar') || key.includes('logam')) {
    return CATEGORY_COLORS.olahan;
  }
  if (key.includes('hilir') || key.includes('manufactured') || key.includes('jadi') || key.includes('mesin')) {
    return CATEGORY_COLORS.hilir;
  }
  if (key.includes('jasa') || key.includes('logistik')) {
    return CATEGORY_COLORS.jasa;
  }
  return CATEGORY_COLORS.lainnya;
}

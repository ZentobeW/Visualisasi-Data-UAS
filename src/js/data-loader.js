/**
 * Data Loader Module
 * Loads preprocessed JSON data for all scenes:
 * - PDB Hierarchy & Growth (Scene 1)
 * - Trade Flows / Sankey (Scene 2)
 * - Multivariate Commodity Profiles & PCA (Scene 3)
 */

export class DataLoader {
  constructor(basePath = './data') {
    this.basePath = basePath;
    this.cache = {};
  }

  async loadPdbHierarchy() {
    if (this.cache.pdbHierarchy) return this.cache.pdbHierarchy;
    try {
      const res = await fetch(`${this.basePath}/pdb-hierarchy.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.cache.pdbHierarchy = await res.json();
      return this.cache.pdbHierarchy;
    } catch (err) {
      console.warn('PDB Hierarchy not loaded yet, using placeholder structure:', err);
      return null;
    }
  }

  async loadTradeFlow() {
    if (this.cache.tradeFlow) return this.cache.tradeFlow;
    try {
      const res = await fetch(`${this.basePath}/trade-flow.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.cache.tradeFlow = await res.json();
      return this.cache.tradeFlow;
    } catch (err) {
      console.warn('Trade flow data not loaded yet:', err);
      return null;
    }
  }

  async loadCommodityProfile() {
    if (this.cache.commodityProfile) return this.cache.commodityProfile;
    try {
      const res = await fetch(`${this.basePath}/commodity-profile.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.cache.commodityProfile = await res.json();
      return this.cache.commodityProfile;
    } catch (err) {
      console.warn('Commodity profile not loaded yet:', err);
      return null;
    }
  }

  async loadAll() {
    const [pdb, trade, commodities] = await Promise.all([
      this.loadPdbHierarchy(),
      this.loadTradeFlow(),
      this.loadCommodityProfile()
    ]);
    return { pdb, trade, commodities };
  }
}

export const dataLoader = new DataLoader();

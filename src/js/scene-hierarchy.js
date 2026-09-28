/**
 * Scene 1: Hierarki Ekonomi (PDB ADHB & Pertumbuhan)
 * Visualisasi: Treemap & Sunburst dengan Click-to-Zoom & Interactive Breadcrumbs
 * Data: PDB ADHB 2020-2025 (BPS 17 Sektor Utama & Subsektor Riil)
 */

import { getGrowthColor } from './utils/color-scale.js';
import { tooltip } from './utils/tooltip.js';
import { getContainerDimensions } from './utils/responsive.js';

export class SceneHierarchy {
  constructor(containerId = 'hierarchy-chart-container') {
    this.containerId = containerId;
    this.container = null;
    this.svg = null;
    this.data = null;
    this.currentView = 'treemap'; // 'treemap' | 'sunburst'
    this.rootNode = null;
    this.currentNode = null;
    this.breadcrumbContainer = null;
    this.highlightedSubsector = null;
  }

  async init(data) {
    this.data = data;
    this.container = document.getElementById(this.containerId);
    this.breadcrumbContainer = document.getElementById('hierarchy-breadcrumb');
    if (!this.container || !this.data) return;

    this.buildHierarchy();
    this.render();
    this.updateBreadcrumbs();
  }

  buildHierarchy() {
    // CRITICAL: Only sum leaf nodes so non-leaf aggregates are not doubled/tripled!
    this.rootNode = d3.hierarchy(this.data)
      .sum(d => (d.children && d.children.length > 0) ? 0 : (d.value || 0))
      .sort((a, b) => b.value - a.value);

    this.currentNode = this.rootNode;
  }

  getDisplayRoot() {
    if (!this.currentNode || this.currentNode === this.rootNode) {
      return this.rootNode;
    }

    // Create a localized hierarchy with depth = 0 so D3's treemap & partition algorithms
    // compute valid, within-bounds pixel and radial coordinates without NaN or scale overflow.
    const localRoot = d3.hierarchy(this.currentNode.data)
      .sum(d => (d.children && d.children.length > 0) ? 0 : (d.value || 0))
      .sort((a, b) => b.value - a.value);

    // Map each local node to its original counterpart in the master tree so click-to-zoom and breadcrumbs work
    localRoot.each(localNode => {
      let match = null;
      this.currentNode.each(orig => {
        if (orig.data === localNode.data) match = orig;
      });
      localNode._masterNode = match || this.currentNode;
    });

    return localRoot;
  }

  render() {
    if (!this.container || !this.currentNode) return;
    this.container.innerHTML = '';

    const { width, height } = getContainerDimensions(this.container);

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('role', 'img')
      .attr('aria-label', 'Visualisasi Hierarki PDB Lapangan Usaha BPS');

    if (this.currentView === 'treemap') {
      this.renderTreemap(width, height);
    } else {
      this.renderSunburst(width, height);
    }
  }

  renderTreemap(width, height) {
    const displayRoot = this.getDisplayRoot();
    const isZoomed = (this.currentNode !== this.rootNode);

    // Layout hierarchy from localized display root (guaranteed depth = 0, no NaN)
    const treemapLayout = d3.treemap()
      .size([width, height])
      .paddingTop(28)
      .paddingInner(3)
      .paddingOuter(3)
      .round(true);

    treemapLayout(displayRoot);

    const g = this.svg.append('g').attr('class', 'treemap-group');

    // Context Header Banner inside graphic
    const headerG = g.append('g').attr('class', 'treemap-header-banner');
    headerG.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', 24)
      .attr('fill', 'var(--bg-subtle)')
      .attr('stroke', 'var(--border-hairline)');

    headerG.append('text')
      .attr('x', 10)
      .attr('y', 16)
      .attr('fill', 'var(--text-primary)')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)')
      .text(`${displayRoot.data.name} — Rp ${(displayRoot.value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Triliun`);

    headerG.append('text')
      .attr('x', width - 10)
      .attr('y', 16)
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--text-muted)')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-mono)')
      .text(isZoomed ? 'Klik "Reset" di atas untuk kembali' : 'Klik kotak dengan panah untuk rincian subsektor');

    const children = displayRoot.children || [];
    if (children.length === 0) {
      g.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--text-secondary)')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-size', '13px')
        .text('Tingkat terdalam subsektor tercapai.');
      return;
    }

    const cellGroups = g.selectAll('g.treemap-cell')
      .data(children)
      .join('g')
      .attr('class', 'treemap-cell')
      .attr('transform', d => `translate(${d.x0},${d.y0})`);

    // Rectangles
    cellGroups.append('rect')
      .attr('class', 'treemap-node')
      .attr('width', d => Math.max(0, d.x1 - d.x0))
      .attr('height', d => Math.max(0, d.y1 - d.y0))
      .attr('fill', d => getGrowthColor(d.data.growth))
      .attr('rx', 3)
      .attr('stroke', d => {
        if (this.highlightedSubsector && d.data.name.toLowerCase().includes(this.highlightedSubsector)) {
          return '#F59E0B';
        }
        return 'var(--bg-surface)';
      })
      .attr('stroke-width', d => {
        if (this.highlightedSubsector && d.data.name.toLowerCase().includes(this.highlightedSubsector)) {
          return 3.5;
        }
        return 1.5;
      })
      .on('mouseenter', (event, d) => {
        const growthVal = typeof d.data.growth === 'number' ? d.data.growth : 0;
        const growthColor = getGrowthColor(growthVal);
        const totalRef = this.rootNode.value || 1;
        const parentRef = displayRoot.value || 1;
        const natShare = ((d.value / totalRef) * 100).toFixed(1);
        const localShare = ((d.value / parentRef) * 100).toFixed(1);

        tooltip.show(event, `
          <div class="tooltip-header">
            <div class="tooltip-title">${d.data.name}</div>
            <div class="tooltip-category" style="background: var(--bg-sunken); color: var(--color-cobalt);">
              ${d.children ? 'Sektor Utama' : 'Subsektor'} &bull; ${natShare}% PDB Nasional
            </div>
          </div>
          <div class="tooltip-row">
            <span>Nilai Nominal (ADHB):</span>
            <span class="tooltip-value">Rp ${(d.value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Triliun</span>
          </div>
          <div class="tooltip-row">
            <span>Pangsa thd Kategori:</span>
            <span class="tooltip-value">${localShare}%</span>
          </div>
          <div class="tooltip-row">
            <span>Pertumbuhan YoY:</span>
            <span class="tooltip-value" style="color: ${growthColor}; font-weight: 700;">
              ${growthVal > 0 ? '+' : ''}${growthVal.toFixed(2)}%
            </span>
          </div>
          ${d.children && d.children.length > 0 ? '<div class="tooltip-row" style="font-size:0.75rem; color:var(--color-cobalt); margin-top:8px; font-weight:700;">↳ Klik kotak untuk telusuri 16 subsektor</div>' : ''}
        `);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseleave', () => tooltip.hide())
      .on('click', (event, d) => {
        if (d.children && d.children.length > 0) {
          tooltip.hide();
          const target = d._masterNode || d;
          this.zoom(target);
        }
      });

    // Smart Text Placement inside cells
    cellGroups.each(function(d) {
      const boxW = d.x1 - d.x0;
      const boxH = d.y1 - d.y0;
      if (boxW < 55 || boxH < 28) return;

      const cell = d3.select(this);
      const hasChildren = (d.children && d.children.length > 0);

      // Determine text color based on background luminance
      const growthVal = typeof d.data.growth === 'number' ? d.data.growth : 0;
      const isNegative = growthVal < 0;
      const textColor = isNegative ? '#FFFFFF' : '#FFFFFF';

      // Truncate title
      const approxCharCapacity = Math.floor((boxW - 12) / 6.8);
      let displayName = d.data.name;
      if (displayName.length > approxCharCapacity) {
        displayName = displayName.substring(0, Math.max(4, approxCharCapacity - 2)) + '…';
      }

      cell.append('text')
        .attr('class', 'treemap-label')
        .attr('x', 7)
        .attr('y', 16)
        .attr('fill', textColor)
        .text(displayName);

      // Sub-label for value and growth
      if (boxH >= 46 && boxW >= 70) {
        const valTrillion = (d.value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 });
        const growthFormatted = `${growthVal > 0 ? '+' : ''}${growthVal.toFixed(1)}%`;
        const drillCue = hasChildren ? ' ↳' : '';

        cell.append('text')
          .attr('class', 'treemap-label-sub')
          .attr('x', 7)
          .attr('y', 31)
          .attr('fill', 'rgba(255, 255, 255, 0.95)')
          .text(`Rp ${valTrillion}T (${growthFormatted})${drillCue}`);
      }
    });
  }

  renderSunburst(width, height) {
    const radius = Math.min(width, height) / 2 - 24;
    const displayRoot = this.getDisplayRoot();
    const isZoomed = (this.currentNode !== this.rootNode);

    const partition = d3.partition()
      .size([2 * Math.PI, radius]);

    partition(displayRoot);

    const arc = d3.arc()
      .startAngle(d => d.x0)
      .endAngle(d => d.x1)
      .padAngle(0.006)
      .padRadius(radius / 2)
      .innerRadius(d => Math.max(44, d.y0))
      .outerRadius(d => Math.max(44, d.y1 - 1));

    const g = this.svg.append('g')
      .attr('class', 'sunburst-group')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Center circular readout
    const centerGroup = g.append('g').attr('class', 'sunburst-center-label');

    const defaultTitle = isZoomed
      ? (displayRoot.data.name.length > 20 ? displayRoot.data.name.substring(0, 18) + '…' : displayRoot.data.name)
      : 'PDB Total';

    const centerTitle = centerGroup.append('text')
      .attr('class', 'sunburst-center-title')
      .attr('y', isZoomed ? -14 : -12)
      .text(defaultTitle);

    const centerVal = centerGroup.append('text')
      .attr('class', 'sunburst-center-value')
      .attr('y', isZoomed ? 6 : 8)
      .text(`Rp ${(displayRoot.value / 1000).toFixed(0)} T`);

    const centerGrowth = centerGroup.append('text')
      .attr('class', 'sunburst-center-growth')
      .attr('y', isZoomed ? 23 : 25)
      .text(`+${(displayRoot.data.growth || 5.1).toFixed(1)}% YoY`);

    if (isZoomed) {
      centerGroup.append('text')
        .attr('class', 'sunburst-center-hint')
        .attr('y', 38)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', 'var(--color-cobalt)')
        .attr('font-family', 'var(--font-mono)')
        .text('↰ Klik tengah utk kembali');

      centerGroup
        .style('cursor', 'pointer')
        .on('click', () => {
          tooltip.hide();
          if (this.currentNode && this.currentNode.parent) {
            this.zoom(this.currentNode.parent);
          } else {
            this.resetZoom();
          }
        });
    }

    const arcs = g.selectAll('path.sunburst-arc')
      .data(displayRoot.descendants().filter(d => d.depth > 0))
      .join('path')
      .attr('class', 'sunburst-arc')
      .attr('d', arc)
      .attr('fill', d => getGrowthColor(d.data.growth))
      .attr('stroke', d => {
        if (this.highlightedSubsector && d.data.name.toLowerCase().includes(this.highlightedSubsector)) {
          return '#F59E0B';
        }
        return 'var(--bg-surface)';
      })
      .attr('stroke-width', d => {
        if (this.highlightedSubsector && d.data.name.toLowerCase().includes(this.highlightedSubsector)) {
          return 3;
        }
        return 1;
      })
      .on('mouseenter', (event, d) => {
        const growthVal = typeof d.data.growth === 'number' ? d.data.growth : 0;
        const growthColor = getGrowthColor(growthVal);

        const shortName = d.data.name.length > 22 ? d.data.name.substring(0, 20) + '…' : d.data.name;
        centerTitle.text(shortName);
        centerVal.text(`Rp ${(d.value / 1000).toFixed(1)} T`);
        centerGrowth.text(`${growthVal > 0 ? '+' : ''}${growthVal.toFixed(2)}% YoY`)
          .attr('fill', growthColor);

        tooltip.show(event, `
          <div class="tooltip-header">
            <div class="tooltip-title">${d.data.name}</div>
            <div class="tooltip-category" style="background: var(--bg-sunken); color: var(--color-cobalt);">
              ${d.children ? 'Sektor Utama' : 'Subsektor'} &bull; Pangsa ${((d.value / displayRoot.value) * 100).toFixed(1)}%
            </div>
          </div>
          <div class="tooltip-row">
            <span>Nilai PDB (ADHB):</span>
            <span class="tooltip-value">Rp ${(d.value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Triliun</span>
          </div>
          <div class="tooltip-row">
            <span>Pertumbuhan YoY:</span>
            <span class="tooltip-value" style="color: ${growthColor}; font-weight: 700;">
              ${growthVal > 0 ? '+' : ''}${growthVal.toFixed(2)}%
            </span>
          </div>
          ${d.children && d.children.length > 0 ? '<div class="tooltip-row" style="font-size:0.75rem; color:var(--color-cobalt); margin-top:6px; font-weight:600;">Klik untuk telusuri subsektor &rarr;</div>' : ''}
        `);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseleave', () => {
        tooltip.hide();
        centerTitle.text(defaultTitle);
        centerVal.text(`Rp ${(displayRoot.value / 1000).toFixed(0)} T`);
        centerGrowth.text(`+${(displayRoot.data.growth || 5.1).toFixed(1)}% YoY`)
          .attr('fill', 'var(--text-secondary)');
      })
      .on('click', (event, d) => {
        if (d.children && d.children.length > 0) {
          tooltip.hide();
          const target = d._masterNode || d;
          this.zoom(target);
        }
      });
  }

  zoom(targetNode) {
    if (!targetNode) return;
    this.currentNode = targetNode;
    this.updateBreadcrumbs();
    this.render();
  }

  resetZoom() {
    this.currentNode = this.rootNode;
    this.highlightedSubsector = null;
    this.updateBreadcrumbs();
    this.render();
  }

  updateBreadcrumbs() {
    if (!this.breadcrumbContainer) return;
    this.breadcrumbContainer.innerHTML = '';

    const pathNodes = [];
    let curr = this.currentNode;
    while (curr) {
      pathNodes.unshift(curr);
      curr = curr.parent;
    }

    pathNodes.forEach((node, index) => {
      if (index > 0) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.textContent = '/';
        this.breadcrumbContainer.appendChild(sep);
      }

      const item = document.createElement('span');
      const isCurrent = (index === pathNodes.length - 1);
      item.className = `breadcrumb-item ${isCurrent ? 'active' : ''}`;
      const name = node.data.name.length > 26 ? node.data.name.substring(0, 24) + '…' : node.data.name;
      item.textContent = name;

      if (!isCurrent) {
        item.addEventListener('click', () => this.zoom(node));
      }
      this.breadcrumbContainer.appendChild(item);
    });

    if (this.currentNode !== this.rootNode) {
      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn-breadcrumb-reset';
      resetBtn.innerHTML = '&larr; Kembali ke Nasional';
      resetBtn.title = 'Kembali ke Seluruh 17 Sektor PDB';
      resetBtn.addEventListener('click', () => this.resetZoom());
      this.breadcrumbContainer.appendChild(resetBtn);
    }
  }

  switchView(newView) {
    if (this.currentView === newView) return;
    this.currentView = newView;
    this.render();
  }

  onStepEnter(stepIndex) {
    if (!this.rootNode) return;

    if (stepIndex === 0) {
      // Step 1.1: Macro overview of 17 sectors
      this.resetZoom();
    } else if (stepIndex === 1) {
      // Step 1.2: Zoom to Sektor C (Industri Pengolahan)
      const sectorC = (this.rootNode.children || []).find(d => 
        d.data.code === 'C' || d.data.name.toLowerCase().includes('pengolahan')
      );
      if (sectorC) {
        this.highlightedSubsector = null;
        this.zoom(sectorC);
      }
    } else if (stepIndex === 2) {
      // Step 1.3: Highlight Logam Dasar inside Sektor C
      const sectorC = (this.rootNode.children || []).find(d => 
        d.data.code === 'C' || d.data.name.toLowerCase().includes('pengolahan')
      );
      if (sectorC && this.currentNode !== sectorC) {
        this.currentNode = sectorC;
        this.updateBreadcrumbs();
      }
      this.highlightedSubsector = 'logam dasar';
      this.render();
    }
  }
}

/**
 * Scene 2: Aliran Perdagangan Internasional
 * Visualisasi: Sankey (Alluvial Flow) & Chord Diagram Bilateral
 * Data: Ekspor Logam Hasil Smelter vs Impor Mesin Modal Smelter (BPS 2024-2025)
 */

import { getCommodityColor, CATEGORY_COLORS } from './utils/color-scale.js';
import { tooltip } from './utils/tooltip.js';
import { getContainerDimensions } from './utils/responsive.js';

export class SceneFlow {
  constructor(containerId = 'flow-chart-container') {
    this.containerId = containerId;
    this.container = null;
    this.svg = null;
    this.data = null;
    this.currentView = 'sankey'; // 'sankey' | 'chord'
    this.activeFilter = 'all';   // 'all' | 'china' | 'machinery' | 'battery'
    this.sankeyGraph = null;
  }

  async init(data) {
    this.data = data;
    this.container = document.getElementById(this.containerId);
    if (!this.container || !this.data) return;

    this.render();
  }

  render() {
    if (!this.container || !this.data) return;
    this.container.innerHTML = '';

    const { width, height } = getContainerDimensions(this.container);

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('role', 'img')
      .attr('aria-label', 'Visualisasi Aliran Ekspor Hasil Smelter dan Impor Mesin Industri Indonesia');

    if (this.currentView === 'sankey') {
      this.renderSankey(width, height);
    } else {
      this.renderChord(width, height);
    }
  }

  renderSankey(width, height) {
    if (!this.data.nodes || !this.data.links || typeof d3.sankey !== 'function') {
      console.warn('d3-sankey library not loaded or invalid data');
      return;
    }

    // Generous horizontal margins so long commodity and country names are never clipped
    const margin = { top: 32, right: 190, bottom: 28, left: 190 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    if (innerW <= 100 || innerH <= 100) return;

    // Deep clone nodes and links to prevent Sankey mutator collisions
    const nodes = this.data.nodes.map((d, i) => ({ ...d, originalIndex: i }));
    const links = this.data.links.map(d => ({
      ...d,
      source: typeof d.source === 'object' ? d.source.originalIndex : d.source,
      target: typeof d.target === 'object' ? d.target.originalIndex : d.target
    }));

    const sankey = d3.sankey()
      .nodeWidth(16)
      .nodePadding(18)
      .extent([[margin.left, margin.top], [margin.left + innerW, margin.top + innerH]]);

    let graph;
    try {
      graph = sankey({ nodes, links });
      this.sankeyGraph = graph;
    } catch (e) {
      console.error('Error computing Sankey layout:', e);
      return;
    }

    const g = this.svg.append('g').attr('class', 'sankey-group');

    // Column Labels (Header)
    g.append('text')
      .attr('x', margin.left)
      .attr('y', margin.top - 14)
      .attr('text-anchor', 'end')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', 'var(--text-muted)')
      .text('KOMODITAS EKSPOR & ARUS IMPOR');

    g.append('text')
      .attr('x', margin.left + innerW)
      .attr('y', margin.top - 14)
      .attr('text-anchor', 'start')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', 'var(--text-muted)')
      .text('NEGARA MITRA DAGANG UTAMA');

    // Linear Gradients for links
    const defs = this.svg.append('defs');
    graph.links.forEach((link, i) => {
      const gradId = `sankey-grad-${i}`;
      const grad = defs.append('linearGradient')
        .attr('id', gradId)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', link.source.x1)
        .attr('x2', link.target.x0);

      const srcColor = getCommodityColor(link.source.category);
      const isImport = (link.source.category === 'Hilir' || (link.source.name || '').includes('Impor'));
      const tgtColor = isImport ? '#2563EB' : '#1E3A8A';

      grad.append('stop').attr('offset', '0%').attr('stop-color', srcColor);
      grad.append('stop').attr('offset', '100%').attr('stop-color', tgtColor);
      link.gradientId = gradId;
    });

    // Render flow paths
    const linkPaths = g.append('g')
      .attr('class', 'links')
      .selectAll('path.sankey-link')
      .data(graph.links)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', d3.sankeyLinkHorizontal())
      .attr('stroke', d => `url(#${d.gradientId})`)
      .attr('stroke-width', d => Math.max(2, d.width))
      .attr('stroke-opacity', 0.4)
      .on('mouseenter', (event, d) => {
        linkPaths.classed('is-dimmed', l => l !== d);
        d3.select(event.currentTarget)
          .classed('is-highlighted', true)
          .attr('stroke-opacity', 0.85);

        const valBillion = (d.value / 1e9).toFixed(2);
        const isImport = (d.source.category === 'Hilir' || (d.source.name || '').includes('Impor'));
        const flowLabel = isImport 
          ? `Aliran Balik: Impor dari ${d.target.name} &rarr; Kebutuhan Pabrik RI`
          : `Ekspor Indonesia &rarr; ${d.target.name}`;

        const commodityTotal = d.source.value || 1;
        const sharePercent = ((d.value / commodityTotal) * 100).toFixed(1);

        tooltip.show(event, `
          <div class="tooltip-header">
            <div class="tooltip-title">${d.source.name} &rarr; ${d.target.name}</div>
            <div class="tooltip-category" style="background: var(--bg-sunken); color: ${isImport ? 'var(--color-cobalt)' : 'var(--color-terracotta)'}">
              ${isImport ? 'Barang Modal Smelter (Impor)' : 'Komoditas Unggulan (Ekspor)'}
            </div>
          </div>
          <div class="tooltip-row">
            <span>Arah Arus:</span>
            <span class="tooltip-value" style="font-size:0.75rem;">${flowLabel}</span>
          </div>
          <div class="tooltip-row">
            <span>Nilai Arus Dagang:</span>
            <span class="tooltip-value" style="color:var(--color-cobalt); font-size:0.95rem;">US$ ${valBillion} Miliar</span>
          </div>
          <div class="tooltip-row">
            <span>Pangsa thd Total Produk:</span>
            <span class="tooltip-value">${sharePercent}%</span>
          </div>
        `);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseleave', () => {
        this.applyLinkFilter();
        tooltip.hide();
      });

    // Render Nodes
    const nodeGroups = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g.sankey-node')
      .data(graph.nodes)
      .join('g')
      .attr('class', 'sankey-node')
      .on('mouseenter', (event, d) => {
        linkPaths.classed('is-dimmed', l => l.source !== d && l.target !== d);
        linkPaths.classed('is-highlighted', l => l.source === d || l.target === d);

        const totalBillion = (d.value / 1e9).toFixed(2);
        const isCountry = (d.type === 'country');

        tooltip.show(event, `
          <div class="tooltip-header">
            <div class="tooltip-title">${d.name}</div>
            <div class="tooltip-category" style="background: var(--bg-sunken); color: var(--text-primary);">
              ${isCountry ? 'Mitra Dagang Bilateral' : (d.category || 'Komoditas')}
            </div>
          </div>
          <div class="tooltip-row">
            <span>Total Nilai Terhubung:</span>
            <span class="tooltip-value" style="color:var(--color-cobalt);">US$ ${totalBillion} Miliar</span>
          </div>
          <div class="tooltip-row">
            <span>Jumlah Koneksi:</span>
            <span class="tooltip-value">${(d.sourceLinks?.length || 0) + (d.targetLinks?.length || 0)} Jalur</span>
          </div>
        `);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseleave', () => {
        this.applyLinkFilter();
        tooltip.hide();
      });

    // Node Rectangles
    nodeGroups.append('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => Math.max(4, d.y1 - d.y0))
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => {
        if (d.type === 'country') return '#1E3A8A';
        return getCommodityColor(d.category);
      })
      .attr('stroke', 'var(--bg-surface)')
      .attr('stroke-width', 1.5)
      .attr('rx', 3);

    // Node Text Labels
    nodeGroups.each(function(d) {
      const nodeG = d3.select(this);
      const isLeft = (d.x0 < width / 2);
      const nodeH = d.y1 - d.y0;
      const centerY = (d.y1 + d.y0) / 2;

      // Primary Title
      nodeG.append('text')
        .attr('x', isLeft ? d.x0 - 8 : d.x1 + 8)
        .attr('y', nodeH >= 24 ? centerY - 5 : centerY)
        .attr('dy', '0.35em')
        .attr('text-anchor', isLeft ? 'end' : 'start')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(d.name);

      // Sub-label with USD value
      if (nodeH >= 24) {
        const valBillion = (d.value / 1e9).toFixed(1);
        nodeG.append('text')
          .attr('x', isLeft ? d.x0 - 8 : d.x1 + 8)
          .attr('y', centerY + 9)
          .attr('dy', '0.35em')
          .attr('text-anchor', isLeft ? 'end' : 'start')
          .attr('font-family', 'var(--font-mono)')
          .attr('font-size', '9.5px')
          .attr('font-weight', '600')
          .attr('fill', isLeft ? 'var(--color-terracotta)' : 'var(--color-cobalt)')
          .text(`$${valBillion}B`);
      }
    });

    this.applyLinkFilter();
  }

  renderChord(width, height) {
    // Top bilateral commodities and partners
    const topCommodities = this.data.nodes.filter(d => d.type === 'commodity').slice(0, 6);
    const topCountries = this.data.nodes.filter(d => d.type === 'country').slice(0, 6);
    const entities = [...topCommodities, ...topCountries];
    const n = entities.length;

    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const entityIndexMap = new Map(entities.map((d, i) => [d.id, i]));

    this.data.links.forEach(l => {
      const srcId = typeof l.source === 'object' ? l.source.id : this.data.nodes[l.source]?.id;
      const tgtId = typeof l.target === 'object' ? l.target.id : this.data.nodes[l.target]?.id;
      const srcIdx = entityIndexMap.get(srcId);
      const tgtIdx = entityIndexMap.get(tgtId);

      if (srcIdx !== undefined && tgtIdx !== undefined) {
        matrix[srcIdx][tgtIdx] = l.value;
        // Symmetric mirror for smooth ribbon presence
        matrix[tgtIdx][srcIdx] = l.value * 0.15;
      }
    });

    // Leave ample space (32% radius) for external rotated labels
    const outerRadius = Math.min(width, height) * 0.32;
    const innerRadius = outerRadius - 16;

    const chord = d3.chord()
      .padAngle(0.04)
      .sortSubgroups(d3.descending);

    const chords = chord(matrix);

    const g = this.svg.append('g')
      .attr('class', 'chord-group')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const ribbon = d3.ribbon().radius(innerRadius);

    // Groups (outer perimeter arcs)
    const group = g.append('g')
      .selectAll('g.chord-arc-group')
      .data(chords.groups)
      .join('g')
      .attr('class', 'chord-arc-group');

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    group.append('path')
      .attr('class', 'chord-group-arc')
      .attr('fill', d => {
        const ent = entities[d.index];
        if (ent.type === 'country') return '#1E3A8A';
        return getCommodityColor(ent.category);
      })
      .attr('stroke', 'var(--bg-surface)')
      .attr('stroke-width', 1.5)
      .attr('d', arc);

    // Radial Group Labels
    group.append('text')
      .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('class', 'chord-group-text')
      .attr('font-family', 'var(--font-sans)')
      .attr('font-size', '10.5px')
      .attr('font-weight', '700')
      .attr('fill', 'var(--text-primary)')
      .attr('text-anchor', d => d.angle > Math.PI ? 'end' : null)
      .attr('transform', d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${outerRadius + 10})
        ${d.angle > Math.PI ? 'rotate(180)' : ''}
      `)
      .text(d => entities[d.index].name);

    // Ribbons (Internal chords)
    const ribbons = g.append('g')
      .selectAll('path.chord-ribbon')
      .data(chords)
      .join('path')
      .attr('class', 'chord-ribbon')
      .attr('d', ribbon)
      .attr('fill', d => {
        const ent = entities[d.source.index];
        return getCommodityColor(ent.category);
      })
      .attr('stroke', 'rgba(255,255,255,0.4)')
      .attr('stroke-width', 0.5)
      .attr('fill-opacity', 0.55)
      .on('mouseenter', (event, d) => {
        ribbons.classed('is-dimmed', r => r !== d);
        d3.select(event.currentTarget)
          .classed('is-highlighted', true)
          .attr('fill-opacity', 0.9);

        const srcName = entities[d.source.index].name;
        const tgtName = entities[d.target.index].name;
        const valBillion = (d.source.value / 1e9).toFixed(2);

        tooltip.show(event, `
          <div class="tooltip-header">
            <div class="tooltip-title">${srcName} &harr; ${tgtName}</div>
          </div>
          <div class="tooltip-row">
            <span>Volume Perdagangan:</span>
            <span class="tooltip-value" style="color:var(--color-cobalt); font-size:0.95rem;">US$ ${valBillion} Miliar</span>
          </div>
        `);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseleave', () => {
        ribbons.classed('is-dimmed', false).attr('fill-opacity', 0.55);
        tooltip.hide();
      });
  }

  filterFlow(filterKey) {
    this.activeFilter = filterKey;
    this.applyLinkFilter();
  }

  applyLinkFilter() {
    if (this.currentView !== 'sankey' || !this.svg) return;

    const links = this.svg.selectAll('.sankey-link');
    if (links.empty()) return;

    links.classed('is-dimmed', false).classed('is-highlighted', false);

    if (this.activeFilter === 'china') {
      links.transition().duration(250)
        .attr('stroke-opacity', d => {
          const tgtId = (d.target?.id || '').toUpperCase();
          const tgtName = (d.target?.name || '').toUpperCase();
          const isChina = tgtId === 'CHINA' || tgtName.includes('TIONGKOK') || tgtName.includes('CHINA');
          return isChina ? 0.85 : 0.06;
        });
    } else if (this.activeFilter === 'machinery') {
      links.transition().duration(250)
        .attr('stroke-opacity', d => {
          const srcName = (d.source?.name || '').toUpperCase();
          const isMachinery = srcName.includes('84') || srcName.includes('85') || srcName.includes('MESIN');
          return isMachinery ? 0.9 : 0.06;
        });
    } else if (this.activeFilter === 'battery') {
      links.transition().duration(250)
        .attr('stroke-opacity', d => {
          const srcName = (d.source?.name || '').toUpperCase();
          const isBatteryChain = srcName.includes('75') || srcName.includes('NIKEL') || srcName.includes('74') || srcName.includes('TEMBAGA');
          return isBatteryChain ? 0.85 : 0.06;
        });
    } else {
      links.transition().duration(250)
        .attr('stroke-opacity', 0.42);
    }
  }

  switchView(view) {
    if (this.currentView === view) return;
    this.currentView = view;
    this.render();
  }

  onStepEnter(stepIndex) {
    if (this.currentView !== 'sankey') return;

    if (stepIndex === 0) {
      // Step 2.1: Monopsony of China export market
      this.filterFlow('china');
    } else if (stepIndex === 1) {
      // Step 2.2: Heavy import burden of machinery & electrical capital goods
      this.filterFlow('machinery');
    } else if (stepIndex === 2) {
      // Step 2.3: Battery chain and nickel intermediates
      this.filterFlow('battery');
    }
  }
}

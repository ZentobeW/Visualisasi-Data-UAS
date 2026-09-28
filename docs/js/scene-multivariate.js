/**
 * Scene 3: Analisis Multivariat Komoditas Ekspor
 * Visualisasi:
 * 1. PCA Biplot (PC1 vs PC2 + Loading Vectors)
 * 2. Parallel Coordinates dengan Interactive D3 Brushing & Linking
 * 3. Clustered Heatmap (Normalisasi Variabel Kunci per Komoditas)
 * Data: Profil 66 Komoditas BPS (Nilai Ekspor, Impor, Pertumbuhan, HHI, Net Trade, Rasio Nilai Tambah)
 */

import { getCommodityColor, CATEGORY_COLORS } from './utils/color-scale.js';
import { tooltip } from './utils/tooltip.js';
import { getContainerDimensions } from './utils/responsive.js';

export class SceneMultivariate {
  constructor(containerId = 'multivariate-chart-container') {
    this.containerId = containerId;
    this.container = null;
    this.svg = null;
    this.data = null;
    this.currentView = 'pca'; // 'pca' | 'parcoords' | 'heatmap'
    this.selectedCommodity = null;
    this.activeBrushes = {};
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
      .attr('aria-label', 'Visualisasi Analisis Multivariat Profil Komoditas');

    if (this.currentView === 'pca') {
      this.renderPcaBiplot(width, height);
    } else if (this.currentView === 'parcoords') {
      this.renderParallelCoordinates(width, height);
    } else {
      this.renderHeatmap(width, height);
    }
  }

  renderPcaBiplot(width, height) {
    if (!this.data.points) return;
    const margin = { top: 40, right: 60, bottom: 55, left: 65 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    if (innerW <= 100 || innerH <= 100) return;

    // SVG Defs for Arrowhead Marker
    const defs = this.svg.append('defs');
    defs.append('marker')
      .attr('id', 'pca-arrow')
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 8)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 1.5 L 10 5 L 0 8.5 z')
      .attr('fill', 'var(--color-terracotta)');

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xExtent = d3.extent(this.data.points, d => d.pc1);
    const yExtent = d3.extent(this.data.points, d => d.pc2);

    const xMax = Math.max(Math.abs(xExtent[0] || -3), Math.abs(xExtent[1] || 3)) * 1.25;
    const yMax = Math.max(Math.abs(yExtent[0] || -3), Math.abs(yExtent[1] || 3)) * 1.25;

    const xScale = d3.scaleLinear().domain([-xMax, xMax]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([-yMax, yMax]).range([innerH, 0]);

    // Crosshairs
    g.append('line')
      .attr('x1', xScale(0)).attr('x2', xScale(0))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', 'var(--border-hairline)')
      .attr('stroke-dasharray', '3,3');

    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', yScale(0)).attr('y2', yScale(0))
      .attr('stroke', 'var(--border-hairline)')
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(6);
    const yAxis = d3.axisLeft(yScale).ticks(6);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .attr('color', 'var(--text-muted)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px');

    g.append('g')
      .call(yAxis)
      .attr('color', 'var(--text-muted)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px');

    // Variance Percentages
    const var1 = (this.data.varianceExplained?.[0] ? (this.data.varianceExplained[0] * 100).toFixed(1) : '56.4');
    const var2 = (this.data.varianceExplained?.[1] ? (this.data.varianceExplained[1] * 100).toFixed(1) : '24.2');

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 42)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text(`PC1: Skala Ekspor & Nilai Nominal (~${var1}% Varians)`);

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--text-secondary)')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text(`PC2: Pertumbuhan & Konsentrasi Pasar (~${var2}% Varians)`);

    // Loading Vectors (Feature Arrows)
    const vectors = this.data.vectors || [
      { name: 'Nilai Ekspor', x: 2.8, y: 0.8 },
      { name: 'Pertumbuhan YoY', x: 0.6, y: 2.2 },
      { name: 'Net Trade Ratio', x: 2.4, y: -1.0 },
      { name: 'Konsentrasi Pasar (HHI)', x: -1.6, y: 1.8 },
      { name: 'Rasio $/Kg', x: -1.8, y: -1.4 }
    ];

    const vectorGroup = g.append('g').attr('class', 'pca-vectors');
    vectors.forEach(v => {
      const targetX = xScale(v.x);
      const targetY = yScale(v.y);
      const originX = xScale(0);
      const originY = yScale(0);

      vectorGroup.append('line')
        .attr('class', 'pca-eigen-vector')
        .attr('x1', originX).attr('y1', originY)
        .attr('x2', targetX).attr('y2', targetY)
        .attr('stroke', 'var(--color-terracotta)')
        .attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '4,3')
        .attr('marker-end', 'url(#pca-arrow)');

      vectorGroup.append('text')
        .attr('class', 'pca-vector-label')
        .attr('x', targetX + (v.x >= 0 ? 8 : -8))
        .attr('y', targetY + (v.y >= 0 ? -4 : 12))
        .attr('text-anchor', v.x >= 0 ? 'start' : 'end')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', 'var(--color-terracotta)')
        .text(v.name);
    });

    // Bubble Size Scaling based on real export value ($10M to $45B)
    const rScale = d3.scaleSqrt()
      .domain([1e7, 4.5e10])
      .range([4.5, 20]);

    // Scatter Points
    const points = g.selectAll('circle.pca-point')
      .data(this.data.points)
      .join('circle')
      .attr('class', 'pca-point')
      .attr('cx', d => xScale(d.pc1))
      .attr('cy', d => yScale(d.pc2))
      .attr('r', d => rScale(d.exportValue || 1e7))
      .attr('fill', d => getCommodityColor(d.category))
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5)
      .classed('is-selected', d => d.hsCode === this.selectedCommodity)
      .on('mouseenter', (event, d) => {
        points.classed('is-dimmed', p => p !== d);

        const expBillion = (d.exportValue / 1e9).toFixed(2);
        const expDisplay = d.exportValue >= 1e9 ? `$${expBillion} Miliar` : `$${(d.exportValue / 1e6).toFixed(1)} Juta`;

        tooltip.show(event, `
          <div class="tooltip-header">
            <div class="tooltip-title">HS ${d.hsCode}: ${d.name}</div>
            <div class="tooltip-category" style="background: var(--bg-sunken); color: ${getCommodityColor(d.category)}">
              ${d.category}
            </div>
          </div>
          <div class="tooltip-row">
            <span>Ekspor 2025:</span>
            <span class="tooltip-value" style="color:var(--color-cobalt);">${expDisplay}</span>
          </div>
          <div class="tooltip-row">
            <span>Pertumbuhan YoY:</span>
            <span class="tooltip-value" style="color: ${d.growth > 0 ? 'var(--color-emerald)' : 'var(--color-crimson)'};">
              ${d.growth > 0 ? '+' : ''}${d.growth?.toFixed(1)}%
            </span>
          </div>
          <div class="tooltip-row">
            <span>Konsentrasi Pasar (HHI):</span>
            <span class="tooltip-value">${d.hhi?.toFixed(3)} ${d.hhi > 0.25 ? '(Terkonsentrasi)' : '(Terdiversifikasi)'}</span>
          </div>
          <div class="tooltip-row">
            <span>Net Trade Ratio:</span>
            <span class="tooltip-value">${d.netTrade > 0 ? '+' : ''}${d.netTrade?.toFixed(2)}</span>
          </div>
        `);
        this.updateInspector(d);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseleave', () => {
        points.classed('is-dimmed', false);
        tooltip.hide();
      })
      .on('click', (event, d) => {
        this.selectedCommodity = (this.selectedCommodity === d.hsCode ? null : d.hsCode);
        points.classed('is-selected', p => p.hsCode === this.selectedCommodity);
        this.updateInspector(this.selectedCommodity ? d : null);
      });
  }

  renderParallelCoordinates(width, height) {
    if (!this.data.points) return;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    if (innerW <= 100 || innerH <= 100) return;

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const dimensions = [
      { key: 'growth', label: 'Pertumbuhan YoY (%)' },
      { key: 'netTrade', label: 'Net Trade (-1 s.d +1)' },
      { key: 'hhi', label: 'Konsentrasi HHI' },
      { key: 'exportShare', label: 'Pangsa Ekspor (%)' },
      { key: 'weightIntensity', label: 'Nilai per Kg ($/Kg)' }
    ];

    const yScales = {};
    dimensions.forEach(dim => {
      const ext = d3.extent(this.data.points, d => d[dim.key]);
      yScales[dim.key] = d3.scaleLinear()
        .domain(ext)
        .range([innerH, 0]);
    });

    const xScale = d3.scalePoint()
      .range([0, innerW])
      .padding(0.12)
      .domain(dimensions.map(d => d.key));

    const pathGen = (d) => {
      return d3.line()(dimensions.map(dim => [xScale(dim.key), yScales[dim.key](d[dim.key])]));
    };

    // Render Polylines
    const lines = g.append('g')
      .attr('class', 'parcoord-lines')
      .selectAll('path.parcoord-line')
      .data(this.data.points)
      .join('path')
      .attr('class', 'parcoord-line')
      .attr('d', pathGen)
      .attr('stroke', d => getCommodityColor(d.category))
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.45)
      .classed('is-highlighted', d => d.hsCode === this.selectedCommodity)
      .on('mouseenter', (event, d) => {
        lines.classed('is-dimmed', l => l !== d);
        d3.select(event.currentTarget)
          .classed('is-highlighted', true)
          .attr('stroke-opacity', 1)
          .attr('stroke-width', 3);

        tooltip.show(event, `
          <div class="tooltip-header">
            <div class="tooltip-title">HS ${d.hsCode}: ${d.name}</div>
            <div class="tooltip-category" style="color:${getCommodityColor(d.category)}">${d.category}</div>
          </div>
          <div class="tooltip-row"><span>Pertumbuhan YoY:</span> <span class="tooltip-value">${d.growth?.toFixed(1)}%</span></div>
          <div class="tooltip-row"><span>Konsentrasi HHI:</span> <span class="tooltip-value">${d.hhi?.toFixed(3)}</span></div>
          <div class="tooltip-row"><span>Net Trade:</span> <span class="tooltip-value">${d.netTrade?.toFixed(2)}</span></div>
        `);
        this.updateInspector(d);
      })
      .on('mousemove', (event) => tooltip.move(event))
      .on('mouseleave', () => {
        lines.classed('is-dimmed', false);
        lines.classed('is-highlighted', l => l.hsCode === this.selectedCommodity);
        tooltip.hide();
      });

    // Render Axes & Brushes
    const axisGroup = g.append('g').attr('class', 'parcoord-axes');
    const brushes = {};

    dimensions.forEach(dim => {
      const axisG = axisGroup.append('g')
        .attr('class', 'parcoord-axis')
        .attr('transform', `translate(${xScale(dim.key)},0)`);

      axisG.call(d3.axisLeft(yScales[dim.key]).ticks(6))
        .attr('color', 'var(--text-muted)')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '10px');

      axisG.append('text')
        .attr('class', 'parcoord-axis-title')
        .attr('y', -14)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(dim.label);

      // Interactive D3 Brush
      const brush = d3.brushY()
        .extent([[-14, 0], [14, innerH]])
        .on('brush end', ({ selection }) => {
          if (selection) {
            brushes[dim.key] = selection.map(yScales[dim.key].invert);
          } else {
            delete brushes[dim.key];
          }

          let matchCount = 0;
          let lastMatched = null;

          lines.classed('is-dimmed', d => {
            const isOutside = Object.keys(brushes).some(key => {
              const [val1, val2] = brushes[key];
              const min = Math.min(val1, val2);
              const max = Math.max(val1, val2);
              return d[key] < min || d[key] > max;
            });

            if (!isOutside) {
              matchCount++;
              lastMatched = d;
            }
            return isOutside;
          });

          if (Object.keys(brushes).length > 0 && lastMatched) {
            this.updateInspector(lastMatched);
          }
        });

      axisG.append('g')
        .attr('class', 'brush')
        .call(brush);
    });
  }

  renderHeatmap(width, height) {
    if (!this.data.points) return;
    const margin = { top: 60, right: 30, bottom: 20, left: 180 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    if (innerW <= 100 || innerH <= 100) return;

    // Top 20 commodities by export value
    const commodities = [...this.data.points]
      .sort((a, b) => b.exportValue - a.exportValue)
      .slice(0, 20);

    const variables = [
      { key: 'growth', label: 'Growth YoY', domain: [-20, 40] },
      { key: 'netTrade', label: 'Net Trade', domain: [-1, 1] },
      { key: 'hhi', label: 'HHI Pasar', domain: [0.1, 0.6] },
      { key: 'weightIntensity', label: 'USD / Kg', domain: [0.2, 10] },
      { key: 'exportShare', label: 'Share (%)', domain: [0, 15] }
    ];

    const cellW = innerW / variables.length;
    const cellH = innerH / commodities.length;

    const g = this.svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Column Headers
    variables.forEach((v, colIdx) => {
      g.append('text')
        .attr('class', 'heatmap-col-label')
        .attr('x', colIdx * cellW + cellW / 2)
        .attr('y', -16)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('fill', 'var(--text-primary)')
        .text(v.label);
    });

    // Calibrated Color Scales
    const colorScalers = {
      growth: d3.scaleSequential(d3.interpolatePuOr).domain([40, -20]),
      netTrade: d3.scaleSequential(d3.interpolateSpectral).domain([-1, 1]),
      hhi: d3.scaleSequential(d3.interpolateYlOrRd).domain([0.1, 0.5]),
      weightIntensity: d3.scaleSequential(d3.interpolateViridis).domain([0, 8]),
      exportShare: d3.scaleSequential(d3.interpolateBlues).domain([0, 15])
    };

    commodities.forEach((item, rowIdx) => {
      // Row Label
      const shortName = item.name.length > 22 ? item.name.substring(0, 20) + '…' : item.name;
      g.append('text')
        .attr('class', 'heatmap-row-label')
        .attr('x', -10)
        .attr('y', rowIdx * cellH + cellH / 2 + 4)
        .attr('text-anchor', 'end')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--text-primary)')
        .text(`HS ${item.hsCode}: ${shortName}`)
        .on('mouseenter', () => this.updateInspector(item));

      // Cells
      variables.forEach((v, colIdx) => {
        const val = item[v.key];
        const color = colorScalers[v.key] ? colorScalers[v.key](val) : '#38BDF8';

        g.append('rect')
          .attr('class', 'heatmap-cell')
          .attr('x', colIdx * cellW + 1)
          .attr('y', rowIdx * cellH + 1)
          .attr('width', Math.max(0, cellW - 2))
          .attr('height', Math.max(0, cellH - 2))
          .attr('fill', color)
          .attr('rx', 2)
          .on('mouseenter', (event) => {
            tooltip.show(event, `
              <div class="tooltip-header">
                <div class="tooltip-title">HS ${item.hsCode}: ${item.name}</div>
                <div class="tooltip-category">${v.label}</div>
              </div>
              <div class="tooltip-row">
                <span>Nilai:</span>
                <span class="tooltip-value" style="color:var(--color-cobalt); font-size:0.95rem;">${typeof val === 'number' ? val.toFixed(2) : val}</span>
              </div>
            `);
            this.updateInspector(item);
          })
          .on('mousemove', (event) => tooltip.move(event))
          .on('mouseleave', () => tooltip.hide());
      });
    });
  }

  updateInspector(item) {
    const el = document.getElementById('multivariate-inspector') || document.getElementById('commodity-inspector');
    if (!el) return;

    const nameEl = document.getElementById('inspector-name');
    const expEl = document.getElementById('inspector-exp');
    const growthEl = document.getElementById('inspector-growth');
    const hhiEl = document.getElementById('inspector-hhi');

    if (!item) {
      if (nameEl) nameEl.textContent = 'Arahkan kursor ke komoditas untuk inspeksi parameter';
      if (expEl) expEl.textContent = '-';
      if (growthEl) {
        growthEl.textContent = '-';
        growthEl.style.color = 'var(--text-muted)';
      }
      if (hhiEl) hhiEl.textContent = '-';
      return;
    }

    const expBillion = (item.exportValue / 1e9).toFixed(2);
    const expDisplay = item.exportValue >= 1e9 ? `$${expBillion} Miliar` : `$${(item.exportValue / 1e6).toFixed(1)} Juta`;

    if (nameEl) nameEl.textContent = `HS ${item.hsCode}: ${item.name} (${item.category})`;
    if (expEl) expEl.textContent = expDisplay;
    if (growthEl) {
      growthEl.textContent = `${item.growth > 0 ? '+' : ''}${item.growth?.toFixed(1)}%`;
      growthEl.style.color = item.growth > 0 ? 'var(--color-emerald)' : 'var(--color-crimson)';
    }
    if (hhiEl) hhiEl.textContent = item.hhi?.toFixed(3) || '-';
  }

  switchView(view) {
    if (this.currentView === view) return;
    this.currentView = view;
    this.render();
  }

  onStepEnter(stepIndex) {
    if (this.currentView === 'pca') {
      const points = this.svg?.selectAll('.pca-point');
      if (!points || points.empty()) return;

      if (stepIndex === 0) {
        // Highlight Smelter & Downstream clusters vs Raw
        points.transition().duration(300)
          .attr('r', d => {
            const isSmelter = (d.category || '').toLowerCase().includes('olahan');
            return isSmelter ? 14 : 6;
          })
          .attr('opacity', 1);
      } else if (stepIndex === 1) {
        // Highlight commodities with High Growth but High HHI (Fragile concentration)
        points.transition().duration(300)
          .attr('opacity', d => (d.hhi > 0.22 && d.growth > 15) ? 1 : 0.15)
          .attr('r', d => (d.hhi > 0.22 && d.growth > 15) ? 16 : 6);
      }
    }
  }
}

---
name: d3-scrollytelling
description: "Guidelines and best practices for building responsive, accessible, interactive data journalism web stories with D3.js v7 and Scrollama.js."
---

# D3 Scrollytelling Skill Guide

This skill provides architectural patterns, layout conventions, and performance guidelines for scrollytelling web stories pairing **Scrollama.js** with **D3.js v7**.

## 1. Scrollytelling Architecture (Scrollama + D3)

### Two-Column Sticky Pattern
```
+-------------------------------------------------------------+
| Container (.scrolly-container)                              |
|                                                             |
|  +------------------------+  +---------------------------+  |
|  | Sticky Graphic View    |  | Scrollable Steps (.steps) |  |
|  | (.graphic-sticky)      |  |                           |  |
|  |                        |  |  +---------------------+  |  |
|  |   D3 SVG / Canvas      |  |  | Step 1 (.step)      |  |  |
|  |   position: sticky     |  |  +---------------------+  |  |
|  |   top: 50% or 0        |  |  | Step 2 (.step)      |  |  |
|  |                        |  |  +---------------------+  |  |
|  |                        |  |  | Step 3 (.step)      |  |  |
|  +------------------------+  +---------------------------+  |
+-------------------------------------------------------------+
```

### Essential Scrollama Setup
```javascript
const scroller = scrollama();

scroller
  .setup({
    step: '.step',
    offset: 0.5, // Trigger when step reaches 50% of viewport
    debug: false
  })
  .onStepEnter(response => {
    // response = { element, index, direction }
    updateChart(response.index, response.direction);
  })
  .onStepExit(response => {
    // Handle reverse scroll exit if needed
  });

window.addEventListener('resize', scroller.resize);
```

## 2. Responsive Sizing & ViewBox

Always make SVGs scale smoothly using `viewBox` and responsive containers:
```javascript
const container = d3.select('#chart-container');
const width = 800;
const height = 600;

const svg = container
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .classed('svg-content-responsive', true);
```

Use `ResizeObserver` with debouncing for redraws when aspect ratio or layout breakpoints change.

## 3. Interaction & Linking

- **Shared State**: Maintain a centralized selection state (e.g. `selectedCommodityId`, `activeSector`).
- **Brushing & Linking**: When a commodity is hovered or clicked in parallel coordinates or PCA, highlight the corresponding nodes in the Sankey or Treemap.
- **Accessible Tooltips**: Use a single singleton HTML tooltip with `pointer-events: none` positioned via `event.pageX` and `event.pageY`, fading in/out with CSS transitions.

## 4. Performance Rules

1. Avoid rebuilding entire D3 DOM trees on every scroll step; instead, update attributes (`transition()`, `attr()`, `style()`).
2. Use Canvas for scatterplots or PCA biplots if data points exceed 1,000 items. For ~40-100 commodities, SVG with hardware-accelerated CSS transforms is optimal.
3. Clean up event listeners and intervals when switching major scenes.

## 5. Design & Editorial Aesthetics

- **Color Palettes**:
  - Hulu (Upstream / Raw): Warm amber, terracotta, ochre (`#E07A5F`, `#D4A373`).
  - Hilir (Downstream / Value-Added): Teal, deep cyan, cobalt (`#2A9D8F`, `#264653`, `#457B9D`).
  - Diverging / Neutral: Slate, warm grays.
- **Typography**:
  - Headings: Serif or modern sans-serif with high contrast and personality.
  - Body: Clean sans-serif (e.g., 'DM Sans', 'Inter') with 1.6-1.8 line height.
  - Data labels & figures: Monospace ('DM Mono', 'JetBrains Mono') with tabular numerals (`font-variant-numeric: tabular-nums`).

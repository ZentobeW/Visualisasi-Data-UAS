/**
 * Scene 0: Introduction & Editorial Hook
 * Animates key paradox indicators:
 * 1. Lonjakan Pertumbuhan Industri Logam Dasar (+15.7%)
 * 2. Pangsa Manufaktur thd PDB yang Stagnan (18.6%)
 * 3. Dominasi Olahan Tingkat Pertama / Smelter NPI (68.2%)
 */

export class SceneIntro {
  constructor() {
    this.counters = [
      { id: 'counter-export-growth', prefix: '+', target: 15.7, suffix: '%', decimals: 1 },
      { id: 'counter-pdb-share', prefix: '', target: 18.6, suffix: '%', decimals: 1 },
      { id: 'counter-raw-ratio', prefix: '', target: 68.2, suffix: '%', decimals: 1 }
    ];
    this.hasAnimated = false;
  }

  init() {
    this.animateCounters();
  }

  animateCounters() {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    this.counters.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;

      const duration = 1800;
      const startTime = performance.now();

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Quartic ease-out for weighty editorial metric punch
        const easeVal = 1 - Math.pow(1 - progress, 4);
        const currentVal = (easeVal * item.target).toFixed(item.decimals);
        el.textContent = `${item.prefix}${currentVal}${item.suffix}`;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = `${item.prefix}${item.target.toFixed(item.decimals)}${item.suffix}`;
        }
      };

      requestAnimationFrame(update);
    });
  }

  onStepEnter(stepIndex) {
    if (stepIndex >= 0) {
      this.animateCounters();
    }
  }
}

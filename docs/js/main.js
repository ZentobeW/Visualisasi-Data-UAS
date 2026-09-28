/**
 * Main Application Orchestrator
 * Connects Scrollama scrollytelling triggers to D3 scene controllers,
 * manages reading progress indicator, active navigation tracking, quick-dock chips, and responsive layout.
 */

import { dataLoader } from './data-loader.js';
import { SceneIntro } from './scene-intro.js';
import { SceneHierarchy } from './scene-hierarchy.js';
import { SceneFlow } from './scene-flow.js';
import { SceneMultivariate } from './scene-multivariate.js';
import { debounce } from './utils/responsive.js';
import { initAnimations } from './animations.js';

class StoryApp {
  constructor() {
    this.sceneIntro = new SceneIntro();
    this.sceneHierarchy = new SceneHierarchy();
    this.sceneFlow = new SceneFlow();
    this.sceneMultivariate = new SceneMultivariate();
    this.scroller = null;
    this.progressBar = null;
  }

  async init() {
    console.log('Initializing Paradoks Hilirisasi Editorial Web Story...');

    // Progress bar element
    this.progressBar = document.getElementById('reading-progress');

    // Initialize scenes
    this.sceneIntro.init();

    // Initialize animation layer (scroll reveals, counters, nav state)
    initAnimations();

    // Reveal sticky graphic panels slightly after animations init
    // so IntersectionObserver sees them — they start hidden via reveal-right
    // but need to be visible immediately for D3 to render into them.
    // We use a minimal setTimeout to let the first observer tick fire.
    setTimeout(() => {
      document.querySelectorAll('.stage-graphic-sticky.reveal-right').forEach(el => {
        el.classList.add('is-revealed');
      });
    }, 80);

    // Setup active section nav observer & scroll progress
    this.setupScrollWatchers();

    // Load data
    const data = await dataLoader.loadAll();
    console.log('Loaded BPS datasets successfully');

    if (data.pdb) await this.sceneHierarchy.init(data.pdb);
    if (data.trade) await this.sceneFlow.init(data.trade);
    if (data.commodities) await this.sceneMultivariate.init(data.commodities);

    // Setup interactive view switchers & quick-chips
    this.setupViewControls();
    this.setupQuickChips();

    // Setup Scrollama if library is available
    this.setupScrollytelling();

    // Setup responsive resize listener
    window.addEventListener('resize', debounce(() => {
      this.handleResize();
    }, 200));

    // Scroll to top button
    const btnScrollTop = document.getElementById('btn-scroll-top');
    if (btnScrollTop) {
      btnScrollTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Render mathematical formulas via KaTeX
    this.renderMath();
    window.addEventListener('load', () => this.renderMath());
  }

  setupScrollWatchers() {
    const dockNav = document.getElementById('dock-nav-wrapper');
    const progressCircle = document.getElementById('dock-progress-circle');
    const progressPercent = document.getElementById('dock-progress-percent');
    const circleCircumference = 56.54; // 2 * PI * r (r=9)

    // Navigation links & chapter targets
    const navLinks = document.querySelectorAll('.dock-link, .nav-menu-link, .nav-link');
    const brandBtn = document.querySelector('.dock-brand-btn');
    const chapterIds = ['hierarki', 'aliran', 'multivariat', 'metodologi'];
    const chapterSections = chapterIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    let isClickNavigating = false;
    let clickNavTimeout = null;

    // Helper: update active class across all navigation links
    const setActiveLink = (targetId) => {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (targetId && href === `#${targetId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    };

    // 1. Instant Click Handler: switch active state immediately when user clicks any nav link
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          const targetId = href.slice(1);
          const targetEl = document.getElementById(targetId);

          if (targetEl) {
            e.preventDefault();

            // Instantly clear old active link (e.g. dossier) and highlight clicked link
            setActiveLink(targetId);

            // Suppress scroll listener during smooth-scroll transition to prevent flickering
            isClickNavigating = true;
            if (clickNavTimeout) clearTimeout(clickNavTimeout);
            clickNavTimeout = setTimeout(() => {
              isClickNavigating = false;
              syncActiveNavOnScroll();
            }, 850);

            // Smooth scroll to chapter
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.pushState(null, '', `#${targetId}`);
          }
        }
      });
    });

    // Jump-to-top brand button handler
    if (brandBtn) {
      brandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        setActiveLink(null);
        isClickNavigating = true;
        if (clickNavTimeout) clearTimeout(clickNavTimeout);
        clickNavTimeout = setTimeout(() => {
          isClickNavigating = false;
        }, 850);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        history.pushState(null, '', '#hero');
      });
    }

    // 2. High-precision Scroll Spy function
    const syncActiveNavOnScroll = () => {
      if (isClickNavigating) return;

      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Case A: Near top (< 250px), in hero stage -> no chapter is active
      if (winScroll < 250) {
        setActiveLink(null);
        return;
      }

      // Case B: At or near the bottom of page (within 90px of document end) -> highlight Dossier
      if (winScroll + clientHeight >= scrollHeight - 90) {
        setActiveLink('metodologi');
        return;
      }

      // Case C: Viewport focal point check (36% from top of viewport, matching reading focal line)
      const focalLine = clientHeight * 0.36;
      let activeChapterId = null;

      for (let i = 0; i < chapterSections.length; i++) {
        const sec = chapterSections[i];
        const rect = sec.getBoundingClientRect();
        if (rect.top <= focalLine && rect.bottom > focalLine) {
          activeChapterId = sec.getAttribute('id');
          break;
        }
      }

      if (activeChapterId) {
        setActiveLink(activeChapterId);
      } else {
        // Fallback: identify section with greatest visible area in viewport
        let bestId = null;
        let maxVisible = 0;

        chapterSections.forEach(sec => {
          const rect = sec.getBoundingClientRect();
          const visibleTop = Math.max(0, rect.top);
          const visibleBottom = Math.min(clientHeight, rect.bottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          if (visibleHeight > maxVisible) {
            maxVisible = visibleHeight;
            bestId = sec.getAttribute('id');
          }
        });

        if (bestId && maxVisible > 60) {
          setActiveLink(bestId);
        }
      }
    };

    let lastScrollY = window.scrollY;
    let scrollTicking = false;

    // Reading progress & Smart Dock scroll watcher
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        window.requestAnimationFrame(() => {
          const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
          const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
          const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
          const clampedScrolled = Math.min(100, Math.max(0, scrolled));

          // 1. Top progress bar
          if (this.progressBar) {
            this.progressBar.style.width = `${clampedScrolled}%`;
          }

          // 2. Dock telemetry ring & percent
          if (progressPercent) {
            progressPercent.textContent = `${Math.round(clampedScrolled)}%`;
          }
          if (progressCircle) {
            const offset = circleCircumference - (clampedScrolled / 100) * circleCircumference;
            progressCircle.style.strokeDashoffset = `${offset}`;
          }

          // 3. Smart Hide / Reveal for bottom dock
          if (dockNav) {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;
            const isNearTop = currentScrollY < 120;
            const isNearBottom = (window.innerHeight + currentScrollY) >= (document.body.offsetHeight - 80);

            if (isNearTop || isNearBottom) {
              // Always reveal when near top or bottom
              dockNav.classList.remove('is-hidden');
            } else if (scrollDelta > 16 && currentScrollY > 250) {
              // Scrolling down fast -> hide dock for unobstructed reading
              dockNav.classList.add('is-hidden');
            } else if (scrollDelta < -10) {
              // Scrolling up -> reveal dock for navigation
              dockNav.classList.remove('is-hidden');
            }

            lastScrollY = currentScrollY;
          }

          // 4. Synchronize active nav link based on scroll position
          syncActiveNavOnScroll();

          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    // Mouse proximity revealer: reveal dock if cursor moves near bottom edge
    window.addEventListener('mousemove', (e) => {
      if (dockNav && window.innerHeight - e.clientY < 70) {
        dockNav.classList.remove('is-hidden');
      }
    }, { passive: true });

    // Initial check on load
    syncActiveNavOnScroll();
  }

  setupViewControls() {
    // Scene 1: Treemap vs Sunburst toggle
    document.querySelectorAll('[data-hierarchy-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-hierarchy-view');
        document.querySelectorAll('[data-hierarchy-view]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.sceneHierarchy.switchView(view);
      });
    });

    // Scene 2: Sankey vs Chord toggle
    document.querySelectorAll('[data-flow-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-flow-view');
        document.querySelectorAll('[data-flow-view]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.sceneFlow.switchView(view);
      });
    });

    // Scene 3: PCA vs Parcoords vs Heatmap toggle
    document.querySelectorAll('[data-multi-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-multi-view');
        document.querySelectorAll('[data-multi-view]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.sceneMultivariate.switchView(view);
      });
    });
  }

  setupQuickChips() {
    // PDB Quick-Dock Chips
    const chipResetPdb = document.getElementById('chip-reset-pdb');
    const chipFocusC = document.getElementById('chip-focus-c');
    const chipFocusMetal = document.getElementById('chip-focus-metal');
    const chipFocusMining = document.getElementById('chip-focus-mining');

    const setHierarchyChipActive = (activeBtn) => {
      [chipResetPdb, chipFocusC, chipFocusMetal, chipFocusMining].forEach(b => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (chipResetPdb) {
      chipResetPdb.addEventListener('click', () => {
        this.sceneHierarchy.resetZoom();
        setHierarchyChipActive(chipResetPdb);
      });
    }

    if (chipFocusC) {
      chipFocusC.addEventListener('click', () => {
        const sectorC = (this.sceneHierarchy.rootNode?.children || []).find(d => 
          d.data.code === 'C' || d.data.name.toLowerCase().includes('pengolahan')
        );
        if (sectorC) {
          this.sceneHierarchy.zoom(sectorC);
          setHierarchyChipActive(chipFocusC);
        }
      });
    }

    if (chipFocusMetal) {
      chipFocusMetal.addEventListener('click', () => {
        const sectorC = (this.sceneHierarchy.rootNode?.children || []).find(d => 
          d.data.code === 'C' || d.data.name.toLowerCase().includes('pengolahan')
        );
        if (sectorC) {
          this.sceneHierarchy.currentNode = sectorC;
          this.sceneHierarchy.highlightedSubsector = 'logam dasar';
          this.sceneHierarchy.updateBreadcrumbs();
          this.sceneHierarchy.render();
          setHierarchyChipActive(chipFocusMetal);
        }
      });
    }

    if (chipFocusMining) {
      chipFocusMining.addEventListener('click', () => {
        const sectorB = (this.sceneHierarchy.rootNode?.children || []).find(d => 
          d.data.code === 'B' || d.data.name.toLowerCase().includes('pertambangan')
        );
        if (sectorB) {
          this.sceneHierarchy.highlightedSubsector = null;
          this.sceneHierarchy.zoom(sectorB);
          setHierarchyChipActive(chipFocusMining);
        }
      });
    }

    // Flow Quick-Dock Chips
    const chipFlowAll = document.getElementById('chip-flow-all');
    const chipFlowChina = document.getElementById('chip-flow-china');
    const chipFlowMachinery = document.getElementById('chip-flow-machinery');

    const setFlowChipActive = (activeBtn) => {
      [chipFlowAll, chipFlowChina, chipFlowMachinery].forEach(b => b && b.classList.remove('active'));
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (chipFlowAll) {
      chipFlowAll.addEventListener('click', () => {
        this.sceneFlow.filterFlow('all');
        setFlowChipActive(chipFlowAll);
      });
    }

    if (chipFlowChina) {
      chipFlowChina.addEventListener('click', () => {
        this.sceneFlow.filterFlow('china');
        setFlowChipActive(chipFlowChina);
      });
    }

    if (chipFlowMachinery) {
      chipFlowMachinery.addEventListener('click', () => {
        this.sceneFlow.filterFlow('machinery');
        setFlowChipActive(chipFlowMachinery);
      });
    }
  }

  setupScrollytelling() {
    if (typeof scrollama === 'undefined') {
      console.warn('Scrollama library not found on window object.');
      return;
    }

    // One scroller per section — prevents step-index bleed across scenes
    const sections = [
      { sectionId: 'hierarki',   scene: this.sceneHierarchy },
      { sectionId: 'aliran',     scene: this.sceneFlow },
      { sectionId: 'multivariat', scene: this.sceneMultivariate },
    ];

    this.scrollers = [];

    sections.forEach(({ sectionId, scene }) => {
      const section = document.getElementById(sectionId);
      if (!section) return;

      const cards = section.querySelectorAll('.narrative-card, .step-card');
      if (!cards.length) return;

      const scroller = scrollama();

      scroller
        .setup({
          step: Array.from(cards),
          offset: 0.52,
          debug: false,
        })
        .onStepEnter(({ element }) => {
          // Deactivate all cards in THIS section only
          cards.forEach(c => c.classList.remove('is-active'));
          element.classList.add('is-active');

          const stepNum = parseInt(element.getAttribute('data-step') || '0', 10);
          scene.onStepEnter(stepNum);
        })
        .onStepExit(({ element, direction }) => {
          if (direction === 'up') {
            element.classList.remove('is-active');
          }
        });

      this.scrollers.push(scroller);
    });
  }

  handleResize() {
    if (this.scrollers) {
      this.scrollers.forEach(s => typeof s.resize === 'function' && s.resize());
    }
    this.sceneHierarchy.render();
    this.sceneFlow.render();
    this.sceneMultivariate.render();
  }

  renderMath() {
    if (typeof renderMathInElement === 'function') {
      try {
        const mathTargets = document.querySelectorAll('.math-unrendered, .math-katex-dynamic');
        mathTargets.forEach(el => {
          renderMathInElement(el, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false,
            ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
          });
        });
      } catch (err) {
        console.warn('KaTeX auto-render deferred:', err);
      }
    }
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new StoryApp();
  app.init();
});

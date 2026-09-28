/**
 * Reusable Singleton Tooltip Component
 * Positions itself smoothly relative to mouse coordinates or DOM targets.
 */

class TooltipManager {
  constructor() {
    this.el = null;
    this.init();
  }

  init() {
    if (document.querySelector('.data-tooltip')) {
      this.el = document.querySelector('.data-tooltip');
      return;
    }

    this.el = document.createElement('div');
    this.el.className = 'data-tooltip';
    this.el.setAttribute('role', 'tooltip');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.el);
  }

  show(event, contentHtml) {
    if (!this.el) this.init();
    this.el.innerHTML = contentHtml;
    this.el.classList.add('is-visible');
    this.el.setAttribute('aria-hidden', 'false');
    this.move(event);
  }

  move(event) {
    if (!this.el) return;
    const padding = 15;
    let x = event.pageX;
    let y = event.pageY;

    // Prevent offscreen overflow
    const rect = this.el.getBoundingClientRect();
    if (x + rect.width / 2 > window.innerWidth - padding) {
      x = window.innerWidth - rect.width / 2 - padding;
    } else if (x - rect.width / 2 < padding) {
      x = rect.width / 2 + padding;
    }

    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
  }

  hide() {
    if (!this.el) return;
    this.el.classList.remove('is-visible');
    this.el.setAttribute('aria-hidden', 'true');
  }
}

export const tooltip = new TooltipManager();

/**
 * Responsive Viewport & Chart Dimensions Helper
 */

export function getContainerDimensions(element) {
  if (!element) return { width: 800, height: 600 };
  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(300, rect.width),
    height: Math.max(250, rect.height)
  };
}

/**
 * Debounce utility to prevent layout thrashing on window resize
 */
export function debounce(func, wait = 150) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

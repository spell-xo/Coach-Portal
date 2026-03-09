/**
 * Content-Aware Pagination Helper
 * Applies smart page breaks to prevent orphaned content
 * Based on PRD requirements for proper pagination
 */

/**
 * Apply smart page breaks to section blocks
 * If remaining space on a page is < 15% of page height when starting a section,
 * force a page break before the section
 */
export function applySmartPageBreaks() {
  const blocks = Array.from(document.querySelectorAll('.section-block'));

  // Get page height (A4 portrait: 297mm ≈ 1123px at 96 DPI)
  const pageHeight = 1123; // pixels
  const threshold = 0.15; // 15% threshold

  blocks.forEach((el) => {
    const rect = el.getBoundingClientRect();

    // Calculate which page we're on and remaining space
    const currentY = rect.top + window.pageYOffset;
    const currentPage = Math.floor(currentY / pageHeight);
    const nextPageStart = (currentPage + 1) * pageHeight;
    const availableSpace = nextPageStart - currentY;

    // If less than 15% of page height remaining, force page break
    if (availableSpace / pageHeight < threshold) {
      el.classList.add('page-break-before');
    }
  });
}

/**
 * Initialize pagination helper
 * Call this function when the document is ready for print
 */
export function initializePaginationHelper() {
  // Apply on load
  if (window.matchMedia) {
    const mediaQueryList = window.matchMedia('print');

    // Apply when print media query matches
    if (mediaQueryList.matches) {
      // Small delay to ensure layout is calculated
      setTimeout(applySmartPageBreaks, 0);
    }

    // Listen for changes to print media query
    mediaQueryList.addEventListener('change', (e) => {
      if (e.matches) {
        setTimeout(applySmartPageBreaks, 0);
      }
    });
  }

  // Also apply on window.beforeprint event
  window.addEventListener('beforeprint', () => {
    setTimeout(applySmartPageBreaks, 0);
  });

  // Apply on load
  window.addEventListener('load', () => {
    if (window.matchMedia('print').matches) {
      setTimeout(applySmartPageBreaks, 0);
    }
  });
}

/**
 * Reset pagination classes
 * Remove all smart page break classes
 */
export function resetPaginationClasses() {
  const blocks = Array.from(document.querySelectorAll('.section-block'));
  blocks.forEach((el) => {
    el.classList.remove('page-break-before');
  });
}

/**
 * Calculate optimal page breaks for a report
 * Returns an object with page break positions
 */
export function calculatePageBreaks() {
  const pageHeight = 1123; // A4 portrait at 96 DPI
  const blocks = Array.from(document.querySelectorAll('.section-block'));

  const pageBreaks = [];

  blocks.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const currentY = rect.top + window.pageYOffset;
    const blockHeight = rect.height;

    // Calculate page position
    const currentPage = Math.floor(currentY / pageHeight);
    const nextPageStart = (currentPage + 1) * pageHeight;
    const availableSpace = nextPageStart - currentY;

    pageBreaks.push({
      index,
      blockHeight,
      availableSpace,
      currentPage,
      shouldBreak: availableSpace / pageHeight < 0.15,
      className: el.className
    });
  });

  return pageBreaks;
}

export default {
  applySmartPageBreaks,
  initializePaginationHelper,
  resetPaginationClasses,
  calculatePageBreaks
};

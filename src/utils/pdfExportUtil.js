/**
 * PDF Export Utility
 * Handles exporting reports and components to PDF format
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

class PDFExportUtil {
  /**
   * Export a DOM element to PDF
   * @param {HTMLElement} element - The DOM element to export
   * @param {Object} options - Export options
   * @returns {Promise<void>}
   */
  async exportElementToPDF(element, options = {}) {
    const {
      filename = 'report.pdf',
      orientation = 'portrait', // portrait or landscape
      format = 'a4',
      quality = 2,
      onProgress = null,
    } = options;

    try {
      // Notify progress
      if (onProgress) onProgress('Preparing document...');

      // Clone the element to avoid modifying the original
      const clonedElement = element.cloneNode(true);

      // Apply print-friendly styles
      this.applyPrintStyles(clonedElement);

      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = orientation === 'portrait' ? '210mm' : '297mm'; // A4 dimensions
      tempContainer.style.backgroundColor = 'white';
      tempContainer.appendChild(clonedElement);
      document.body.appendChild(tempContainer);

      // Notify progress
      if (onProgress) onProgress('Capturing content...');

      // Capture the element as canvas
      const canvas = await html2canvas(clonedElement, {
        scale: quality,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: orientation === 'portrait' ? 794 : 1123, // A4 width in pixels at 96 DPI
        windowHeight: orientation === 'portrait' ? 1123 : 794,
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Notify progress
      if (onProgress) onProgress('Generating PDF...');

      // Calculate PDF dimensions
      const imgWidth = orientation === 'portrait' ? 210 : 297; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Create PDF
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
      });

      // Check if content needs multiple pages
      const pageHeight = orientation === 'portrait' ? 297 : 210; // A4 height in mm
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to first page
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );

      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          'FAST'
        );
        heightLeft -= pageHeight;
      }

      // Notify progress
      if (onProgress) onProgress('Saving PDF...');

      // Save the PDF
      pdf.save(filename);

      // Notify completion
      if (onProgress) onProgress('Complete!');

      return { success: true };
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export PDF: ' + error.message);
    }
  }

  /**
   * Apply print-friendly styles to element
   * @param {HTMLElement} element - Element to style
   */
  applyPrintStyles(element) {
    // Set white background
    element.style.backgroundColor = 'white';
    element.style.padding = '20px';

    // Remove shadows and transitions for cleaner PDF
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      el.style.boxShadow = 'none';
      el.style.transition = 'none';
      el.style.animation = 'none';

      // Add page break avoidance for better PDF layout
      el.style.pageBreakInside = 'avoid';

      // Ensure sections and headers don't break across pages
      if (el.tagName.match(/^H[1-6]$/)) {
        el.style.pageBreakAfter = 'avoid';
        el.style.pageBreakBefore = 'auto';
        // Ensure headers are visible with strong color
        el.style.color = '#000000';
        el.style.opacity = '1';
      }

      // Keep cards and sections together
      if (el.classList.contains('MuiCard-root') || el.classList.contains('MuiPaper-root')) {
        el.style.pageBreakInside = 'avoid';
        el.style.marginBottom = '12px';
      }

      // Fix spacing issues in flex and inline layouts
      const display = window.getComputedStyle(el).display;
      if (display.includes('flex')) {
        el.style.display = 'block';
        // Add explicit spacing for flex children
        Array.from(el.children).forEach(child => {
          child.style.display = 'inline-block';
          child.style.marginRight = '4px';
        });
      }

      // Ensure proper word spacing
      el.style.wordSpacing = 'normal';
      el.style.letterSpacing = 'normal';

      // Ensure visibility of all elements
      if (el.style.display !== 'none') {
        el.style.visibility = 'visible';
        el.style.opacity = el.style.opacity || '1';
      }
    });

    // Ensure Chip elements are visible and properly styled
    const chips = element.querySelectorAll('.MuiChip-root');
    chips.forEach(chip => {
      chip.style.display = 'inline-flex';
      chip.style.visibility = 'visible';
      chip.style.opacity = '1';
      chip.style.marginBottom = '4px';
      // Ensure chip text is visible
      const chipLabel = chip.querySelector('.MuiChip-label');
      if (chipLabel) {
        chipLabel.style.color = '#000000';
        chipLabel.style.visibility = 'visible';
      }
    });

    // Ensure Divider elements with chips are visible
    const dividers = element.querySelectorAll('.MuiDivider-root');
    dividers.forEach(divider => {
      divider.style.borderColor = '#000000';
      divider.style.opacity = '0.3';
      divider.style.visibility = 'visible';
      divider.style.marginTop = '16px';
      divider.style.marginBottom = '16px';
    });

    // Hide interactive elements that don't make sense in PDF
    const interactiveSelectors = [
      'button[aria-label*="expand"]',
      '.MuiIconButton-root:not(.MuiChip-root *)',
      '.MuiButtonBase-root:not(.MuiChip-root)',
    ];

    interactiveSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        // Don't hide if it's part of content (like badges or chips)
        if (!el.classList.contains('MuiChip-root') && !el.closest('.MuiChip-root')) {
          el.style.display = 'none';
        }
      });
    });

    // Ensure text is black for readability, but preserve branding headers
    const textElements = element.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, td, th, li');
    textElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const color = computedStyle.color;

      // Skip text color changes if element or its parent has a gradient or colored background
      // This preserves branded headers with white text on colored backgrounds
      const hasColoredBackground = this.hasColoredBackground(el);

      // If text is very light AND doesn't have a colored background, make it darker
      if (this.isLightColor(color) && !hasColoredBackground) {
        el.style.color = '#000000';
      }

      // Ensure all text is visible
      el.style.visibility = 'visible';
    });
  }

  /**
   * Check if element or its parent has a colored background (not white/transparent)
   * @param {HTMLElement} element - Element to check
   * @returns {boolean}
   */
  hasColoredBackground(element) {
    let currentEl = element;
    let depth = 0;
    const maxDepth = 3; // Check up to 3 parent levels

    while (currentEl && depth < maxDepth) {
      const computedStyle = window.getComputedStyle(currentEl);
      const background = computedStyle.background;
      const backgroundColor = computedStyle.backgroundColor;

      // Check for gradient backgrounds
      if (background && background.includes('gradient')) {
        return true;
      }

      // Check for non-white, non-transparent background colors
      if (backgroundColor && backgroundColor !== 'transparent') {
        const rgb = backgroundColor.match(/\d+/g);
        if (rgb && rgb.length >= 3) {
          const r = parseInt(rgb[0]);
          const g = parseInt(rgb[1]);
          const b = parseInt(rgb[2]);
          const alpha = rgb[3] ? parseFloat(rgb[3]) : 1;

          // If background is not white and not transparent, consider it colored
          if (alpha > 0 && !(r > 240 && g > 240 && b > 240)) {
            return true;
          }
        }
      }

      currentEl = currentEl.parentElement;
      depth++;
    }

    return false;
  }

  /**
   * Check if a color is light
   * @param {string} color - CSS color string
   * @returns {boolean}
   */
  isLightColor(color) {
    // Convert RGB color to brightness value
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return false;

    const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
    return brightness > 200;
  }

  /**
   * Export Player AI Report to PDF
   * @param {HTMLElement} reportElement - The report container element
   * @param {string} playerName - Player name for filename
   * @param {Object} options - Additional options
   */
  async exportPlayerReport(reportElement, playerName = 'Player', options = {}) {
    const sanitizedName = playerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `${sanitizedName}_performance_report_${date}.pdf`;

    return this.exportElementToPDF(reportElement, {
      ...options,
      filename,
      orientation: 'portrait',
    });
  }

  /**
   * Export Team Report to PDF
   * @param {HTMLElement} reportElement - The report container element
   * @param {string} teamName - Team name for filename
   * @param {Object} options - Additional options
   */
  async exportTeamReport(reportElement, teamName = 'Team', options = {}) {
    const sanitizedName = teamName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `${sanitizedName}_team_report_${date}.pdf`;

    return this.exportElementToPDF(reportElement, {
      ...options,
      filename,
      orientation: 'portrait',
    });
  }

  /**
   * Export Club Report to PDF
   * @param {HTMLElement} reportElement - The report container element
   * @param {string} clubName - Club name for filename
   * @param {Object} options - Additional options
   */
  async exportClubReport(reportElement, clubName = 'Club', options = {}) {
    const sanitizedName = clubName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `${sanitizedName}_club_report_${date}.pdf`;

    return this.exportElementToPDF(reportElement, {
      ...options,
      filename,
      orientation: 'portrait',
    });
  }

  /**
   * Export Parent Report to PDF
   * @param {HTMLElement} reportElement - The report container element
   * @param {string} playerName - Player name for filename
   * @param {Object} options - Additional options
   */
  async exportParentReport(reportElement, playerName = 'Player', options = {}) {
    const sanitizedName = playerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    const filename = `${sanitizedName}_parent_report_${date}.pdf`;

    return this.exportElementToPDF(reportElement, {
      ...options,
      filename,
      orientation: 'portrait',
    });
  }

  /**
   * Generate filename from report metadata
   * @param {string} type - Report type
   * @param {string} name - Entity name
   * @returns {string}
   */
  generateFilename(type, name) {
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const date = new Date().toISOString().split('T')[0];
    return `${type}_${sanitizedName}_${date}.pdf`;
  }
}

export default new PDFExportUtil();

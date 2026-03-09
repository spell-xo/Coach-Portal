/**
 * Accessibility Utilities
 *
 * Helper functions for improving accessibility (a11y)
 * WCAG 2.1 AA compliance helpers
 */

/**
 * Generate unique ID for aria-labelledby and aria-describedby
 *
 * Usage:
 * const id = generateA11yId('input');
 * <input id={id} aria-labelledby={`${id}-label`} />
 */
export const generateA11yId = (prefix = 'a11y') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce message to screen readers
 *
 * Usage:
 * announceToScreenReader('Form submitted successfully');
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority); // 'polite' or 'assertive'
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if element is focusable
 */
export const isFocusable = (element) => {
  if (!element) return false;

  const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
  const isFocusableTag = focusableTags.includes(element.tagName);
  const hasTabIndex = element.hasAttribute('tabindex') && element.getAttribute('tabindex') !== '-1';

  return (isFocusableTag || hasTabIndex) && !element.disabled;
};

/**
 * Trap focus within an element (for modals/dialogs)
 *
 * Usage:
 * const cleanup = trapFocus(dialogElement);
 * // Later: cleanup();
 */
export const trapFocus = (element) => {
  if (!element) return () => {};

  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTab);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTab);
  };
};

/**
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 *
 * Usage:
 * const ratio = getContrastRatio('#000000', '#FFFFFF');
 * const passes = ratio >= 4.5;
 */
export const getContrastRatio = (foreground, background) => {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Add skip navigation link
 *
 * Usage:
 * addSkipLink('main', 'Skip to main content');
 */
export const addSkipLink = (targetId, text = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.className = 'skip-link';
  skipLink.textContent = text;
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 100;
    text-decoration: none;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
};

/**
 * Keyboard navigation handler
 *
 * Usage:
 * const handler = createKeyboardNav({
 *   ArrowUp: () => moveFocusUp(),
 *   ArrowDown: () => moveFocusDown(),
 *   Enter: () => selectItem(),
 *   Escape: () => closeMenu(),
 * });
 */
export const createKeyboardNav = (keyMap) => {
  return (event) => {
    const handler = keyMap[event.key];
    if (handler) {
      event.preventDefault();
      handler(event);
    }
  };
};

/**
 * Focus first error in form
 *
 * Usage:
 * focusFirstError(formElement);
 */
export const focusFirstError = (formElement) => {
  if (!formElement) return;

  const errorElement = formElement.querySelector('[aria-invalid="true"], .error, [data-error]');
  if (errorElement) {
    errorElement.focus();
    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

/**
 * Create accessible tooltip
 *
 * Returns object with aria attributes
 */
export const createAccessibleTooltip = (text) => {
  const id = generateA11yId('tooltip');

  return {
    'aria-describedby': id,
    tooltipId: id,
    tooltipText: text,
  };
};

/**
 * Validate ARIA attributes
 *
 * Checks for common ARIA mistakes
 */
export const validateARIA = (element) => {
  const warnings = [];

  // Check for aria-label on non-interactive elements
  if (element.hasAttribute('aria-label') && !isFocusable(element)) {
    warnings.push('aria-label on non-focusable element');
  }

  // Check for aria-labelledby pointing to non-existent ID
  if (element.hasAttribute('aria-labelledby')) {
    const id = element.getAttribute('aria-labelledby');
    if (!document.getElementById(id)) {
      warnings.push(`aria-labelledby points to non-existent ID: ${id}`);
    }
  }

  // Check for required aria-label on certain roles
  const role = element.getAttribute('role');
  if (['button', 'link', 'navigation'].includes(role)) {
    const hasLabel =
      element.hasAttribute('aria-label') ||
      element.hasAttribute('aria-labelledby') ||
      element.textContent.trim().length > 0;

    if (!hasLabel) {
      warnings.push(`${role} missing accessible name`);
    }
  }

  return warnings;
};

/**
 * Check if element is visible to screen readers
 */
export const isVisibleToScreenReaders = (element) => {
  if (!element) return false;

  const style = window.getComputedStyle(element);
  const ariaHidden = element.getAttribute('aria-hidden') === 'true';

  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    !ariaHidden
  );
};

export default {
  generateA11yId,
  announceToScreenReader,
  isFocusable,
  trapFocus,
  getContrastRatio,
  prefersReducedMotion,
  prefersDarkMode,
  prefersHighContrast,
  addSkipLink,
  createKeyboardNav,
  focusFirstError,
  createAccessibleTooltip,
  validateARIA,
  isVisibleToScreenReaders,
};

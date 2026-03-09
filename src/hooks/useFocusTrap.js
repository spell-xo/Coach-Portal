import { useEffect, useRef } from 'react';

/**
 * useFocusTrap hook
 *
 * Traps focus within a container (essential for modals/dialogs)
 *
 * Features:
 * - Traps Tab and Shift+Tab within container
 * - Focuses first element on mount
 * - Returns focus to trigger element on unmount
 * - WCAG 2.1 AA compliant
 *
 * Usage:
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useFocusTrap(isOpen);
 *
 *   return (
 *     <div ref={modalRef} role="dialog">
 *       {/* Modal content */}
 *     </div>
 *   );
 * }
 */
const useFocusTrap = (isActive = true) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store the element that had focus before modal opened
    previousFocusRef.current = document.activeElement;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    };

    const focusableElements = getFocusableElements();
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 0);
    }

    // Handle Tab key
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return;

      const currentFocusables = getFocusableElements();
      const firstElement = currentFocusables[0];
      const lastElement = currentFocusables[currentFocusables.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Return focus to previous element
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

export default useFocusTrap;

/**
 * Performance Monitoring Utilities
 *
 * Tools for measuring and optimizing application performance
 */

/**
 * Measure and log component render time
 *
 * Usage:
 * const measure = measureRender('MyComponent');
 * // ... component logic ...
 * measure.end();
 */
export const measureRender = (componentName) => {
  const startTime = performance.now();

  return {
    end: () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
      }

      return renderTime;
    },
  };
};

/**
 * Performance mark for custom metrics
 *
 * Usage:
 * performanceMark('data-fetch-start');
 * // ... fetch data ...
 * performanceMark('data-fetch-end');
 * const duration = performanceMeasure('data-fetch', 'data-fetch-start', 'data-fetch-end');
 */
export const performanceMark = (markName) => {
  if ('performance' in window && performance.mark) {
    performance.mark(markName);
  }
};

export const performanceMeasure = (measureName, startMark, endMark) => {
  if ('performance' in window && performance.measure) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${measureName}: ${measure.duration.toFixed(2)}ms`);
      }

      return measure.duration;
    } catch (error) {
      console.error('Performance measurement error:', error);
      return null;
    }
  }
  return null;
};

/**
 * Report Web Vitals
 *
 * Measures Core Web Vitals: LCP, FID, CLS
 */
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

/**
 * Log Core Web Vitals to console (development only)
 */
export const logWebVitals = () => {
  if (process.env.NODE_ENV === 'development') {
    reportWebVitals((metric) => {
      console.log(`[Web Vitals] ${metric.name}:`, metric.value);
    });
  }
};

/**
 * Debounce function for performance optimization
 *
 * Usage:
 * const debouncedSearch = debounce((query) => search(query), 300);
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for performance optimization
 *
 * Usage:
 * const throttledScroll = throttle(() => handleScroll(), 100);
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Lazy load images with Intersection Observer
 *
 * Usage:
 * lazyLoadImages('.lazy-image');
 */
export const lazyLoadImages = (selector = '[data-lazy]') => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        }
      });
    });

    const images = document.querySelectorAll(selector);
    images.forEach((img) => imageObserver.observe(img));
  }
};

/**
 * Preload critical resources
 *
 * Usage:
 * preloadResource('/api/critical-data', 'fetch');
 * preloadResource('/images/hero.jpg', 'image');
 */
export const preloadResource = (href, as = 'fetch') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  document.head.appendChild(link);
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get bundle size information
 *
 * Usage in development:
 * getBundleSize().then(size => console.log('Bundle size:', size));
 */
export const getBundleSize = async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;

      resources.forEach((resource) => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          totalSize += resource.transferSize || 0;
        }
      });

      return {
        total: totalSize,
        formatted: `${(totalSize / 1024).toFixed(2)} KB`,
      };
    } catch (error) {
      console.error('Error getting bundle size:', error);
      return null;
    }
  }
  return null;
};

/**
 * Monitor long tasks (> 50ms)
 */
export const monitorLongTasks = () => {
  if (process.env.NODE_ENV === 'development' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(
            `[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`,
            entry
          );
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      // Long task API not supported
    }
  }
};

/**
 * Memory usage monitoring (Chrome only)
 */
export const getMemoryUsage = () => {
  if (
    process.env.NODE_ENV === 'development' &&
    performance.memory
  ) {
    const memory = performance.memory;
    return {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      percentage: `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2)}%`,
    };
  }
  return null;
};

/**
 * Log performance metrics to console
 */
export const logPerformanceMetrics = () => {
  if (process.env.NODE_ENV === 'development') {
    console.group('[Performance Metrics]');

    // Web Vitals
    logWebVitals();

    // Bundle Size
    getBundleSize().then((size) => {
      if (size) {
        console.log('Bundle Size:', size.formatted);
      }
    });

    // Memory Usage
    const memory = getMemoryUsage();
    if (memory) {
      console.log('Memory Usage:', memory);
    }

    // Monitor long tasks
    monitorLongTasks();

    console.groupEnd();
  }
};

export default {
  measureRender,
  performanceMark,
  performanceMeasure,
  reportWebVitals,
  logWebVitals,
  debounce,
  throttle,
  lazyLoadImages,
  preloadResource,
  prefersReducedMotion,
  getBundleSize,
  monitorLongTasks,
  getMemoryUsage,
  logPerformanceMetrics,
};

// Performance monitoring and optimization utilities

// Web Vitals monitoring
export function reportWebVitals(metric: any) {
  // Send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics
    // analytics.track('web-vital', metric);
    console.log('Web Vital:', metric);
  }
}

// Performance observer for Core Web Vitals
export function setupPerformanceObserver() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        reportWebVitals({
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          id: lastEntry.id,
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      console.warn('LCP observer not supported');
    }

    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries[0] as any;
        reportWebVitals({
          name: 'FCP',
          value: fcpEntry.startTime,
          id: fcpEntry.id,
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observer not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fidEntry = entries[0] as any;
        reportWebVitals({
          name: 'FID',
          value: fidEntry.processingStart - fidEntry.startTime,
          id: fidEntry.id,
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        reportWebVitals({
          name: 'CLS',
          value: clsValue,
          id: 'cls',
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      console.warn('CLS observer not supported');
    }
  }
}

// Memory monitoring
export function getMemoryUsage() {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null;
  }

  const memory = (performance as any).memory;
  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
  };
}

// Network information
export function getNetworkInfo() {
  if (typeof window === 'undefined' || !('navigator' in window)) {
    return null;
  }

  const connection = (navigator as any).connection;
  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData,
  };
}

// Performance timing
export function getPerformanceTiming() {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null;
  }

  const timing = performance.timing;
  if (!timing) return null;

  return {
    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
    loadComplete: timing.loadEventEnd - timing.navigationStart,
    firstPaint: timing.responseStart - timing.navigationStart,
    domInteractive: timing.domInteractive - timing.navigationStart,
  };
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request animation frame throttle
export function rafThrottle<T extends (...args: any[]) => any>(
  callback: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      callback(...args);
      rafId = null;
    });
  };
}

// Lazy load images
export function lazyLoadImage(imgElement: HTMLImageElement, src: string) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        imgElement.src = src;
        observer.unobserve(imgElement);
      }
    });
  });

  observer.observe(imgElement);
}

// Preload critical resources
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

// Prefetch resources
export function prefetchResource(href: string) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

// Measure component render time
export function measureRenderTime(componentName: string) {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;
    console.log(`${componentName} render time: ${duration.toFixed(2)}ms`);
    
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics
      reportWebVitals({
        name: 'component-render',
        value: duration,
        id: componentName,
      });
    }
  };
}

// Detect low-end devices
export function isLowEndDevice() {
  if (typeof window === 'undefined') return false;

  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';

  return (
    hardwareConcurrency <= 2 ||
    deviceMemory <= 2 ||
    effectiveType === '2g' ||
    effectiveType === 'slow-2g'
  );
}

// Adaptive quality based on device
export function getAdaptiveQuality() {
  if (isLowEndDevice()) {
    return {
      images: 'low',
      animations: 'reduced',
      video: 'low',
    };
  }

  return {
    images: 'high',
    animations: 'full',
    video: 'high',
  };
}

// Bundle size monitoring (development only)
export function logBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;

  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    
    const totalSize = jsResources.reduce((acc, r) => acc + r.transferSize, 0);
    const formattedSize = (totalSize / 1024 / 1024).toFixed(2);
    
    console.log(`Total JS bundle size: ${formattedSize} MB`);
    console.log(`Number of JS files: ${jsResources.length}`);
  }
}

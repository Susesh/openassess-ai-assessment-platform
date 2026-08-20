"use client";

import React, { useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap, Activity, Clock } from "lucide-react";

interface ProgressiveLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  delay?: number;
  minDisplayTime?: number;
  onLoad?: () => void;
  showProgress?: boolean;
}

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded" | "avatar" | "card" | "list" | "chart";
  width?: string | number;
  height?: string | number;
  count?: number;
  animated?: boolean;
}

interface LoadingProgressProps {
  progress: number;
  message?: string;
  showETA?: boolean;
  startTime?: number;
}

// Loading progress component
export function LoadingProgress({ progress, message, showETA, startTime }: LoadingProgressProps) {
  const [eta, setETA] = useState<number | null>(null);

  useEffect(() => {
    if (showETA && startTime && progress > 0 && progress < 100) {
      const elapsed = Date.now() - startTime;
      const estimatedTotal = (elapsed / progress) * 100;
      const remaining = estimatedTotal - elapsed;
      setETA(Math.round(remaining / 1000));
    }
  }, [progress, showETA, startTime]);

  return (
    <div className="flex flex-col items-center gap-3 p-6">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#C1C4C8" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#2B2E33"
            strokeWidth="8"
            strokeDasharray={`${progress * 2.83} 283`}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-[#2B2E33]">{Math.round(progress)}%</span>
        </div>
      </div>
      {message && <p className="text-sm text-[#7B7F85]">{message}</p>}
      {showETA && eta !== null && (
        <div className="flex items-center gap-1 text-xs text-[#7B7F85]">
          <Clock className="w-3 h-3" />
          <span>~{eta}s remaining</span>
        </div>
      )}
    </div>
  );
}

// Enhanced skeleton component with more variants
export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  count = 1,
  animated = true,
}: SkeletonProps) {
  const baseClasses = animated ? "animate-pulse bg-[#C1C4C8]" : "bg-[#C1C4C8]";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded",
    rounded: "rounded-xl",
    avatar: "rounded-full w-12 h-12",
    card: "rounded-xl h-24",
    list: "h-12 rounded-lg",
    chart: "h-32 rounded-lg",
  };

  const style: React.CSSProperties = {
    width: width || (variant === "text" ? "100%" : variant === "avatar" ? "48px" : "100%"),
    height: height || (variant === "text" ? "1rem" : variant === "avatar" ? "48px" : "100%"),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${baseClasses} ${variantClasses[variant]} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

// Prefetch utility for predictive content loading
class PrefetchManager {
  private prefetched = new Set<string>();
  private prefetchQueue: Array<{ url: string; priority: 'high' | 'low' }> = [];

  prefetch(url: string, priority: 'high' | 'low' = 'low') {
    if (this.prefetched.has(url)) return;

    if (priority === 'high') {
      this.prefetchHighPriority(url);
    } else {
      this.prefetchQueue.push({ url, priority });
      this.processQueue();
    }
  }

  private prefetchHighPriority(url: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'fetch';
    document.head.appendChild(link);
    this.prefetched.add(url);
  }

  private processQueue() {
    if (this.prefetchQueue.length === 0) return;

    requestIdleCallback(() => {
      const item = this.prefetchQueue.shift();
      if (item) {
        this.prefetchHighPriority(item.url);
        this.processQueue();
      }
    });
  }

  clear() {
    this.prefetched.clear();
    this.prefetchQueue = [];
  }
}

export const prefetchManager = new PrefetchManager();

// Resource preloader for images and scripts
export function preloadResources(resources: Array<{ type: 'image' | 'script' | 'style'; url: string }>) {
  resources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = resource.type === 'image' ? 'preload' : 'prefetch';
    link.href = resource.url;
    
    if (resource.type === 'image') {
      link.as = 'image';
    } else if (resource.type === 'script') {
      link.as = 'script';
    } else if (resource.type === 'style') {
      link.as = 'style';
    }
    
    document.head.appendChild(link);
  });
}

// Context-aware skeleton card
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
}

// Progressive image loader with blur-up effect
export function ProgressiveImage({
  src,
  alt,
  className = "",
  placeholder = "blur",
}: {
  src: string;
  alt: string;
  className?: string;
  placeholder?: "blur" | "color";
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-[#C1C4C8] animate-pulse" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5F6F7]">
          <span className="text-[#7B7F85]">Failed to load image</span>
        </div>
      ) : (
        <motion.img
          src={src}
          alt={alt}
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.3 }}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}

// Lazy load component with intersection observer
export function LazyLoad({
  children,
  threshold = 0.1,
  rootMargin = "100px",
  fallback,
}: {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  fallback?: ReactNode;
}) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          // Small delay to ensure smooth loading
          setTimeout(() => setIsLoaded(true), 100);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className="min-h-[100px]">
      {isLoaded ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      ) : (
        fallback || <SkeletonCard />
      )}
    </div>
  );
}

// Progressive loader with delay, min display time, and progress tracking
export function ProgressiveLoader({
  children,
  fallback,
  delay = 0,
  minDisplayTime = 500,
  onLoad,
  showProgress = false,
}: ProgressiveLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [progress, setProgress] = useState(0);
  const loadStartTime = useRef<number>(Date.now());

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate progress if showProgress is enabled
      if (showProgress) {
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 95) {
              clearInterval(progressInterval);
              return 95;
            }
            return prev + Math.random() * 15;
          });
        }, 100);

        setTimeout(() => {
          clearInterval(progressInterval);
          setProgress(100);
          const elapsed = Date.now() - loadStartTime.current;
          const remainingTime = Math.max(0, minDisplayTime - elapsed);
          
          setTimeout(() => {
            setIsLoading(false);
            setShowContent(true);
            onLoad?.();
          }, remainingTime);
        }, delay + 500);
      } else {
        const elapsed = Date.now() - loadStartTime.current;
        const remainingTime = Math.max(0, minDisplayTime - elapsed);
        
        setTimeout(() => {
          setIsLoading(false);
          setShowContent(true);
          onLoad?.();
        }, remainingTime);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, minDisplayTime, onLoad, showProgress]);

  return (
    <>
      {isLoading && (
        fallback || (
          <div className="flex items-center justify-center p-8">
            {showProgress ? (
              <LoadingProgress 
                progress={progress} 
                message="Loading..." 
                showETA={true}
                startTime={loadStartTime.current}
              />
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#2B2E33] animate-spin" />
                <p className="text-sm text-[#7B7F85]">Loading...</p>
              </div>
            )}
          </div>
        )
      )}
      {showContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </>
  );
}

// Optimistic UI wrapper with rollback support
export function OptimisticUI<T>({
  value,
  optimisticValue,
  children,
  onRollback,
}: {
  value: T;
  optimisticValue: T | null;
  children: (currentValue: T, handleError: () => void) => ReactNode;
  onRollback?: () => void;
}) {
  const currentValue = optimisticValue !== null ? optimisticValue : value;
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (optimisticValue !== null && hasError) {
      onRollback?.();
      setHasError(false);
    }
  }, [optimisticValue, hasError, onRollback]);

  const handleError = useCallback(() => {
    setHasError(true);
    onRollback?.();
  }, [onRollback]);

  return <>{children(currentValue, handleError)}</>;
}

// Smart cache for data fetching
class SmartCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const smartCache = new SmartCache();

// Hook for smart data fetching with caching
export function useSmartFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (options?.enabled === false) return;

    // Check cache first
    const cached = smartCache.get(key);
    if (cached) {
      setData(cached);
      options?.onSuccess?.(cached);
      return;
    }

    setIsLoading(true);
    fetcher()
      .then((result) => {
        smartCache.set(key, result, options?.ttl);
        setData(result);
        options?.onSuccess?.(result);
      })
      .catch((err) => {
        setError(err);
        options?.onError?.(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [key, fetcher, options]);

  return { data, isLoading, error, refetch: () => fetcher() };
}

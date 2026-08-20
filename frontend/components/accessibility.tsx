"use client";

import React, { useEffect, useRef, useState, ReactNode, useCallback } from "react";

// Skip to main content link for keyboard users
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#2B2E33] focus:text-white focus:rounded-lg focus:font-semibold focus:outline-none focus:ring-2 focus:ring-white"
    >
      Skip to main content
    </a>
  );
}

// ARIA landmark regions
export function LandmarkRegion({
  children,
  role,
  label,
  ariaLabel,
}: {
  children: ReactNode;
  role: "main" | "navigation" | "complementary" | "banner" | "contentinfo" | "search" | "form";
  label?: string;
  ariaLabel?: string;
}) {
  return (
    <div role={role} aria-label={ariaLabel || label} aria-labelledby={label ? `${role}-label` : undefined}>
      {label && <span id={`${role}-label`} className="sr-only">{label}</span>}
      {children}
    </div>
  );
}

// Live region for screen reader announcements with queue support
export function LiveRegion({ message, role = "status", clearAfter = 5000 }: { message: string; role?: "status" | "alert" | "assertive"; clearAfter?: number }) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfter > 0) {
      const timeout = setTimeout(() => {
        setCurrentMessage("");
      }, clearAfter);
      return () => clearTimeout(timeout);
    }
  }, [message, clearAfter]);

  return (
    <div
      role={role}
      aria-live={role === "alert" ? "assertive" : "polite"}
      aria-atomic="true"
      className="sr-only"
    >
      {currentMessage}
    </div>
  );
}

// Screen reader announcer hook
export function useScreenReaderAnnouncer() {
  const [announcements, setAnnouncements] = useState<Array<{ id: string; message: string; priority: 'polite' | 'assertive' }>>([]);
  const announcerRef = useRef<HTMLDivElement>(null);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const id = `announcement-${Date.now()}`;
    setAnnouncements(prev => [...prev, { id, message, priority }]);
    
    // Remove after announcement
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 1000);
  }, []);

  return { announce, announcerRef, announcements };
}

// Focus trap for modals and dialogs
export function FocusTrap({ children, isActive }: { children: ReactNode; isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the first focusable element
    const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (!containerRef.current) return;

      const focusableContent = containerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableContent[0];
      const lastElement = focusableContent[focusableContent.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("keydown", handleTab);
      // Restore focus when trap is deactivated
      previousActiveElement.current?.focus();
    };
  }, [isActive]);

  return <div ref={containerRef}>{children}</div>;
}

// Visually hidden but accessible to screen readers
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// Accessible button with icon support
export function AccessibleButton({
  children,
  icon,
  label,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  label?: string;
}) {
  return (
    <button
      {...props}
      aria-label={label || (typeof children === "string" ? children : undefined)}
      className={`focus:outline-none focus:ring-2 focus:ring-[#2B2E33] focus:ring-offset-2 ${props.className || ""}`}
    >
      {icon && <span className="inline-flex items-center justify-center" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}

// Accessible link with external indicator
export function AccessibleLink({
  children,
  href,
  isExternal = false,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  isExternal?: boolean;
}) {
  return (
    <a
      href={href}
      {...props}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`focus:outline-none focus:ring-2 focus:ring-[#2B2E33] focus:ring-offset-2 ${props.className || ""}`}
    >
      {children}
      {isExternal && (
        <VisuallyHidden>
          (opens in new tab)
        </VisuallyHidden>
      )}
    </a>
  );
}

// High contrast mode toggle
export function HighContrastToggle() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check for saved preference
    const saved = localStorage.getItem("high-contrast");
    if (saved === "true") {
      setIsHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }

    // Check system preference
    if (window.matchMedia("(prefers-contrast: more)").matches) {
      setIsHighContrast(true);
      document.documentElement.classList.add("high-contrast");
    }
  }, []);

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
    document.documentElement.classList.toggle("high-contrast");
    localStorage.setItem("high-contrast", (!isHighContrast).toString());
  };

  return (
    <button
      onClick={toggleHighContrast}
      aria-pressed={isHighContrast}
      className="p-2 rounded-lg bg-[#F5F6F7] border border-[#C1C4C8] hover:bg-[#C1C4C8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2E33]"
      aria-label="Toggle high contrast mode"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    </button>
  );
}

// Reduced motion toggle
export function ReducedMotionToggle() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for saved preference
    const saved = localStorage.getItem("reduced-motion");
    if (saved === "true") {
      setPrefersReducedMotion(true);
      document.documentElement.classList.add("reduced-motion");
    }

    // Check system preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPrefersReducedMotion(true);
      document.documentElement.classList.add("reduced-motion");
    }
  }, []);

  const toggleReducedMotion = () => {
    setPrefersReducedMotion(!prefersReducedMotion);
    document.documentElement.classList.toggle("reduced-motion");
    localStorage.setItem("reduced-motion", (!prefersReducedMotion).toString());
  };

  return (
    <button
      onClick={toggleReducedMotion}
      aria-pressed={prefersReducedMotion}
      className="p-2 rounded-lg bg-[#F5F6F7] border border-[#C1C4C8] hover:bg-[#C1C4C8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2E33]"
      aria-label="Toggle reduced motion"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    </button>
  );
}

// Font size controls
export function FontSizeControls() {
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");

  useEffect(() => {
    const saved = localStorage.getItem("font-size") as "small" | "medium" | "large" | null;
    if (saved) {
      setFontSize(saved);
      document.documentElement.style.fontSize = saved === "small" ? "14px" : saved === "large" ? "20px" : "16px";
    }
  }, []);

  const changeFontSize = (size: "small" | "medium" | "large") => {
    setFontSize(size);
    document.documentElement.style.fontSize = size === "small" ? "14px" : size === "large" ? "20px" : "16px";
    localStorage.setItem("font-size", size);
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Font size controls">
      <button
        onClick={() => changeFontSize("small")}
        aria-label="Small font size"
        aria-pressed={fontSize === "small"}
        className={`p-2 rounded-lg border border-[#C1C4C8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2E33] ${
          fontSize === "small" ? "bg-[#2B2E33] text-white" : "bg-[#F5F6F7] hover:bg-[#C1C4C8]"
        }`}
      >
        A
      </button>
      <button
        onClick={() => changeFontSize("medium")}
        aria-label="Medium font size"
        aria-pressed={fontSize === "medium"}
        className={`p-2 rounded-lg border border-[#C1C4C8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2E33] ${
          fontSize === "medium" ? "bg-[#2B2E33] text-white" : "bg-[#F5F6F7] hover:bg-[#C1C4C8]"
        }`}
      >
        <span className="text-lg">A</span>
      </button>
      <button
        onClick={() => changeFontSize("large")}
        aria-label="Large font size"
        aria-pressed={fontSize === "large"}
        className={`p-2 rounded-lg border border-[#C1C4C8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B2E33] ${
          fontSize === "large" ? "bg-[#2B2E33] text-white" : "bg-[#F5F6F7] hover:bg-[#C1C4C8]"
        }`}
      >
        <span className="text-xl">A</span>
      </button>
    </div>
  );
}

// Keyboard navigation hint
export function KeyboardHint({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-[#7B7F85]">
      <kbd className="px-2 py-1 bg-[#F5F6F7] border border-[#C1C4C8] rounded text-xs font-mono">
        {shortcut}
      </kbd>
      <span>{description}</span>
    </div>
  );
}

// Custom hook for managing focus
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    previousFocusRef.current?.focus();
  };

  const focusFirstElement = (container: HTMLElement | null) => {
    if (!container) return;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements[0]?.focus();
  };

  return { saveFocus, restoreFocus, focusFirstElement };
}

// Accessible form field wrapper
export function FormField({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactElement;
}) {
  const id = React.useId();

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[#2B2E33]"
      >
        {label}
        {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
      </label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": hint ? `${id}-hint` : undefined,
        "aria-invalid": error ? "true" : undefined,
        "aria-required": required,
      } as any)}
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-[#7B7F85]">
          {hint}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

// Screen reader only utility class is already in globals.css as .sr-only
// This component provides a programmatic way to add it
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

// Accessible menu with keyboard navigation
export function AccessibleMenu({ children, label }: { children: ReactNode; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      triggerRef.current?.focus();
    }
    if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault();
      const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
      firstItem?.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="focus:outline-none focus:ring-2 focus:ring-[#2B2E33]"
      >
        {label}
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={label}
          className="absolute z-50 mt-2 w-56 rounded-md bg-white shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Accessible menu item
export function MenuItem({ children, onClick, disabled }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }, [onClick]);

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      className={`px-4 py-2 cursor-pointer focus:outline-none focus:bg-[#F5F6F7] ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </div>
  );
}

// Accessible tabs component
export function AccessibleTabs({ children, defaultValue }: { children: ReactNode; defaultValue?: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue || '0');
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, total: number) => {
    let newIndex = index;
    
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % total;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + total) % total;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = total - 1;
    } else {
      return;
    }

    e.preventDefault();
    const tabs = tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs?.[newIndex]?.focus();
    tabs?.[newIndex]?.click();
  }, []);

  return (
    <div ref={tabsRef} role="tablist">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child) && 'value' in (child.props as any)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isActive: (child.props as any).value === activeTab,
            onSelect: () => setActiveTab((child.props as any).value),
            onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index, React.Children.count(children)),
          });
        }
        return child;
      })}
    </div>
  );
}

// Accessible tab panel
export function TabPanel({ children, value, isActive }: { children: ReactNode; value: string; isActive: boolean }) {
  return (
    <div
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isActive}
      className={isActive ? 'block' : 'hidden'}
    >
      {children}
    </div>
  );
}

// Accessible tab
export function Tab({ children, value, isActive, onSelect, onKeyDown }: { children: ReactNode; value: string; isActive: boolean; onSelect: () => void; onKeyDown: (e: React.KeyboardEvent) => void }) {
  return (
    <button
      role="tab"
      id={`tab-${value}`}
      aria-selected={isActive}
      aria-controls={`panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={`px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2B2E33] ${isActive ? 'bg-[#2B2E33] text-white' : 'bg-[#F5F6F7]'}`}
    >
      {children}
    </button>
  );
}

// Accessible tooltip
export function AccessibleTooltip({ children, content }: { children: ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipId = React.useId();

  return (
    <div
      ref={triggerRef}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {React.cloneElement(children as React.ReactElement<any>, {
        'aria-describedby': isVisible ? tooltipId : undefined,
      })}
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 px-2 py-1 bg-[#2B2E33] text-white text-sm rounded"
        >
          {content}
        </div>
      )}
    </div>
  );
}

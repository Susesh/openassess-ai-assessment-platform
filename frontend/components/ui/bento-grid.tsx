"use client";

import React, { ReactNode } from "react";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  cols?: number;
  gap?: string;
  padding?: string;
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
  onClick?: () => void;
}

export function BentoGrid({
  children,
  className = "",
  cols = 4,
  gap = "1rem",
  padding = "1.5rem",
}: BentoGridProps) {
  return (
    <div
      className={`bento-grid ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap,
        padding,
      }}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  children,
  className = "",
  colSpan = 1,
  rowSpan = 1,
  onClick,
}: BentoCardProps) {
  return (
    <div
      className={`bento-card ${className} ${onClick ? "cursor-pointer hover-lift-effect" : ""}`}
      style={{
        gridColumn: `span ${colSpan}`,
        gridRow: `span ${rowSpan}`,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// Masonry layout for asymmetric content
interface MasonryGridProps {
  children: ReactNode;
  className?: string;
  columns?: number;
  gap?: string;
}

export function MasonryGrid({
  children,
  className = "",
  columns = 3,
  gap = "1rem",
}: MasonryGridProps) {
  return (
    <div
      className={`masonry-grid ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        gridAutoRows: "10px",
      }}
    >
      {children}
    </div>
  );
}

interface MasonryItemProps {
  children: ReactNode;
  className?: string;
  height?: number;
}

export function MasonryItem({
  children,
  className = "",
  height = 200,
}: MasonryItemProps) {
  return (
    <div
      className={`masonry-item ${className}`}
      style={{
        gridRowEnd: `span ${Math.ceil(height / 10)}`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Safe date formatting utilities for SSR/Hydration compatibility
 * These functions produce consistent output between server and client
 */

/**
 * Format date safely for display - consistent between SSR and client
 * @param dateString - ISO date string from API
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateSafe(dateString: string): string {
  try {
    // Parse the ISO string and extract just the date part
    // This avoids timezone conversion issues
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "Invalid date";
  }
}

/**
 * Format datetime safely for display - consistent between SSR and client
 * @param dateString - ISO date string from API
 * @returns Formatted datetime string (YYYY-MM-DD HH:MM:SS)
 */
export function formatDateTimeSafe(dateString: string): string {
  try {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return "Invalid date";
  }
}

/**
 * Relative time format (e.g., "2 days ago")
 * Only use this in client-rendered content to avoid hydration mismatch
 * @param dateString - ISO date string from API
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return formatDateSafe(dateString);
  } catch {
    return "Invalid date";
  }
}

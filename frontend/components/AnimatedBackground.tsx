import styles from "./animated-background.module.css";

/**
 * Full-screen ambient background for OpenAssess.
 * Fixed at z-index 0; does not capture pointer events or affect scroll/layout.
 *
 * @example
 * ```tsx
 * <div className="relative min-h-screen">
 *   <AnimatedBackground />
 *   <main className="relative z-10">{children}</main>
 * </div>
 * ```
 */
export function AnimatedBackground() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.base} />
      <div className={styles.gridOverlay} />
      <div className={styles.vignette} />
    </div>
  );
}

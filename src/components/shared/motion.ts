// Presets de animação (framer-motion) usados pelas telas: `<motion.div {...fadeUp}>`.
export const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } } as const;
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } } as const;
/** fadeUp com atraso escalonado para listas. */
export const stagger = (i: number, step = 0.05, max = 0.4) => ({
  ...fadeUp,
  transition: { duration: 0.35, delay: Math.min(i * step, max) },
});

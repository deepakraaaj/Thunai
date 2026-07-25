"use client";

import { motion } from "framer-motion";

interface OrbProps {
  size?: number;
  onPress?: () => void;
  label?: string;
  expanded?: boolean;
}

/**
 * The breathing orb — a soft radial teal→lavender sphere that inhales/exhales
 * on a 6s loop. It IS the SOS button.
 */
export default function Orb({ size = 220, onPress, label, expanded = false }: OrbProps) {
  const inner = (
    <motion.div
      initial={false}
      animate={expanded ? { scale: 1.15 } : { scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      {/* glow halo */}
      <span
        aria-hidden
        className="orb-glow absolute rounded-full blur-2xl"
        style={{
          width: size * 1.15,
          height: size * 1.15,
          background:
            "radial-gradient(circle at 50% 45%, rgba(45,212,191,0.55), rgba(167,139,250,0.35) 55%, transparent 72%)",
        }}
      />
      {/* the sphere */}
      <span
        aria-hidden
        className="orb-breathe absolute rounded-full"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at 38% 32%, #7ff0e0 0%, #2dd4bf 34%, #7c6cf0 78%, #4c3aa8 100%)",
          boxShadow:
            "inset 0 -18px 50px rgba(76,58,168,0.6), inset 0 14px 40px rgba(255,255,255,0.28), 0 0 60px rgba(45,212,191,0.35)",
        }}
      />
    </motion.div>
  );

  if (!onPress) return inner;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label ?? "SOS — press for in-the-moment support"}
      className="relative grid place-items-center rounded-full transition-transform active:scale-95"
      style={{ width: size, height: size }}
    >
      {inner}
    </button>
  );
}

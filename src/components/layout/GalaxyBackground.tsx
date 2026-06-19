"use client";

import { useState, useEffect } from "react";

interface Star {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
}

// Deterministic pseudo-random generator (mulberry32) so SSR and client
// produce the exact same star field — avoids hydration mismatch.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateStars(): Star[] {
  const rand = mulberry32(42); // fixed seed for deterministic output
  const out: Star[] = [];
  const n = 70;
  for (let i = 0; i < n; i++) {
    out.push({
      top: `${rand() * 100}%`,
      left: `${rand() * 100}%`,
      size: rand() * 2 + 1,
      delay: `${rand() * 6}s`,
      duration: `${3 + rand() * 5}s`,
      opacity: 0.3 + rand() * 0.6,
    });
  }
  return out;
}

export function GalaxyBackground() {
  // Generate stars once. Using a deterministic seed means SSR and client
  // produce identical markup, so no hydration mismatch.
  const [stars] = useState<Star[]>(generateStars);

  // Suppress any unused warning — stars is rendered below.
  useEffect(() => {
    // no-op: stars are purely decorative
  }, [stars]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#0b1230_0%,_#070a1c_45%,_#04050f_100%)]" />
      {/* Nebula blobs */}
      <div className="absolute -top-40 -left-32 h-[42rem] w-[42rem] rounded-full bg-[var(--neon-violet)] opacity-[0.12] blur-[140px]" />
      <div className="absolute top-1/3 -right-40 h-[38rem] w-[38rem] rounded-full bg-[var(--neon-cyan)] opacity-[0.10] blur-[150px]" />
      <div className="absolute -bottom-52 left-1/4 h-[40rem] w-[40rem] rounded-full bg-[var(--neon-magenta)] opacity-[0.10] blur-[150px]" />
      {/* Subtle grid */}
      <div className="absolute inset-0 grid-overlay opacity-40" />
      {/* Twinkling stars */}
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `astro-twinkle ${s.duration} ease-in-out ${s.delay} infinite`,
            boxShadow: "0 0 6px rgba(255,255,255,0.6)",
          }}
        />
      ))}
      {/* Orbit ring decoration */}
      <div className="absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 animate-spin-slow" />
      <div className="absolute left-1/2 top-1/2 h-[50vmin] w-[50vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
    </div>
  );
}

"use client";

import { useMemo } from "react";

interface Star {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
  opacity: number;
}

export function GalaxyBackground() {
  const stars = useMemo<Star[]>(() => {
    const out: Star[] = [];
    const n = 70;
    for (let i = 0; i < n; i++) {
      out.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() * 2 + 1,
        delay: `${Math.random() * 6}s`,
        duration: `${3 + Math.random() * 5}s`,
        opacity: 0.3 + Math.random() * 0.6,
      });
    }
    return out;
  }, []);

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

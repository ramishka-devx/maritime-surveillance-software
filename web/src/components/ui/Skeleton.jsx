import React from 'react';

// Loading placeholder for Broadsheet pages: an ink-tinted block that pulses (still for reduced
// motion). Size and shape come from className/style.
export default function Skeleton({ className = '', style }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-sm bg-bs-ink/[.08] animate-pulse motion-reduce:animate-none ${className}`}
      style={style}
    />
  );
}

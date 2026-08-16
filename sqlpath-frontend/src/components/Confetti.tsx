'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#e86b32', '#656031', '#ffb693', '#4edea3', '#f2e2a8', '#ba1a1a'];

export default function Confetti({ count = 22 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 80 + Math.random() * 90;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 20,
          rotate: Math.random() * 480 - 240,
          color: COLORS[i % COLORS.length],
          size: 5 + Math.random() * 5,
          delay: Math.random() * 0.1,
          shape: i % 3 === 0 ? '50%' : '2px',
        };
      }),
    [count],
  );

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
      {particles.map(p => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
          transition={{ duration: 0.9, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
          }}
        />
      ))}
    </div>
  );
}

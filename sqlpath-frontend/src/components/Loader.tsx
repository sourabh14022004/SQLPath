'use client';

import { motion } from 'framer-motion';

export default function Loader({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <motion.div
      className={`rounded-full border-2 border-primary/15 border-t-primary ${className}`}
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-3"
      >
        <Loader size={32} />
      </motion.div>
    </div>
  );
}

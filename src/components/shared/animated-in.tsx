"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Small entrance animation for server-rendered dashboard content: fade + a
// short rise, staggered by `delay`. Kept restrained (~200ms, ease-out) to
// match the kanban board's motion language rather than a spring bounce.
export function AnimatedIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

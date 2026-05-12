"use client";

import { motion } from "framer-motion";

interface AylnorLogoProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function AylnorLogo({ size = "md", animate = true }: AylnorLogoProps) {
  const sizes = {
    sm: { container: "w-8 h-8", text: "text-lg" },
    md: { container: "w-12 h-12", text: "text-2xl" },
    lg: { container: "w-16 h-16", text: "text-3xl" },
  };

  const Logo = animate ? motion.div : "div";

  return (
    <Logo
      className={`${sizes[size].container} relative flex items-center justify-center`}
      {...(animate && {
        whileHover: { scale: 1.05 },
        transition: { type: "spring", stiffness: 400, damping: 10 },
      })}
    >
      {/* Outer geometric frame */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Circular border with AI nodes */}
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          fill="none"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* AI neural network nodes */}
        <motion.circle
          cx="50"
          cy="20"
          r="3"
          className="text-primary"
          fill="currentColor"
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.5 }}
        />
        <motion.circle
          cx="80"
          cy="35"
          r="3"
          className="text-primary"
          fill="currentColor"
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.6 }}
        />
        <motion.circle
          cx="80"
          cy="65"
          r="3"
          className="text-primary"
          fill="currentColor"
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.7 }}
        />
        <motion.circle
          cx="50"
          cy="80"
          r="3"
          className="text-primary"
          fill="currentColor"
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.8 }}
        />
        <motion.circle
          cx="20"
          cy="65"
          r="3"
          className="text-primary"
          fill="currentColor"
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 0.9 }}
        />
        <motion.circle
          cx="20"
          cy="35"
          r="3"
          className="text-primary"
          fill="currentColor"
          initial={animate ? { scale: 0 } : undefined}
          animate={animate ? { scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: 1.0 }}
        />

        {/* Connection lines */}
        <motion.path
          d="M50 20 L80 35 L80 65 L50 80 L20 65 L20 35 Z"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary/30"
          fill="none"
          initial={animate ? { pathLength: 0 } : undefined}
          animate={animate ? { pathLength: 1 } : undefined}
          transition={{ duration: 1.2, delay: 1.1, ease: "easeInOut" }}
        />
      </svg>

      {/* Center A letter */}
      <motion.span
        className={`${sizes[size].text} font-bold text-primary relative z-10`}
        initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.5, delay: 1.3 }}
      >
        A
      </motion.span>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
    </Logo>
  );
}

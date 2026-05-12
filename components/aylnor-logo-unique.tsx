"use client";

import { motion } from "framer-motion";

interface AylnorLogoUniqueProps {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function AylnorLogoUnique({ size = "md", animate = true }: AylnorLogoUniqueProps) {
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
      {/* SVG Logo - AY Letter Combination */}
      <svg
        viewBox="0 0 120 120"
        className="absolute inset-0 w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background glow circle */}
        <motion.circle
          cx="60"
          cy="60"
          r="55"
          fill="url(#glowGradient)"
          opacity="0.1"
          initial={animate ? { scale: 0, opacity: 0 } : undefined}
          animate={animate ? { scale: 1, opacity: 0.1 } : undefined}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        
        {/* Outer ring */}
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          stroke="url(#primaryGradient)"
          strokeWidth="2"
          fill="none"
          initial={animate ? { pathLength: 0, opacity: 0 } : undefined}
          animate={animate ? { pathLength: 1, opacity: 1 } : undefined}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Letter A - Base/Foundation */}
        <motion.g
          initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={animate ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {/* Left leg of A */}
          <line
            x1="35"
            y1="75"
            x2="50"
            y2="35"
            stroke="url(#primaryGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Right leg of A */}
          <line
            x1="85"
            y1="75"
            x2="70"
            y2="35"
            stroke="url(#primaryGradient)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Cross bar of A */}
          <line
            x1="42"
            y1="55"
            x2="78"
            y2="55"
            stroke="url(#primaryGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </motion.g>
        
        {/* Letter Y - Light/Rays emerging from top */}
        <motion.g
          initial={animate ? { opacity: 0, y: 10 } : undefined}
          animate={animate ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {/* Stem of Y */}
          <line
            x1="60"
            y1="30"
            x2="60"
            y2="50"
            stroke="url(#accentGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Left branch of Y */}
          <line
            x1="60"
            y1="40"
            x2="45"
            y2="25"
            stroke="url(#accentGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right branch of Y */}
          <line
            x1="60"
            y1="40"
            x2="75"
            y2="25"
            stroke="url(#accentGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          
          {/* Light rays emanating from Y */}
          <motion.g opacity="0.6">
            <motion.line
              x1="60"
              y1="25"
              x2="40"
              y2="15"
              stroke="#F39C12"
              strokeWidth="1"
              strokeLinecap="round"
              initial={animate ? { pathLength: 0 } : undefined}
              animate={animate ? { pathLength: 1 } : undefined}
              transition={{ duration: 1, delay: 1.2 }}
            />
            <motion.line
              x1="60"
              y1="25"
              x2="80"
              y2="15"
              stroke="#F39C12"
              strokeWidth="1"
              strokeLinecap="round"
              initial={animate ? { pathLength: 0 } : undefined}
              animate={animate ? { pathLength: 1 } : undefined}
              transition={{ duration: 1, delay: 1.3 }}
            />
            <motion.line
              x1="60"
              y1="20"
              x2="60"
              y2="10"
              stroke="#F39C12"
              strokeWidth="1"
              strokeLinecap="round"
              initial={animate ? { pathLength: 0 } : undefined}
              animate={animate ? { pathLength: 1 } : undefined}
              transition={{ duration: 1, delay: 1.4 }}
            />
          </motion.g>
        </motion.g>
        
        {/* Connection dots between A and Y */}
        <motion.g>
          {[35, 45, 55, 65, 75].map((y, i) => (
            <motion.circle
              key={i}
              cx="60"
              cy={y}
              r="1.5"
              fill="#FF6B35"
              initial={animate ? { scale: 0 } : undefined}
              animate={animate ? { scale: 1 } : undefined}
              transition={{ duration: 0.3, delay: 1.5 + i * 0.1 }}
            />
          ))}
        </motion.g>
        
        {/* Gradients */}
        <defs>
          <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#F39C12" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F39C12" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
          <radialGradient id="glowGradient">
            <stop offset="0%" stopColor="#FF6B35" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-xl rounded-full opacity-60" />
    </Logo>
  );
}

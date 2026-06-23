"use client";

import { motion } from "framer-motion";

const AURA_STYLE = {
  background: `
    radial-gradient(ellipse at 15% 60%, rgba(0,181,184,0.30) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 25%, rgba(232,0,125,0.22) 0%, transparent 55%),
    radial-gradient(ellipse at 65% 80%, rgba(123,47,190,0.22) 0%, transparent 50%),
    radial-gradient(ellipse at 35% 20%, rgba(0,200,83,0.18) 0%, transparent 45%),
    radial-gradient(ellipse at 80% 70%, rgba(255,109,0,0.18) 0%, transparent 45%),
    #ffffff
  `,
};

const LOGO_STYLE = {
  fontSize: "clamp(64px, 10vw, 96px)",
  background: "linear-gradient(135deg, #00B5B8 0%, #7B2FBE 50%, #E8007D 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

export default function HeroSection() {
  return (
    <section
      className="relative px-6 pt-20 pb-16 text-center overflow-hidden"
      style={AURA_STYLE}
    >
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Logo */}
        <motion.h1
          className="font-[family-name:var(--font-righteous)] leading-none mb-5"
          style={LOGO_STYLE}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          Pathways
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="font-[family-name:var(--font-dm-sans)] font-medium text-[#333333]"
          style={{ fontSize: "clamp(18px, 2.5vw, 22px)" }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          The launchpad for students who want to stay ahead.
        </motion.p>
      </div>
    </section>
  );
}

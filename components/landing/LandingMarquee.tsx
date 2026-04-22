"use client"

import { motion } from "framer-motion"

const items = [
  "Desierto de Atacama",
  "VLT · Paranal",
  "La Silla Observatory",
  "320 noches despejadas",
  "Visita gratuita",
  "Astronomía de clase mundial",
  "ESO Chile",
  "Reserva tu lugar",
]

export function LandingMarquee() {
  return (
    <div className="overflow-hidden border-y border-stone-800 bg-stone-900/40 py-4">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="text-xs font-medium tracking-widest uppercase text-stone-500 shrink-0"
          >
            {item}
            <span className="ml-12 text-amber-600/40">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

"use client"

import { motion } from "framer-motion"

const items = [
  "Desierto de Atacama",
  "Pueblo Diaguita",
  "Pueblo Chango",
  "VLT · Paranal",
  "La Silla 1969",
  "320 noches despejadas",
  "Visita gratuita",
  "2.635 m.s.n.m.",
  "Región de Coquimbo",
  "Región de Antofagasta",
  "ESO Chile",
  "Astronomía de clase mundial",
]

export function LandingMarquee() {
  return (
    <div className="overflow-hidden border-y border-tierra-500/15 bg-arena-200/80 py-3.5 backdrop-blur-sm">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center shrink-0 text-xs tracking-[0.2em] uppercase text-tinta-500"
          >
            <span className="px-8">{item}</span>
            <span className="text-tierra-400/60" aria-hidden="true">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}

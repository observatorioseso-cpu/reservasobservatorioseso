"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border bg-stone-50 px-4 py-2.5 text-stone-900",
          "text-sm placeholder:text-stone-400",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:border-amber-500",
          error
            ? "border-red-400 focus:ring-red-400/60 focus:border-red-400"
            : "border-stone-300 hover:border-stone-400",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

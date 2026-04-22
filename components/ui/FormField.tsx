import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-stone-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        )}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-red-500 flex items-center gap-1">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-stone-500">{hint}</p>
      )}
    </div>
  )
}

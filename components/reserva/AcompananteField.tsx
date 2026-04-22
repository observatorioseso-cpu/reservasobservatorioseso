"use client"

import type { UseFormRegister, FieldErrors } from "react-hook-form"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"
import { cn } from "@/lib/utils"

interface AcompananteFieldProps {
  index: number
  register: UseFormRegister<any>
  errors: FieldErrors
  onRemove: () => void
}

export function AcompananteField({ index, register, errors, onRemove }: AcompananteFieldProps) {
  const errores = (errors.acompanantes as any)?.[index]

  return (
    <div className={cn(
      "rounded-xl border border-stone-200 bg-white p-5",
      "shadow-sm"
    )}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
          Acompañante {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          aria-label={`Eliminar acompañante ${index + 1}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Nombre" htmlFor={`ac-nombre-${index}`} error={errores?.nombre?.message} required>
          <Input
            id={`ac-nombre-${index}`}
            placeholder="María"
            error={errores?.nombre?.message}
            {...register(`acompanantes.${index}.nombre`)}
          />
        </FormField>
        <FormField label="Apellido" htmlFor={`ac-apellido-${index}`} error={errores?.apellido?.message} required>
          <Input
            id={`ac-apellido-${index}`}
            placeholder="González"
            error={errores?.apellido?.message}
            {...register(`acompanantes.${index}.apellido`)}
          />
        </FormField>
      </div>

      <div className="mt-4">
        <FormField label="RUT o Pasaporte" htmlFor={`ac-doc-${index}`} error={errores?.documento?.message}>
          <Input
            id={`ac-doc-${index}`}
            placeholder="12.345.678-9 o ABC123456"
            error={errores?.documento?.message}
            {...register(`acompanantes.${index}.documento`)}
          />
        </FormField>
      </div>
    </div>
  )
}

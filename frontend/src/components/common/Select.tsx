// src/components/common/Select.tsx
import React, { SelectHTMLAttributes } from "react"
import { SelectOption } from "../../types/ui"

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  label?: string
  error?: string
}

export const Select: React.FC<SelectProps> = ({
  options,
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-700">{label}</label>
      )}
      <select
        className={`w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors ${
          error ? "border-red-500" : ""
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  )
}

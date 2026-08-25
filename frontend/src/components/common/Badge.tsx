// src/components/common/Badge.tsx
import React from "react"

export interface BadgeProps {
  label: string
  variant?: "critical" | "warning" | "info" | "online" | "offline" | "primary" | "ghost"
  size?: "sm" | "md"
  icon?: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "info",
  size = "sm",
  icon,
  className = "",
}) => {
  const variantStyles = {
    critical: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    online: "bg-emerald-50 text-emerald-700 border-emerald-200",
    offline: "bg-slate-100 text-slate-600 border-slate-200",
    primary: "bg-blue-600 text-white border-blue-600",
    ghost: "bg-transparent text-slate-600 border-slate-200",
  }

  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 font-semibold",
    md: "text-xs px-2.5 py-1 font-semibold",
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      <span>{label}</span>
    </span>
  )
}

// src/components/common/Spinner.tsx
import React from "react"

export const Spinner: React.FC<{
  size?: "sm" | "md" | "lg"
  className?: string
}> = ({ size = "md", className = "" }) => {
  const sizeMap = {
    sm: "w-3.5 h-3.5 border-2",
    md: "w-5 h-5 border-2",
    lg: "w-8 h-8 border-3",
  }

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeMap[size]} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

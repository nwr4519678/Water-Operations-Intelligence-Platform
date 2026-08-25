// src/components/charts/TimeRangeSelector.tsx
import React from "react"

export interface TimeRangeSelectorProps {
  selected: string
  onChange: (range: string) => void
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selected,
  onChange,
}) => {
  const ranges = [
    { label: "6H", value: "6H" },
    { label: "24H", value: "24H" },
    { label: "7D", value: "7D" },
    { label: "30D", value: "30D" },
  ]

  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
      {ranges.map((r) => {
        const isSelected = selected === r.value
        return (
          <button
            key={r.value}
            onClick={() => onChange(r.value)}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              isSelected
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {r.label}
          </button>
        )
      })}
    </div>
  )
}

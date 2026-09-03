// src/components/charts/TimeRangeSelector.tsx
import React, { useRef, useState, useEffect } from "react"
import { CalendarRange } from "lucide-react"

export interface TimeRangeSelectorProps {
  selected: string
  onChange: (range: string) => void
  disabled?: boolean
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selected,
  onChange,
  disabled = false,
}) => {
  const ranges = [
    { label: "3M", value: "3M", description: "Past Quarter" },
    { label: "6M", value: "6M", description: "Past Half-Year" },
    { label: "12M", value: "12M", description: "Past Year" },
    { label: "24M", value: "24M", description: "Two Years" },
    { label: "All history", value: "ALL", description: "Full Satellite Archive" },
  ]

  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number
    width: number
    opacity: number
  }>({
    left: 0,
    width: 0,
    opacity: 0,
  })

  // Measure and slide the active background pill smoothly
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return
      const activeBtn = containerRef.current.querySelector<HTMLButtonElement>(
        `[data-range="${selected}"]`,
      )
      if (activeBtn) {
        setIndicatorStyle({
          left: activeBtn.offsetLeft,
          width: activeBtn.offsetWidth,
          opacity: 1,
        })
      }
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    return () => window.removeEventListener("resize", updatePosition)
  }, [selected])

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner select-none"
      role="group"
      aria-label="Chart Time Range Selector"
    >
      {/* Smooth Sliding Active Pill Indicator */}
      <div
        className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm border border-slate-200/70 transition-all duration-300 ease-out pointer-events-none"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
        }}
      />

      {ranges.map((r) => {
        const isSelected = selected === r.value
        return (
          <button
            key={r.value}
            data-range={r.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.value)}
            title={r.description}
            className={`relative z-10 px-3 py-1.5 text-xs font-black rounded-lg transition-colors duration-200 cursor-pointer flex items-center gap-1.5 ${
              isSelected
                ? "text-blue-600"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {r.value === "ALL" && (
              <CalendarRange
                className={`w-3.5 h-3.5 transition-colors duration-200 ${
                  isSelected ? "text-blue-600" : "text-slate-400"
                }`}
              />
            )}
            <span>{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}
export default TimeRangeSelector

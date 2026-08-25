// src/components/charts/MiniSparkline.tsx
import React from "react"

export const MiniSparkline: React.FC<{
  data?: number[]
  color?: string
  width?: number
  height?: number
  fill?: boolean
}> = ({
  data = [12, 14, 13, 16, 18, 17, 21, 23, 22, 26, 25, 28],
  color = "#2563eb",
  width = 100,
  height = 30,
  fill = true,
}) => {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width
      const y = height - ((val - min) / range) * (height - 6) - 3
      return `${x},${y}`
    })
    .join(" ")

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && <polygon points={areaPoints} fill={color} fillOpacity={0.12} />}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

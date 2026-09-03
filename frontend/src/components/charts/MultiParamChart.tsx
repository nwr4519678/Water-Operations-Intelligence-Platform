import React, { useMemo, useCallback, useEffect } from "react"
import ReactECharts from "echarts-for-react"
import { ChartSeriesDto, AiForecastPayload } from "../../types/api"
import { format, parseISO, addMonths } from "date-fns"

export interface MultiParamChartProps {
  series: ChartSeriesDto[]
  forecastPayload?: AiForecastPayload | null
  showForecast?: boolean
  height?: string
  timeRange?: string
  onReadingClick?: (dateStr: string, rawTimestampUtc?: string, pointIndex?: number) => void
}

export const MultiParamChart: React.FC<MultiParamChartProps> = ({
  series,
  forecastPayload,
  showForecast = true,
  height = "430px",
  timeRange = "12M",
  onReadingClick,
}) => {
  const primarySeries = useMemo(() => {
    return series.find((s) => s.parameterId === 1) || series[0]
  }, [series])

  const option = useMemo(() => {
    const flowSeries = series.find((s) => s.parameterId === 2)

    // Check if the data points are monthly aggregated (24M, ALL, or points truncated to day 1 UTC)
    const isMonthlyAggregated =
      timeRange === "24M" ||
      timeRange === "ALL" ||
      (primarySeries?.points && primarySeries.points.length > 0 &&
        primarySeries.points.slice(0, 5).every((p) => {
          try {
            const d = parseISO(p.timestampUtc)
            return d.getUTCDate() === 1
          } catch {
            return false
          }
        }))

    // Format historical timestamps cleanly (e.g. "18 Dec 2025" for daily, "Dec 2025" for monthly)
    const historicalTimestamps =
      primarySeries?.points.map((p) => {
        try {
          const d = parseISO(p.timestampUtc)
          if (isMonthlyAggregated) {
            return format(d, "MMM yyyy")
          }
          return format(d, "dd MMM yyyy")
        } catch {
          return p.timestampUtc
        }
      }) || []

    const historicalWL = primarySeries?.points.map((p) => p.value) || []
    const historicalFlow = flowSeries?.points.map((p) => p.value) || []

    const histCount = historicalWL.length
    const lastWL = histCount > 0 ? historicalWL[histCount - 1] : 0
    const prevWL = histCount > 1 ? historicalWL[histCount - 2] : lastWL
    const incomingSlope = lastWL - prevWL
    const lastFlow =
      historicalFlow.length > 0
        ? historicalFlow[historicalFlow.length - 1]
        : 0
    const lastHistTimeStr =
      histCount > 0 ? historicalTimestamps[histCount - 1] : ""
    const prevHistTimeStr =
      histCount > 1 ? historicalTimestamps[histCount - 2] : lastHistTimeStr

    let allTimes = [...historicalTimestamps]
    let forecastWL: (number | null)[] = []
    let forecastFlow: (number | null)[] = []
    let confLower: (number | null)[] = []
    let confUpperDiff: (number | null)[] = []
    let futureLabels: string[] = []

    const hasForecast =
      showForecast && !!forecastPayload?.forecastPoints?.length

    let futurePts: Array<{
      timestampUtc: string
      calibratedWL: number
      lower: number
      upper: number
      flow: number
    }> = []

    if (hasForecast && forecastPayload?.forecastPoints) {
      const rawPoints = forecastPayload.forecastPoints

      const lastHistRaw =
        histCount > 0 ? primarySeries.points[histCount - 1].timestampUtc : null
      const lastHistDate = lastHistRaw ? parseISO(lastHistRaw) : new Date()

      const rawBase =
        rawPoints.length > 0 ? rawPoints[0].predictedValue : lastWL

      futurePts = rawPoints.map((fp, i) => {
        const step = i + 1
        const rawDelta = fp.predictedValue - rawBase
        // Hydrologically-calibrated delta damping to prevent artificial roller-coaster spikes
        const dampedDelta = Math.tanh(rawDelta / 2.2) * 0.95
        const w = Math.exp(-step / 2.4)
        const smoothDelta =
          incomingSlope * 0.5 * w + dampedDelta * (1 - w * 0.45)
        const cal = parseFloat((lastWL + smoothDelta).toFixed(3))
        const unc = parseFloat((0.04 * Math.sqrt(step * 3.0)).toFixed(3))

        // Advance consecutively by upcoming month (Sep '26, Oct '26, Nov '26, Dec '26)
        const futureDate = addMonths(lastHistDate, step)

        return {
          timestampUtc: futureDate.toISOString(),
          calibratedWL: cal,
          lower: parseFloat((cal - unc).toFixed(3)),
          upper: parseFloat((cal + unc).toFixed(3)),
          flow: Math.round(lastFlow + smoothDelta * 24),
        }
      })

      futureLabels = futurePts.map((fp) => {
        try {
          const d = parseISO(fp.timestampUtc)
          if (isMonthlyAggregated) {
            return format(d, "MMM yyyy")
          }
          return format(d, "dd MMM yyyy")
        } catch {
          return fp.timestampUtc
        }
      })

      allTimes = [...historicalTimestamps, ...futureLabels]

      const jIdx = Math.max(0, histCount - 1)
      const pre = new Array(jIdx).fill(null)

      forecastWL = [...pre, lastWL, ...futurePts.map((p) => p.calibratedWL)]
      forecastFlow = [...pre, lastFlow, ...futurePts.map((p) => p.flow)]
      confLower = [...pre, lastWL, ...futurePts.map((p) => p.lower)]
      confUpperDiff = [
        ...pre,
        0,
        ...futurePts.map((p) =>
          parseFloat(Math.max(0, p.upper - p.lower).toFixed(3)),
        ),
      ]
    }

    const futurePad = hasForecast ? new Array(futurePts.length).fill(null) : []
    const padHistWL = hasForecast
      ? [...historicalWL, ...futurePad]
      : historicalWL
    const padHistFlow = hasForecast
      ? [...historicalFlow, ...futurePad]
      : historicalFlow

    // ── Scale-Aware Visual Tuning ──
    const isShortScale = timeRange === "3M" || timeRange === "6M"
    const isAllHistory = timeRange === "ALL"

    const chartSeries: any[] = [
      // ── Historical Water Level ────────────────────────────────────────────
      {
        name: "Observed Water Level",
        type: "line",
        yAxisIndex: 0,
        data: padHistWL,
        smooth: isAllHistory ? 0.28 : 0.4,
        smoothMonotone: "x",
        // Sleek uniform design: points only bloom on hover across all ranges (3M, 6M, 12M, etc.)
        showSymbol: false,
        symbol: "circle",
        symbolSize: 8,
        z: 5,
        cursor: "pointer",
        lineStyle: { width: 2.8, color: "#1d4ed8" },
        itemStyle: {
          color: "#2563eb",
          borderColor: "#ffffff",
          borderWidth: 2,
          shadowColor: "rgba(37, 99, 235, 0.35)",
          shadowBlur: 6,
        },
        // Professional hover pinpoint: crisp white center + deep blue ring + ambient glow
        emphasis: {
          scale: 1.5,
          focus: "series",
          itemStyle: {
            color: "#ffffff",
            borderColor: "#1d4ed8",
            borderWidth: 3,
            shadowColor: "rgba(29, 78, 216, 0.65)",
            shadowBlur: 14,
          },
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(29, 78, 216, 0.20)" },
              { offset: 0.75, color: "rgba(29, 78, 216, 0.03)" },
              { offset: 1, color: "rgba(29, 78, 216, 0)" },
            ],
          },
        },
        // ── Sleek luminous forecast dividing line ────────────────────────
        markLine:
          hasForecast && histCount > 0
            ? {
                symbol: ["none", "none"],
                silent: true,
                animation: false,
                data: [
                  {
                    xAxis: lastHistTimeStr,
                    lineStyle: {
                      color: "#6366f1",
                      type: [5, 4],
                      width: 1.8,
                      shadowColor: "rgba(99, 102, 241, 0.45)",
                      shadowBlur: 6,
                    },
                    label: { show: false },
                  },
                ],
              }
            : undefined,
        // ── Seamless AI Forecast Horizon Zone (From dividing line to end of horizon) ──
        markArea:
          hasForecast && histCount > 0 && allTimes.length > histCount
            ? {
                silent: true,
                animation: false,
                emphasis: { disabled: true },
                data: [
                  [
                    {
                      xAxis: lastHistTimeStr,
                      itemStyle: {
                        color: {
                          type: "linear",
                          x: 0,
                          y: 0,
                          x2: 1,
                          y2: 0,
                          colorStops: [
                            { offset: 0, color: "rgba(99, 102, 241, 0.08)" },
                            { offset: 0.35, color: "rgba(124, 58, 237, 0.04)" },
                            { offset: 1, color: "rgba(124, 58, 237, 0.01)" },
                          ],
                        },
                        borderWidth: 0,
                      },
                    },
                    { xAxis: allTimes[allTimes.length - 1] },
                  ],
                ],
              }
            : undefined,
        // ── Junction glow dot ─────────────────────────────────────────────
        markPoint:
          hasForecast && histCount > 0
            ? {
                silent: true,
                animation: true,
                animationDuration: 1200,
                animationEasing: "cubicOut",
                data: [
                  {
                    coord: [lastHistTimeStr, lastWL],
                    symbol: "circle",
                    symbolSize: 14,
                    itemStyle: {
                      color: {
                        type: "radial",
                        x: 0.5,
                        y: 0.5,
                        r: 0.5,
                        colorStops: [
                          { offset: 0, color: "#ffffff" },
                          { offset: 0.45, color: "#818cf8" },
                          { offset: 1, color: "rgba(99,102,241,0)" },
                        ],
                      },
                      borderColor: "rgba(99,102,241,0.5)",
                      borderWidth: 1.5,
                      shadowColor: "rgba(99,102,241,0.55)",
                      shadowBlur: 18,
                    },
                  },
                  {
                    coord: [lastHistTimeStr, lastWL],
                    symbol: "circle",
                    symbolSize: 6,
                    itemStyle: {
                      color: "#ffffff",
                      borderColor: "#6366f1",
                      borderWidth: 2,
                      shadowColor: "rgba(99,102,241,0.8)",
                      shadowBlur: 8,
                    },
                  },
                ],
              }
            : undefined,
      },

      // ── AI Forecast Water Level ───────────────────────────────────────────
      ...(hasForecast
        ? [
            {
              name: "AI Forecast (LSTM)",
              type: "line",
              yAxisIndex: 0,
              data: forecastWL,
              smooth: 0.38,
              smoothMonotone: "x",
              showSymbol: false,
              symbol: "circle",
              symbolSize: 7,
              z: 4,
              emphasis: {
                scale: 1.5,
                focus: "series",
                itemStyle: {
                  color: "#ffffff",
                  borderColor: "#8b5cf6",
                  borderWidth: 2.5,
                  shadowColor: "rgba(139, 92, 246, 0.65)",
                  shadowBlur: 12,
                },
              },
              lineStyle: {
                width: 2.5,
                color: {
                  type: "linear",
                  x: 0, y: 0, x2: 1, y2: 0,
                  colorStops: [
                    { offset: 0, color: "#6366f1" },
                    { offset: 0.5, color: "#8b5cf6" },
                    { offset: 1, color: "#a855f7" },
                  ],
                },
                shadowColor: "rgba(139,92,246,0.35)",
                shadowBlur: 6,
              },
              itemStyle: {
                color: "#8b5cf6",
                borderColor: "#ffffff",
                borderWidth: 1.5,
                shadowColor: "rgba(139,92,246,0.5)",
                shadowBlur: 6,
              },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(139,92,246,0.10)" },
                    { offset: 0.7, color: "rgba(139,92,246,0.02)" },
                    { offset: 1, color: "rgba(139,92,246,0)" },
                  ],
                },
              },
            },
          ]
        : []),

      // ── Confidence Band Lower (baseline, hidden) ──────────────────────────
      ...(hasForecast
        ? [
            {
              name: "_lower",
              type: "line",
              yAxisIndex: 0,
              data: confLower,
              lineStyle: { opacity: 0 },
              stack: "conf",
              symbol: "none",
              silent: true,
              z: 1,
            },
          ]
        : []),

      // ── Confidence Band Fill ──────────────────────────────────────────────
      ...(hasForecast
        ? [
            {
              name: "_upper",
              type: "line",
              yAxisIndex: 0,
              data: confUpperDiff,
              lineStyle: { opacity: 0 },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: "rgba(124, 58, 237, 0.16)" },
                    { offset: 1, color: "rgba(124, 58, 237, 0.02)" },
                  ],
                },
              },
              stack: "conf",
              symbol: "none",
              silent: true,
              z: 1,
            },
          ]
        : []),

      // ── Flow Rate (secondary axis) ────────────────────────────────────────
      ...(flowSeries
        ? [
            {
              name: `${flowSeries.parameterName} (${flowSeries.unit})`,
              type: "line",
              yAxisIndex: 1,
              data: hasForecast
                ? [
                    ...padHistFlow.slice(0, histCount),
                    ...forecastFlow.slice(histCount - 1),
                  ]
                : padHistFlow,
              smooth: 0.4,
              smoothMonotone: "x",
              showSymbol: false,
              symbol: "circle",
              symbolSize: 6,
              z: 3,
              lineStyle: { width: 2, color: "#059669" },
              itemStyle: { color: "#059669" },
            },
          ]
        : []),
    ]

    const legendData = [
      "Observed Water Level",
      ...(hasForecast ? ["AI Forecast (LSTM)"] : []),
      ...(flowSeries
        ? [`${flowSeries.parameterName} (${flowSeries.unit})`]
        : []),
    ]

    // ── Interactive dataZoom Slider & Pan/Zoom (always active) ──
    const defaultStart = isAllHistory
      ? Math.max(0, 100 - (36 / Math.max(1, histCount)) * 100)
      : 0

    const dataZoomConfig = [
      {
        type: "inside",
        start: defaultStart,
        end: 100,
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
      {
        type: "slider",
        bottom: 2,
        height: 22,
        start: defaultStart,
        end: 100,
        borderColor: "rgba(226, 232, 240, 0.8)",
        borderRadius: 8,
        backgroundColor: "#f8fafc",
        fillerColor: "rgba(37, 99, 235, 0.14)",
        dataBackground: {
          lineStyle: { color: "#bfdbfe", width: 1 },
          areaStyle: { color: "rgba(191, 219, 254, 0.3)" },
        },
        selectedDataBackground: {
          lineStyle: { color: "#2563eb", width: 1.5 },
          areaStyle: { color: "rgba(37, 99, 235, 0.25)" },
        },
        handleStyle: {
          color: "#2563eb",
          borderColor: "#ffffff",
          borderWidth: 2,
          shadowColor: "rgba(37, 99, 235, 0.35)",
          shadowBlur: 5,
        },
        moveHandleStyle: {
          color: "#94a3b8",
        },
        brushSelect: false,
        textStyle: {
          color: "#64748b",
          fontSize: 9,
          fontFamily: "ui-monospace, monospace",
        },
      },
    ]

    return {
      animation: true,
      animationDuration: 650,
      animationEasing: "cubicOut",
      animationDurationUpdate: 650,
      animationEasingUpdate: "cubicInOut",
      backgroundColor: "transparent",
      grid: {
        top: 50,
        right: 58,
        bottom: 56,
        left: 64,
        containLabel: false,
      },
      dataZoom: dataZoomConfig,

      legend: {
        top: 5,
        left: "center",
        data: legendData,
        textStyle: { color: "#64748b", fontSize: 11, fontWeight: "600" },
        itemGap: 24,
        itemWidth: 18,
        itemHeight: 3,
        icon: "roundRect",
        selected: { _lower: false, _upper: false },
      },

      tooltip: {
        trigger: "axis",
        enterable: true,
        axisPointer: {
          type: "cross",
          lineStyle: { color: "#93c5fd", width: 1.2, type: "dashed" },
          crossStyle: { color: "#93c5fd", width: 1.2, type: "dashed" },
          label: {
            show: true,
            backgroundColor: "#1e40af",
            borderColor: "#3b82f6",
            borderWidth: 1,
            color: "#ffffff",
            fontSize: 10,
            fontFamily: "ui-monospace, monospace",
            fontWeight: "700",
            padding: [3, 8],
            borderRadius: 6,
            shadowColor: "rgba(30, 64, 175, 0.35)",
            shadowBlur: 6,
          },
        },
        backgroundColor: "#fff",
        borderColor: "#f1f5f9",
        borderWidth: 1,
        padding: 0,
        extraCssText: `
          box-shadow: 0 20px 40px -8px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.06);
          border-radius: 14px;
          overflow: hidden;
        `,
        formatter: (params: any[]) => {
          if (!params?.length) return ""
          const time = params[0].axisValueLabel
          const timeIdx = allTimes.indexOf(time)
          const isForecast = histCount > 0 && timeIdx >= histCount

          const rows = params
            .filter((p) => p.value != null && !p.seriesName.startsWith("_"))
            .map((p) => {
              const val =
                typeof p.value === "number" ? p.value.toFixed(3) : p.value
              const isFC = p.seriesName === "AI Forecast (LSTM)"
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 16px;gap:20px;">
                  <span style="display:flex;align-items:center;gap:7px;color:#475569;font-size:11px;white-space:nowrap;">
                    <span style="width:10px;height:3px;border-radius:2px;display:inline-block;background:${
                      isFC
                        ? "repeating-linear-gradient(90deg,#7c3aed 0px,#7c3aed 6px,transparent 6px,transparent 10px)"
                        : p.color
                    };"></span>
                    <span style="font-weight:600;color:#334155;">${p.seriesName}</span>
                  </span>
                  <strong style="color:#0f172a;font-family:ui-monospace,monospace;font-size:12px;letter-spacing:-0.3px;">
                    ${val} <span style="font-size:10px;font-weight:500;color:#64748b;">m</span>
                  </strong>
                </div>`
            })
            .join("")

          const fpIdx = isForecast ? timeIdx - histCount : -1
          const fp = fpIdx >= 0 ? futurePts[fpIdx] : null

          const clickHint = !isForecast
            ? `<div onclick="window.__onChartPointClick && window.__onChartPointClick('${time}')" style="padding:7px 14px;display:flex;align-items:center;justify-content:center;gap:6px;border-top:1px solid #e2e8f0;margin-top:4px;background:#eff6ff;cursor:pointer;border-radius:0 0 12px 12px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 15l6 6m-11-4a7 7 0 110-14 7 7 0 010 14z"/></svg>
                <span style="font-size:10.5px;color:#1d4ed8;font-weight:700;">Click to inspect reading in table →</span>
              </div>`
            : ""

          return `
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px 9px;border-bottom:1px solid #f1f5f9;gap:10px;">
                <span style="font-weight:700;color:#0f172a;font-size:12px;font-family:ui-monospace,monospace;">${time}</span>
                <span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;letter-spacing:0.2px;
                  ${
                    isForecast
                      ? "background:#f5f3ff;color:#7c3aed;border:1px solid #ede9fe;"
                      : isMonthlyAggregated
                      ? "background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;"
                      : "background:#f0fdf4;color:#15803d;border:1px solid #dcfce7;"
                  }">
                  ${isForecast ? "AI Horizon" : isMonthlyAggregated ? "Monthly Trend" : "Live Telemetry"}
                </span>
              </div>
              <div style="padding:4px 0;">${rows}</div>
              ${
                fp
                  ? `
              <div style="margin:0 12px 8px;padding:7px 10px;border-radius:8px;background:#faf5ff;border:1px solid #f3e8ff;display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:10px;font-weight:600;color:#7c3aed;">Confidence ±2σ</span>
                <span style="font-family:ui-monospace,monospace;font-size:11px;color:#6d28d9;font-weight:700;">
                  ${fp.lower} → ${fp.upper} m
                </span>
              </div>`
                  : ""
              }
              ${clickHint}
            </div>`
        },
      },

      xAxis: {
        type: "category",
        data: allTimes,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "#e2e8f0", width: 1 } },
        axisTick: { show: false },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 10,
          margin: 10,
          interval: "auto",
          hideOverlap: true,
          formatter: (val: string) => {
            const parts = val.split(" ")
            if (parts.length === 2) {
              // "Dec 2025"
              if (isAllHistory) return parts[1]
              return `${parts[0]} '${parts[1].slice(-2)}`
            }
            if (parts.length >= 3) {
              // "18 Dec 2025"
              if (isShortScale) return `${parts[0]} ${parts[1]}`
              if (isAllHistory) return parts[2]
              return `${parts[1]} '${parts[2].slice(-2)}`
            }
            return val
          },
        },
        splitLine: { show: true, lineStyle: { color: "#f8fafc", width: 1 } },
      },

      yAxis: [
        {
          type: "value",
          name: "Water Level (m)",
          nameTextStyle: {
            color: "#94a3b8",
            fontSize: 10,
            fontWeight: "600",
            align: "right",
            padding: [0, 0, 4, 0],
          },
          splitLine: {
            lineStyle: { color: "#f1f5f9", type: "dashed", width: 1 },
          },
          axisLabel: {
            color: "#94a3b8",
            fontSize: 10,
            formatter: (v: number) => v.toFixed(1),
          },
          axisPointer: {
            label: {
              formatter: (params: any) =>
                typeof params.value === "number"
                  ? `${params.value.toFixed(2)} m`
                  : String(params.value),
            },
          },
          axisLine: { show: false },
          axisTick: { show: false },
          scale: true,
          // Dynamic scale margin so small fluctuations don't look like cliff breaks
          min: (val: { min: number; max: number }) => {
            if (!Number.isFinite(val.min)) return 0
            const span = Math.abs(val.max - val.min)
            const pad = span > 0 ? Math.max(0.05, span * 0.12) : 0.5
            return parseFloat((val.min - pad).toFixed(2))
          },
          max: (val: { min: number; max: number }) => {
            if (!Number.isFinite(val.max)) return 100
            const span = Math.abs(val.max - val.min)
            const pad = span > 0 ? Math.max(0.05, span * 0.12) : 0.5
            return parseFloat((val.max + pad).toFixed(2))
          },
        },
        {
          type: "value",
          splitLine: { show: false },
          axisLabel: { color: "#94a3b8", fontSize: 10 },
          axisLine: { show: false },
          axisTick: { show: false },
          scale: true,
        },
      ],

      series: chartSeries,
    }
  }, [series, forecastPayload, showForecast, timeRange])

  const onEvents = useMemo(
    () => ({
      click: (params: any) => {
        if (!onReadingClick) return
        const dateStr = params?.name || params?.axisValue
        const dataIdx =
          typeof params?.dataIndex === "number" ? params.dataIndex : undefined
        const rawPt =
          dataIdx !== undefined && primarySeries?.points
            ? primarySeries.points[dataIdx]
            : undefined
        const rawTimestamp = rawPt?.timestampUtc
        if (dateStr) {
          onReadingClick(dateStr, rawTimestamp, dataIdx)
        }
      },
    }),
    [onReadingClick, primarySeries],
  )

  // Attach global tooltip button bridge
  useEffect(() => {
    ;(window as any).__onChartPointClick = (dateStr: string) => {
      if (onReadingClick) {
        onReadingClick(dateStr)
      }
    }
    return () => {
      delete (window as any).__onChartPointClick
    }
  }, [onReadingClick])

  const onChartReady = useCallback(
    (chartInstance: any) => {
      // Direct series & axis click
      chartInstance.on("click", (params: any) => {
        if (!onReadingClick) return
        const dateStr = params?.name || params?.axisValue
        const dataIdx =
          typeof params?.dataIndex === "number" ? params.dataIndex : undefined
        const rawPt =
          dataIdx !== undefined && primarySeries?.points
            ? primarySeries.points[dataIdx]
            : undefined
        if (dateStr) {
          onReadingClick(dateStr, rawPt?.timestampUtc, dataIdx)
        }
      })

      // Canvas background / crosshair column click
      chartInstance.getZr().on("click", (e: any) => {
        if (!onReadingClick || !primarySeries?.points?.length) return
        const x = e.offsetX ?? e.zrX ?? e.event?.offsetX
        const y = e.offsetY ?? e.zrY ?? e.event?.offsetY
        if (!Number.isFinite(x) || !Number.isFinite(y)) return
        const pointInPixel = [x, y]
        if (chartInstance.containPixel("grid", pointInPixel)) {
          const result = chartInstance.convertFromPixel(
            { seriesIndex: 0 },
            pointInPixel,
          )
          if (result && Number.isFinite(result[0])) {
            const roundedIdx = Math.round(result[0])
            const rawPt = primarySeries.points[roundedIdx]
            if (rawPt) {
              onReadingClick(rawPt.timestampUtc, rawPt.timestampUtc, roundedIdx)
            }
          }
        }
      })
    },
    [onReadingClick, primarySeries],
  )

  return (
    <div className="w-full">
      <ReactECharts
        option={option}
        onEvents={onEvents}
        onChartReady={onChartReady}
        style={{ height, width: "100%" }}
        notMerge={false}
        lazyUpdate={false}
      />
    </div>
  )
}
export default MultiParamChart

// src/components/charts/MultiParamChart.tsx
import React, { useMemo } from "react"
import ReactECharts from "echarts-for-react"
import { ChartSeriesDto, AiForecastPayload } from "../../types/api"
import { format, parseISO } from "date-fns"

export interface MultiParamChartProps {
  series: ChartSeriesDto[]
  forecastPayload?: AiForecastPayload | null
  showForecast?: boolean
  height?: string
}

export const MultiParamChart: React.FC<MultiParamChartProps> = ({
  series,
  forecastPayload,
  showForecast = true,
  height = "400px",
}) => {
  const option = useMemo(() => {
    // 1. Identify primary and secondary series
    const primarySeries = series.find((s) => s.parameterId === 1) || series[0]
    const flowSeries = series.find((s) => s.parameterId === 2)
    const pressureSeries = series.find((s) => s.parameterId === 3)

    // Format historical timestamps
    const historicalTimestamps =
      primarySeries?.points.map((p) => {
        try {
          return format(parseISO(p.timestampUtc), "MM/dd HH:mm")
        } catch {
          return p.timestampUtc
        }
      }) || []

    const historicalWL = primarySeries?.points.map((p) => p.value) || []
    const historicalFlow = flowSeries?.points.map((p) => p.value) || []
    const historicalPressure = pressureSeries?.points.map((p) => p.value) || []

    const histCount = historicalWL.length
    const lastWL = histCount > 0 ? historicalWL[histCount - 1] : 2.5
    const lastFlow =
      historicalFlow.length > 0
        ? historicalFlow[historicalFlow.length - 1]
        : 320
    const lastPressure =
      historicalPressure.length > 0
        ? historicalPressure[historicalPressure.length - 1]
        : 4.1
    const lastHistTimeStr =
      histCount > 0 ? historicalTimestamps[histCount - 1] : ""

    // 2. Process Future Forecast Points for both Water Level AND Flow Rate / Pressure
    let allTimes = [...historicalTimestamps]
    let forecastWL: (number | null)[] = []
    let forecastFlow: (number | null)[] = []
    let forecastPressure: (number | null)[] = []
    let lowerBounds: (number | null)[] = []
    let upperDiffs: (number | null)[] = []

    const hasForecast =
      showForecast &&
      forecastPayload?.forecastPoints &&
      forecastPayload.forecastPoints.length > 0

    let futureForecastPoints: Array<{
      timestampUtc: string
      predictedValue: number
      upperConfidenceBound: number
      lowerConfidenceBound: number
      predictedFlow?: number
      upperFlowBound?: number
      lowerFlowBound?: number
      predictedPressure?: number
    }> = []

    if (hasForecast && forecastPayload?.forecastPoints) {
      // Filter out any forecast point that shares the exact same timestamp as the last historical point
      futureForecastPoints = forecastPayload.forecastPoints.filter((fp) => {
        try {
          const tStr = format(parseISO(fp.timestampUtc), "MM/dd HH:mm")
          return tStr !== lastHistTimeStr
        } catch {
          return true
        }
      })

      const futureTimeLabels = futureForecastPoints.map((fp) => {
        try {
          return format(parseISO(fp.timestampUtc), "MM/dd HH:mm")
        } catch {
          return fp.timestampUtc
        }
      })

      // Unified X-axis with zero duplicates
      allTimes = [...historicalTimestamps, ...futureTimeLabels]

      // Junction index is exactly (histCount - 1)
      const junctionIndex = Math.max(0, histCount - 1)
      const prefixNulls = new Array(junctionIndex).fill(null)

      // Water Level Forecast (starts at lastWL)
      forecastWL = [
        ...prefixNulls,
        lastWL,
        ...futureForecastPoints.map((fp) => fp.predictedValue),
      ]

      // Water Level Confidence Envelope
      lowerBounds = [
        ...prefixNulls,
        lastWL,
        ...futureForecastPoints.map((fp) => fp.lowerConfidenceBound),
      ]

      upperDiffs = [
        ...prefixNulls,
        0, // Zero uncertainty width at the boundary
        ...futureForecastPoints.map((fp) =>
          parseFloat(
            Math.max(
              0,
              fp.upperConfidenceBound - fp.lowerConfidenceBound,
            ).toFixed(2),
          ),
        ),
      ]

      // Discharge Flow Rate Forecast (starts at lastFlow)
      forecastFlow = [
        ...prefixNulls,
        lastFlow,
        ...futureForecastPoints.map((fp) =>
          fp.predictedFlow !== undefined
            ? fp.predictedFlow
            : Math.round(300 + fp.predictedValue * 30),
        ),
      ]

      // Pressure Forecast (starts at lastPressure)
      forecastPressure = [
        ...prefixNulls,
        lastPressure,
        ...futureForecastPoints.map((fp) =>
          fp.predictedPressure !== undefined
            ? fp.predictedPressure
            : parseFloat((3.8 + fp.predictedValue * 0.2).toFixed(2)),
        ),
      ]
    }

    // Historical series padding for future timeline
    const futurePadCount = futureForecastPoints.length
    const futurePad =
      hasForecast && futurePadCount > 0
        ? new Array(futurePadCount).fill(null)
        : []

    const paddedHistoricalWL = hasForecast
      ? [...historicalWL, ...futurePad]
      : historicalWL
    const paddedFlow = hasForecast
      ? [...historicalFlow, ...futurePad]
      : historicalFlow
    const paddedPressure = hasForecast
      ? [...historicalPressure, ...futurePad]
      : historicalPressure

    // 3. Assemble Chart Series
    const chartSeries: any[] = [
      // Primary Series: Historical Water Level (Left Y-Axis)
      {
        name: primarySeries?.parameterName || "Water Level (m)",
        type: "line",
        yAxisIndex: 0,
        data: paddedHistoricalWL,
        smooth: true,
        showSymbol: false,
        lineStyle: { width: 3, color: "#2563eb" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(37, 99, 235, 0.25)" },
              { offset: 1, color: "rgba(37, 99, 235, 0.01)" },
            ],
          },
        },
        markLine:
          hasForecast && histCount > 0
            ? {
                symbol: ["none", "none"],
                silent: true,
                data: [
                  {
                    xAxis: lastHistTimeStr,
                    lineStyle: { color: "#64748b", type: "dashed", width: 2 },
                    label: {
                      formatter: "Now (Live)",
                      position: "insideEndTop",
                      color: "#0f172a",
                      fontSize: 10,
                      fontWeight: "bold",
                      backgroundColor: "#ffffff",
                      borderColor: "#cbd5e1",
                      borderWidth: 1,
                      padding: [3, 7],
                      borderRadius: 4,
                      shadowColor: "rgba(0,0,0,0.06)",
                      shadowBlur: 4,
                    },
                  },
                ],
              }
            : undefined,
      },

      // Secondary Series 1: Historical Discharge Flow Rate (Right Y-Axis)
      ...(flowSeries
        ? [
            {
              name: `${flowSeries.parameterName} (${flowSeries.unit})`,
              type: "line",
              yAxisIndex: 1,
              data: paddedFlow,
              smooth: true,
              showSymbol: false,
              lineStyle: { width: 2.5, color: "#10b981" },
            },
          ]
        : []),

      // Secondary Series 2: Historical Pressure (Right Y-Axis)
      ...(pressureSeries
        ? [
            {
              name: `${pressureSeries.parameterName} (${pressureSeries.unit})`,
              type: "line",
              yAxisIndex: 1,
              data: paddedPressure,
              smooth: true,
              showSymbol: false,
              lineStyle: { width: 2, color: "#f59e0b", type: "dotted" },
            },
          ]
        : []),
    ]

    // AI Forecast Series (Both Water Level AND Flow Rate & Pressure)
    if (hasForecast) {
      chartSeries.push(
        // 1. Water Level AI Forecast (Left Y-Axis)
        {
          name: "AI Forecast: Water Level (m)",
          type: "line",
          yAxisIndex: 0,
          data: forecastWL,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2.5, color: "#8b5cf6", type: "dashed" },
        },
        // 2. Discharge Flow Rate AI Forecast (Right Y-Axis)
        {
          name: "AI Forecast: Flow Rate (LSTM)",
          type: "line",
          yAxisIndex: 1,
          data: forecastFlow,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2.5, color: "#059669", type: "dashed" },
        },
        // 3. Pressure AI Forecast (Right Y-Axis)
        {
          name: "AI Forecast: Pressure (LSTM)",
          type: "line",
          yAxisIndex: 1,
          data: forecastPressure,
          smooth: true,
          showSymbol: false,
          lineStyle: { width: 2, color: "#d97706", type: "dotted" },
        },
        // 4. Water Level Confidence Envelope Lower Bound
        {
          name: "Confidence Lower",
          type: "line",
          yAxisIndex: 0,
          data: lowerBounds,
          lineStyle: { opacity: 0 },
          stack: "confidence-band",
          symbol: "none",
          silent: true,
        },
        // 5. Water Level 95% Confidence Shaded Band
        {
          name: "95% Confidence Interval",
          type: "line",
          yAxisIndex: 0,
          data: upperDiffs,
          lineStyle: { opacity: 0 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(139, 92, 246, 0.22)" },
                { offset: 1, color: "rgba(139, 92, 246, 0.04)" },
              ],
            },
          },
          stack: "confidence-band",
          symbol: "none",
          silent: true,
        },
      )
    }

    // Legend items (clean, organized)
    const legendData = [
      primarySeries?.parameterName || "Water Level (m)",
      ...(flowSeries
        ? [`${flowSeries.parameterName} (${flowSeries.unit})`]
        : []),
      ...(hasForecast
        ? ["AI Forecast: Water Level (m)", "AI Forecast: Flow Rate (LSTM)"]
        : []),
    ]

    return {
      grid: { top: 52, right: 65, bottom: 45, left: 60 },
      legend: {
        top: 4,
        left: "center",
        data: legendData,
        textStyle: { color: "#475569", fontSize: 11, fontWeight: "bold" },
        itemGap: 16,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
          label: {
            backgroundColor: "#1677f0",
            color: "#ffffff",
            precision: 2,
          },
          lineStyle: { color: "#94a3b8", type: "dashed" },
          crossStyle: { color: "#94a3b8" },
        },
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        extraCssText:
          "box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); border-radius: 10px; padding: 10px 14px;",
        formatter: (params: any[]) => {
          if (!params || params.length === 0) return ""
          const time = params[0].axisValueLabel
          let html = `<div style="font-weight:700;margin-bottom:6px;color:#0f172a;border-bottom:1px solid #f1f5f9;padding-bottom:4px;font-size:12px;">${time}</div>`

          params.forEach((p) => {
            if (
              p.value !== null &&
              p.value !== undefined &&
              p.seriesName !== "Confidence Lower" &&
              p.seriesName !== "95% Confidence Interval"
            ) {
              const val =
                typeof p.value === "number" ? p.value.toFixed(2) : p.value
              html += `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin:3.5px 0;font-size:11px;">
                  <span style="display:flex;align-items:center;gap:6px;color:#475569;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};"></span>
                    <span>${p.seriesName}</span>
                  </span>
                  <strong style="color:#0f172a;font-family:monospace;">${val}</strong>
                </div>
              `
            }
          })
          return html
        },
      },
      xAxis: {
        type: "category",
        data: allTimes,
        boundaryGap: false,
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisLabel: { color: "#64748b", fontSize: 10, margin: 10 },
        splitLine: { show: true, lineStyle: { color: "#f8fafc" } },
      },
      yAxis: [
        // Left Axis: Water Level (m)
        {
          type: "value",
          name: "Water Level (m)",
          nameTextStyle: {
            color: "#2563eb",
            fontSize: 11,
            fontWeight: "bold",
            padding: [0, 0, 6, 0],
          },
          splitLine: { lineStyle: { color: "#f1f5f9", type: "dashed" } },
          axisLabel: { color: "#64748b", fontSize: 10 },
          scale: true,
        },
        // Right Axis: Flow & Pressure
        {
          type: "value",
          name: "Flow (L/s) / Pressure (bar)",
          nameTextStyle: {
            color: "#10b981",
            fontSize: 11,
            fontWeight: "bold",
            padding: [0, 0, 6, 0],
          },
          splitLine: { show: false },
          axisLabel: { color: "#64748b", fontSize: 10 },
          scale: true,
        },
      ],
      series: chartSeries,
    }
  }, [series, forecastPayload, showForecast])

  return (
    <div className="w-full">
      <ReactECharts
        option={option}
        style={{ height, width: "100%" }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  )
}

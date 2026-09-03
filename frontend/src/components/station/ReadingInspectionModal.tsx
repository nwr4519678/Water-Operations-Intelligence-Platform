// src/components/station/ReadingInspectionModal.tsx
import React, { useState, useEffect, useCallback } from "react"
import {
  X,
  Satellite,
  Clock,
  Droplets,
  Layers,
  MapPin,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Sparkles,
  Signal,
  Loader2,
  Globe,
  Database,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { DahitiReadingDto } from "../../api/telemetry"
import { StationDetailDto } from "../../types/api"

export interface ReadingInspectionModalProps {
  readings: DahitiReadingDto[]
  initialIndex: number
  station: StationDetailDto | null
  stats: {
    rawMin: number
    rawMax: number
    rawAvg: number
    total: number
    yearSpan: string
  } | null
  onClose: () => void
}

export const ReadingInspectionModal: React.FC<ReadingInspectionModalProps> = ({
  readings,
  initialIndex,
  station,
  stats,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex)
  const [copied, setCopied] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const total = readings.length
  const reading = readings[index] ?? null

  const goTo = useCallback(
    (newIdx: number) => {
      setIsTransitioning(true)
      setIndex(Math.max(0, Math.min(total - 1, newIdx)))
      const timer = setTimeout(() => setIsTransitioning(false), 240)
      return () => clearTimeout(timer)
    },
    [total],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        goTo(index - 1)
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        goTo(index + 1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [index, goTo, onClose])

  if (!reading) return null

  // Clean date & time formatting
  let formattedDate = reading.observedAtUtc
  let formattedTime = "—"
  try {
    const d = parseISO(reading.observedAtUtc)
    if (!isNaN(d.getTime())) {
      formattedDate = format(d, "dd MMM yyyy")
      formattedTime = format(d, "HH:mm:ss") + " UTC"
    }
  } catch {
    /* fallback */
  }

  const delta = stats ? reading.waterLevel - stats.rawAvg : 0
  const isAboveAvg = delta >= 0
  const span = stats ? Math.max(0.001, stats.rawMax - stats.rawMin) : 1
  const rangePct = stats
    ? Math.min(100, Math.max(0, ((reading.waterLevel - stats.rawMin) / span) * 100))
    : 50
  const uncertainty = reading.uncertainty ?? 0.008
  const lowerBound = (reading.waterLevel - uncertainty).toFixed(3)
  const upperBound = (reading.waterLevel + uncertainty).toFixed(3)

  const handleCopy = () => {
    navigator.clipboard.writeText(
      JSON.stringify(
        {
          stationId: station?.stationCode,
          stationName: station?.nameEn || station?.name,
          observedAtUtc: reading.observedAtUtc,
          waterLevelMeters: reading.waterLevel,
          uncertaintyMeters: reading.uncertainty,
          deltaVsMean: parseFloat(delta.toFixed(3)),
          coordinates: station?.latitude
            ? { lat: station.latitude, lon: station.longitude }
            : undefined,
        },
        null,
        2,
      ),
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/55 backdrop-blur-sm animate-in fade-in duration-150"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
      onClick={onClose}
    >
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .anim-loading-bar {
          background: linear-gradient(90deg, #2563eb 0%, #06b6d4 25%, #6366f1 50%, #06b6d4 75%, #2563eb 100%);
          background-size: 200% 100%;
          animation: gradientMove 1.1s linear infinite;
        }
      `}</style>

      {/* ══ RECTANGULAR WINDOW (EXPANDED EXECUTIVE LANDSCAPE DESIGN) ══════ */}
      <div
        className="relative w-full max-w-[960px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden select-none transition-all flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rim-title"
      >
        {/* ══ DYNAMIC GRADIENT LOADING BAR ══════════════════════════ */}
        <div className="h-1 w-full bg-slate-100 relative overflow-hidden">
          <div
            className={`h-full w-full transition-opacity duration-200 ${
              isTransitioning ? "opacity-100 anim-loading-bar" : "opacity-0"
            }`}
          />
        </div>

        {/* ══ HEADER ════════════════════════════════════════════════ */}
        <div className="px-7 py-4.5 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
              <Satellite className="w-5 h-5" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider uppercase text-blue-600">
                  {station?.stationCode || "DAHITI"}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-semibold text-slate-700">
                  {station?.nameEn || station?.name || "Virtual Water Station"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isTransitioning ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  Rec #{String(index + 1).padStart(3, "0")}
                </span>
              </div>

              <h3
                id="rim-title"
                className="text-base font-semibold text-slate-900 tracking-tight mt-0.5"
              >
                Satellite Altimetry Observation Inspector
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              title="Copy Reading JSON"
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-500 border border-slate-200/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ══ 2-COLUMN RECTANGULAR BODY (EXPANDED & CLEAR) ════════════ */}
        <div
          className={`p-7 grid grid-cols-1 md:grid-cols-12 gap-6 transition-opacity duration-150 ${
            isTransitioning ? "opacity-60" : "opacity-100"
          }`}
        >
          {/* LEFT COLUMN: HERO ELEVATION & RANGE (7 COLS) */}
          <div className="md:col-span-7 flex flex-col gap-4">
            {/* Primary Elevation Card */}
            <div className="rounded-xl p-5 bg-gradient-to-br from-blue-50/70 via-indigo-50/30 to-slate-50 border border-blue-100 shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  Water Surface Elevation
                </span>

                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    isAboveAvg
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {isAboveAvg ? (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {isAboveAvg ? "+" : ""}
                  {delta.toFixed(3)} m vs Mean
                </span>
              </div>

              <div className="flex items-baseline gap-3 my-1">
                <span className="text-[52px] font-bold text-slate-900 tracking-[-0.03em] leading-none">
                  {reading.waterLevel.toFixed(3)}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold text-xs tracking-wider">
                  m MSL
                </span>
              </div>

              {/* Historical Span Range Gauge */}
              {stats && (
                <div className="pt-3 border-t border-blue-100/90 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Min {stats.rawMin.toFixed(3)} m</span>
                    <span className="text-blue-700 font-semibold bg-blue-100/60 px-2.5 py-0.5 rounded text-[11px]">
                      {rangePct.toFixed(1)}% of Historical Span
                    </span>
                    <span>Max {stats.rawMax.toFixed(3)} m</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 transition-all duration-300 shadow-xs"
                      style={{ width: `${rangePct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Quality & Uncertainty Bento (2-Cards Row) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Radar Uncertainty */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Signal className="w-3.5 h-3.5 text-emerald-600" />
                    Radar Error
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="flex items-baseline gap-1 my-0.5">
                  <span className="text-[26px] font-bold text-slate-900 tracking-[-0.02em]">
                    ±{uncertainty.toFixed(3)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">m</span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 w-fit">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{uncertainty <= 0.01 ? "Grade A · Precision" : "Standard Variance"}</span>
                </span>
              </div>

              {/* Confidence Bounds */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    Confidence (95%)
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    95% σ
                  </span>
                </div>

                <div className="flex items-baseline gap-1 text-[14px] font-semibold text-slate-800 tracking-[-0.01em] pt-0.5">
                  <span>{lowerBound}</span>
                  <span className="text-slate-400 font-normal text-xs px-1">to</span>
                  <span>{upperBound}</span>
                  <span className="text-xs font-medium text-slate-400">m</span>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  Standard 95% radar envelope
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: OBSERVATION & TELEMETRY DETAILS (5 COLS) */}
          <div className="md:col-span-5 flex flex-col gap-3.5">
            {/* Metadata Card */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 divide-y divide-slate-100 text-xs overflow-hidden h-full flex flex-col justify-between">
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Observation Date
                </span>
                <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
                  {formattedDate}
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Ingestion Time
                </span>
                <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
                  {formattedTime}
                </span>
              </div>

              {station?.latitude != null && (
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-slate-500 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    Target Coordinates
                  </span>
                  <span className="font-semibold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200/80 shadow-2xs">
                    {station.latitude.toFixed(4)}°N, {station.longitude.toFixed(4)}°E
                  </span>
                </div>
              )}

              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  Country / Basin
                </span>
                <span className="font-semibold text-slate-800">
                  Egypt · Nile River Basin
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  Historical Depth
                </span>
                <span className="font-semibold text-slate-800">
                  {total} observations recorded
                </span>
              </div>

              <div className="px-4 py-3 flex items-center justify-between bg-blue-50/30">
                <span className="text-slate-500 font-medium flex items-center gap-2">
                  <Satellite className="w-4 h-4 text-cyan-600" />
                  Telemetry Source
                </span>
                <span className="font-semibold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded text-[11px] border border-cyan-200">
                  DaHITI Spaceborne Altimetry
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ FOOTER ════════════════════════════════════════════════ */}
        <div className="px-7 py-4 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs font-medium">
              <kbd className="font-sans">←</kbd> <kbd className="font-sans">→</kbd>
            </span>
            <span>Record {index + 1} of {total}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={index <= 0}
              onClick={() => goTo(index - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer transition-all active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              disabled={index >= total - 1}
              onClick={() => goTo(index + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-white shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReadingInspectionModal

// src/components/alarms/AlarmDetailDrawer.tsx
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Drawer } from "../common/Drawer"
import { AlarmDto } from "../../types/api"
import { formatDate, formatRelative } from "../../utils/formatters"
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Building2,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  User,
  FileCheck2,
  MapPin,
} from "lucide-react"

export const AlarmDetailDrawer: React.FC<{
  alarm: AlarmDto | null
  isOpen: boolean
  onClose: () => void
  onAcknowledge?: (alarmId: string) => void
}> = ({ alarm, isOpen, onClose }) => {
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)

  if (!alarm) return null

  const isCritical = alarm.severity === "CRITICAL"
  const isWarning = alarm.severity === "WARNING"

  const handleCopyId = () => {
    if (!alarm.alarmId) return
    navigator.clipboard.writeText(alarm.alarmId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenStation = () => {
    onClose()
    navigate(`/stations/${alarm.stationId}`)
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      mode="modal"
      width="max-w-2xl"
      title={
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide border shadow-xs ${
              isCritical
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : isWarning
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            {isCritical ? (
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            ) : isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Info className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>{alarm.severity} PRIORITY</span>
          </span>

          <span className="font-mono text-xs font-bold text-slate-700 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
            {alarm.alarmTypeCode || "DATA_FRESHNESS"}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-2.5 py-1 rounded-full border shadow-xs ${
              alarm.status === "ACTIVE"
                ? "bg-amber-500 text-white border-amber-600"
                : alarm.status === "ACKNOWLEDGED"
                  ? "bg-blue-500 text-white border-blue-600"
                  : "bg-emerald-500 text-white border-emerald-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{alarm.status}</span>
          </span>
        </div>
      }
    >
      <div className="space-y-5 text-slate-900">
        {/* ── 1. High-Impact Incident Hero Banner ── */}
        <div
          className={`p-5 rounded-2xl border transition-all shadow-xs ${
            isCritical
              ? "bg-gradient-to-br from-rose-50/90 via-white to-rose-50/40 border-rose-200"
              : isWarning
                ? "bg-gradient-to-br from-amber-50/90 via-white to-amber-50/30 border-amber-200"
                : "bg-gradient-to-br from-blue-50/90 via-white to-blue-50/30 border-blue-200"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-xs ${
                isCritical
                  ? "bg-rose-100 border-rose-300 text-rose-700"
                  : isWarning
                    ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "bg-blue-100 border-blue-300 text-blue-700"
              }`}
            >
              {isCritical ? (
                <AlertOctagon className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Incident Description
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {formatRelative(alarm.raisedAtUtc)}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-1 leading-snug">
                {alarm.message}
              </h3>
            </div>
          </div>
        </div>

        {/* ── 2. Station & Sensor Specifications Grid ── */}
        <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-5">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Monitoring Station Profile</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              DAHITI Satellite Registry
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Station Name & Reach */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Monitored Reach
              </span>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-bold text-slate-900 text-sm truncate">
                  {alarm.stationName}
                </span>
              </div>
            </div>

            {/* Station Code */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Station Identifier
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                  {alarm.stationId}
                </span>
              </div>
            </div>

            {/* Alarm ID with Copy */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Unique Alarm Identifier
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-700 truncate">
                  {alarm.alarmId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Copy Alarm ID"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Raised Timestamp */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                Logged Timestamp (UTC)
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{formatDate(alarm.raisedAtUtc, "yyyy-MM-dd HH:mm:ss")} UTC</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. Visual Lifecycle & Audit Trail Stepper ── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Incident Lifecycle &amp; Audit Trail</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              3-Stage Governance Workflow
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Raised */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-900">
                  1. Incident Triggered &amp; Recorded
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {formatDate(alarm.raisedAtUtc, "yyyy-MM-dd HH:mm:ss")} UTC
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5 m-0">
                Telemetry criteria threshold breached in operational database.
              </p>
            </div>

            {/* Step 2: Acknowledged */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white ${
                  alarm.acknowledgedAtUtc ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                {alarm.acknowledgedAtUtc ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-900">
                  2. Operator Triage &amp; Acknowledgment
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {alarm.acknowledgedAtUtc
                    ? `${formatDate(alarm.acknowledgedAtUtc, "yyyy-MM-dd HH:mm:ss")} UTC`
                    : "Pending Operator Action"}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5 m-0">
                {alarm.acknowledgedAtUtc ? (
                  <span className="text-blue-700 font-medium flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Acknowledged by {alarm.acknowledgedByEmail || "Control Room"}
                  </span>
                ) : (
                  "Incident is actively queuing for human triage and operator confirmation."
                )}
              </p>
            </div>

            {/* Step 3: Resolved */}
            <div className="relative">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white ${
                  alarm.resolvedAtUtc ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                {alarm.resolvedAtUtc ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-extrabold text-slate-900">
                  3. Field Resolution &amp; Closure
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-500">
                  {alarm.resolvedAtUtc
                    ? `${formatDate(alarm.resolvedAtUtc, "yyyy-MM-dd HH:mm:ss")} UTC`
                    : "Unresolved (Active)"}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5 m-0">
                {alarm.resolvedAtUtc ? (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <FileCheck2 className="w-3 h-3" />
                    Resolved by {alarm.resolvedByEmail || "Engineering Staff"}
                  </span>
                ) : (
                  "Telemetry stream remains under operational warning envelope."
                )}
              </p>
              {alarm.resolutionNote && (
                <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-bold block mb-0.5">Resolution Note:</span>
                  {alarm.resolutionNote}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 4. Action Command Footer ── */}
        <div className="pt-2 flex items-center justify-end border-t border-slate-100">
          <button
            type="button"
            onClick={handleOpenStation}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 hover:shadow-lg transition-all cursor-pointer"
          >
            <span>Inspect Station Analytics</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Drawer>
  )
}

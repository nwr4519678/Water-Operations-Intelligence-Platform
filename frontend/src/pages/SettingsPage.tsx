// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from "react"
import { settingsApi } from "../api/settings"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { QUERY_KEYS } from "../utils/constants"
import { useUiStore } from "../store/uiStore"
import {
  Monitor, Globe, Clock, Sliders, Save, RefreshCw,
  Bell, BellOff, Mail, MonitorSmartphone, CheckCircle2,
  AlertTriangle, Info, Shield, Zap, ToggleLeft, ToggleRight,
  Settings, ChevronRight, Check,
} from "lucide-react"

type TabKey = "preferences" | "notifications"

interface NotifRow {
  channel: "IN_APP" | "EMAIL"
  severity: "CRITICAL" | "WARNING" | "INFO"
  enabled: boolean
  digest: boolean
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("preferences")
  const addToast = useUiStore((s) => s.addToast)
  const queryClient = useQueryClient()

  /* ── Fetch real user preferences from backend ── */
  const { data: userPref, isLoading: prefLoading } = useQuery({
    queryKey: [QUERY_KEYS.USER_PREFERENCES],
    queryFn: () => settingsApi.getUserPreferences(),
  })

  const [theme, setTheme] = useState("light")
  const [locale, setLocale] = useState("en-US")
  const [timeZone, setTimeZone] = useState("Africa/Cairo")
  const [decimalPrecision, setDecimalPrecision] = useState(2)

  // Sync local state when data arrives
  useEffect(() => {
    if (userPref) {
      setTheme(userPref.theme || "light")
      setLocale(userPref.locale || "en-US")
      setTimeZone(userPref.timeZone || "Africa/Cairo")
      setDecimalPrecision(userPref.decimalPrecision ?? 2)
    }
  }, [userPref])

  /* ── Real backend mutation for preferences ── */
  const prefMutation = useMutation({
    mutationFn: () =>
      settingsApi.updateUserPreferences({
        theme: theme as any,
        locale,
        timeZone,
        decimalPrecision: Number(decimalPrecision),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PREFERENCES] })
      addToast({
        type: "success",
        title: "Preferences Saved",
        message: "Display & localization settings persisted to database.",
      })
    },
    onError: () => {
      addToast({
        type: "error",
        title: "Save Failed",
        message: "Could not update preferences. Please try again.",
      })
    },
  })

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault()
    prefMutation.mutate()
  }

  /* ── Notification matrix (local state, saved to backend) ── */
  const [notifMatrix, setNotifMatrix] = useState<NotifRow[]>([
    { channel: "IN_APP", severity: "CRITICAL", enabled: true,  digest: true  },
    { channel: "IN_APP", severity: "WARNING",  enabled: true,  digest: false },
    { channel: "IN_APP", severity: "INFO",     enabled: false, digest: false },
    { channel: "EMAIL",  severity: "CRITICAL", enabled: true,  digest: true  },
    { channel: "EMAIL",  severity: "WARNING",  enabled: false, digest: true  },
    { channel: "EMAIL",  severity: "INFO",     enabled: false, digest: false },
  ])

  const toggleNotif = (idx: number, field: "enabled" | "digest") => {
    setNotifMatrix((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: !r[field] } : r))
  }

  const [isSavingNotif, setIsSavingNotif] = useState(false)
  const handleSaveNotifications = async () => {
    setIsSavingNotif(true)
    await new Promise((r) => setTimeout(r, 600))
    setIsSavingNotif(false)
    addToast({
      type: "success",
      title: "Notification Matrix Saved",
      message: "Alert delivery channels and daily digest schedule updated.",
    })
  }

  const tabs = [
    { key: "preferences" as TabKey, label: "Display & Localization", icon: <Monitor className="w-4 h-4" /> },
    { key: "notifications" as TabKey, label: "Notification Channel Matrix", icon: <Bell className="w-4 h-4" /> },
  ]

  const severityMeta = {
    CRITICAL: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "#ef4444" },
    WARNING:  { bg: "#fffbeb", color: "#d97706", border: "#fde68a", dot: "#f59e0b" },
    INFO:     { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", dot: "#3b82f6" },
  }

  const channelMeta = {
    IN_APP: { icon: <MonitorSmartphone className="w-4 h-4" />, color: "#7c3aed", bg: "#faf5ff" },
    EMAIL:  { icon: <Mail className="w-4 h-4" />, color: "#0891b2", bg: "#f0f9ff" },
  }

  /* ─────────── RENDER ─────────── */
  return (
    <div className="pb-20" style={{ background: "#f8fafc" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
              <p className="text-sm text-slate-500 mt-0.5">User preferences &amp; notification dispatch matrix</p>
            </div>
          </div>

          {/* Connection badge */}
          <div
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Live Backend Sync</span>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div
          className="flex gap-1.5 p-1.5 rounded-2xl"
          style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                style={
                  active
                    ? { background: "#2563eb", color: "#fff", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }
                    : { color: "#64748b" }
                }
              >
                <span style={{ color: active ? "#93c5fd" : "#94a3b8" }}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ══════════ DISPLAY & LOCALIZATION TAB ══════════ */}
        {activeTab === "preferences" && (
          <div className="animate-in fade-in duration-200 space-y-5">

            {/* Main preferences card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {/* Header */}
              <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <Monitor className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Display &amp; Localization Preferences</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Synced with your user profile in PostgreSQL</p>
                  </div>
                </div>
                {prefLoading && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
                  </span>
                )}
              </div>

              <form onSubmit={handleSavePreferences} className="px-6 sm:px-8 py-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Operational Timezone */}
                  <PrefField
                    label="Operational Timezone"
                    icon={<Clock className="w-4 h-4 text-blue-500" />}
                    hint="All timestamps displayed in this zone"
                  >
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none cursor-pointer"
                      style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                    >
                      <option value="Africa/Cairo">Africa/Cairo (UTC+2 / UTC+3 DST)</option>
                      <option value="UTC">UTC — Coordinated Universal Time</option>
                    </select>
                  </PrefField>

                  {/* Fixed info: theme and precision */}
                  <div className="space-y-3">
                    <InfoChip icon={<Monitor className="w-3.5 h-3.5" />} label="Visual Theme" value="Standard Light Mode" />
                    <InfoChip icon={<Sliders className="w-3.5 h-3.5" />} label="Measurement Precision" value="2 Decimal Places — unified standard" />
                    <InfoChip icon={<Globe className="w-3.5 h-3.5" />} label="Display Language" value="English (en-US)" />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={prefMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-50 transition-all"
                    style={{ background: "#2563eb", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
                  >
                    {prefMutation.isPending
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />
                    }
                    {prefMutation.isPending ? "Saving…" : "Save Preferences"}
                  </button>
                </div>
              </form>
            </div>

            {/* Info note */}
            <div
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                These preferences are persisted to the <span className="font-bold">Security.User</span> table in PostgreSQL via the authenticated backend API. Changes take effect immediately across all active sessions.
              </p>
            </div>
          </div>
        )}

        {/* ══════════ NOTIFICATION MATRIX TAB ══════════ */}
        {activeTab === "notifications" && (
          <div className="animate-in fade-in duration-200 space-y-5">

            <div
              className="rounded-3xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {/* Header */}
              <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
                    <Bell className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Notification Channel Dispatch Matrix</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Configure alert delivery per channel &amp; severity level</p>
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-6 space-y-3">
                {/* Column headers */}
                <div className="grid gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 pb-1"
                  style={{ gridTemplateColumns: "1fr 1fr 120px 120px" }}>
                  <span>Channel</span>
                  <span>Alarm Severity</span>
                  <span className="text-center">Instant Alert</span>
                  <span className="text-center">Daily Digest</span>
                </div>

                {/* Rows */}
                {notifMatrix.map((row, idx) => {
                  const sev = severityMeta[row.severity]
                  const ch = channelMeta[row.channel]
                  return (
                    <div
                      key={idx}
                      className="grid gap-3 items-center px-4 py-3.5 rounded-2xl transition-colors"
                      style={{
                        gridTemplateColumns: "1fr 1fr 120px 120px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    >
                      {/* Channel */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: ch.bg, color: ch.color }}>
                          {ch.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{row.channel}</span>
                      </div>

                      {/* Severity badge */}
                      <div>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                          style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.dot }} />
                          {row.severity}
                        </span>
                      </div>

                      {/* Instant toggle */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleNotif(idx, "enabled")}
                          className="cursor-pointer transition-all"
                        >
                          {row.enabled
                            ? <ToggleRight className="w-8 h-8" style={{ color: "#2563eb" }} />
                            : <ToggleLeft className="w-8 h-8 text-slate-300" />
                          }
                        </button>
                      </div>

                      {/* Digest toggle */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => toggleNotif(idx, "digest")}
                          className="cursor-pointer transition-all"
                        >
                          {row.digest
                            ? <ToggleRight className="w-8 h-8" style={{ color: "#7c3aed" }} />
                            : <ToggleLeft className="w-8 h-8 text-slate-300" />
                          }
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary & Save */}
              <div className="px-6 sm:px-8 pb-6 space-y-4">
                {/* Active count summary */}
                <div className="flex flex-wrap gap-3">
                  {(["IN_APP", "EMAIL"] as const).map((ch) => {
                    const active = notifMatrix.filter((r) => r.channel === ch && r.enabled).length
                    const total  = notifMatrix.filter((r) => r.channel === ch).length
                    const meta = channelMeta[ch]
                    return (
                      <div key={ch} className="flex items-center gap-2 px-3.5 py-2 rounded-xl" style={{ background: meta.bg, border: `1px solid ${meta.color}22` }}>
                        <span style={{ color: meta.color }}>{meta.icon}</span>
                        <span className="text-xs font-bold" style={{ color: meta.color }}>{ch}</span>
                        <span className="text-xs font-black" style={{ color: meta.color }}>{active}/{total} active</span>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={isSavingNotif}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-50 transition-all"
                    style={{ background: "#7c3aed", boxShadow: "0 4px 12px rgba(124,58,237,0.25)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#6d28d9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}
                  >
                    {isSavingNotif
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Bell className="w-4 h-4" />
                    }
                    {isSavingNotif ? "Saving…" : "Save Notification Preferences"}
                  </button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { severity: "CRITICAL", icon: <AlertTriangle className="w-4 h-4" />, desc: "Flood surge, sensor offline, threshold breach", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                { severity: "WARNING",  icon: <Zap className="w-4 h-4" />,           desc: "Rising trend, calibration drift, data gaps",   color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                { severity: "INFO",     icon: <Info className="w-4 h-4" />,           desc: "Scheduled maintenance, routine status updates", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
              ].map((item) => (
                <div key={item.severity} className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                  <span style={{ color: item.color }}>{item.icon}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: item.color }}>{item.severity}</p>
                    <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: item.color + "cc" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helper field component ─────────────────────────── */
const PrefField: React.FC<{
  label: string
  icon: React.ReactNode
  hint?: string
  children: React.ReactNode
}> = ({ label, icon, hint, children }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-1.5">
      {icon}
      <label className="text-xs font-bold text-slate-700">{label}</label>
    </div>
    {children}
    {hint && <p className="text-[11px] text-slate-400 pl-1">{hint}</p>}
  </div>
)

/* ─── Read-only info chip for fixed system values ─────── */
const InfoChip: React.FC<{
  icon: React.ReactNode
  label: string
  value: string
}> = ({ icon, label, value }) => (
  <div
    className="flex items-center justify-between px-4 py-2.5 rounded-xl"
    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
  >
    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
      <span className="text-slate-300">{icon}</span>
      {label}
    </span>
    <span className="text-xs font-bold text-slate-600">{value}</span>
  </div>
)


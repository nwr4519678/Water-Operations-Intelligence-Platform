import React, { useState, useEffect, useMemo } from "react"
import { useAuth } from "../hooks/useAuth"
import { useUiStore } from "../store/uiStore"
import { settingsApi, UserProfileDto } from "../api/settings"
import {
  User, Shield, Lock, Building2, Mail, Phone, MapPin,
  Laptop, CheckCircle2, Eye, EyeOff, KeyRound, Sliders,
  Compass, Clock, Check, Globe, Database, Save, RefreshCw,
  LogOut, Info, Fingerprint, Activity, Layers, Radio,
  Cpu, Zap, QrCode, Server,
} from "lucide-react"

type TabKey = "profile" | "security" | "permissions"

export const AccountPage: React.FC = () => {
  const { currentUser, logout } = useAuth()
  const addToast = useUiStore((s) => s.addToast)

  const [activeTab, setActiveTab] = useState<TabKey>("profile")
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [profileData, setProfileData] = useState<UserProfileDto | null>(null)

  const [displayName, setDisplayName] = useState("Operations Telemetry Officer")
  const [phone, setPhone] = useState("+20 2 2456 7890")
  const [sector, setSector] = useState("National Nile Basin & Regional Telemetry Network")
  const [stationOffice, setStationOffice] = useState("Central Operations Command Center · Directorate of Telemetry")
  const [theme, setTheme] = useState("LIGHT")
  const [locale, setLocale] = useState("en")
  const [timeZone, setTimeZone] = useState("Africa/Cairo")
  const [decimalPrecision, setDecimalPrecision] = useState<number>(2)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const loadProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const data = await settingsApi.getProfile()
      setProfileData(data)
      setDisplayName(data.displayName || "Operations Telemetry Officer")
      setTheme(data.theme || "LIGHT")
      setLocale(data.locale || "en")
      setTimeZone(data.timeZone || "Africa/Cairo")
      setDecimalPrecision(data.decimalPrecision ?? 2)
    } catch (err) {
      console.warn("Profile fallback", err)
    } finally {
      setIsLoadingProfile(false)
    }
  }

  useEffect(() => { loadProfile() }, [])

  const email = profileData?.email || currentUser?.email || "viewer.real@water.gov.eg"
  const orgName = profileData?.organizationName || "Ministry of Water Resources & Irrigation (MWRI)"
  const role = profileData?.role || currentUser?.role || "VIEWER"
  const initials = displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  const pwStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "" }
    let s = 0
    if (newPassword.length >= 8) s++
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) s++
    if (/[0-9]/.test(newPassword)) s++
    if (/[^A-Za-z0-9]/.test(newPassword)) s++
    const map = [
      { label: "", color: "" },
      { label: "Weak", color: "#ef4444" },
      { label: "Fair", color: "#f59e0b" },
      { label: "Strong", color: "#3b82f6" },
      { label: "Excellent", color: "#10b981" },
    ]
    return { score: s, ...map[s] }
  }, [newPassword])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const res = await settingsApi.updateProfile({ displayName: displayName.trim(), theme, locale, timeZone, decimalPrecision })
      addToast({ type: "success", title: "Saved", message: res.message || "Profile updated." })
      await loadProfile()
    } catch (err: any) {
      addToast({ type: "error", title: "Save Failed", message: err?.response?.data?.message || "Could not update profile." })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { addToast({ type: "error", title: "Mismatch", message: "Passwords do not match." }); return }
    if (newPassword.length < 8) { addToast({ type: "error", title: "Too Short", message: "Minimum 8 characters required." }); return }
    setIsUpdatingPassword(true)
    try {
      const res = await settingsApi.changePassword({ currentPassword, newPassword })
      addToast({ type: "success", title: "Password Updated", message: res.message || "Password changed successfully." })
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      addToast({ type: "error", title: "Authentication Failed", message: err?.response?.data?.message || "Current password is incorrect." })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile & Info", icon: <User className="w-4 h-4" /> },
    { key: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    { key: "permissions", label: "Permissions", icon: <Shield className="w-4 h-4" /> },
  ]

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="pb-20" style={{ background: "#f8fafc" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* ── HERO IDENTITY CARD (Full White) ────────────────────── */}
        <div
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563eb, #0ea5e9, #6366f1)" }} />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">

              {/* Avatar + name block */}
              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-2xl flex items-center justify-center text-white text-2xl font-black"
                    style={{
                      background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
                      boxShadow: "0 8px 20px rgba(37,99,235,0.25)",
                    }}
                  >
                    {initials}
                  </div>
                  {/* Online dot */}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <span className="absolute w-full h-full rounded-full bg-emerald-500 animate-ping opacity-50" />
                  </span>
                </div>

                {/* Identity text */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                      {displayName}
                    </h1>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                    >
                      <Fingerprint className="w-3 h-3" /> {role}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Session
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-semibold text-slate-700">{orgName}</span>
                    </span>
                    <span className="hidden sm:block w-px h-3.5 bg-slate-200" />
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-mono font-bold text-slate-900">{email}</span>
                    </span>
                    <span className="hidden sm:block w-px h-3.5 bg-slate-200" />
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      Arab Republic of Egypt
                    </span>
                  </div>
                </div>
              </div>

              {/* Right stat chips */}
              <div className="flex flex-wrap gap-3 lg:ml-auto mt-1">
                {[
                  { icon: <Radio className="w-4 h-4" />, label: "Telemetry Grid", value: "19 National Reaches", iconColor: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
                  { icon: <Zap className="w-4 h-4" />, label: "Last Login", value: profileData?.lastLoginAtUtc ? new Date(profileData.lastLoginAtUtc).toLocaleDateString("en-EG") : "Today", iconColor: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 rounded-2xl"
                    style={{ background: s.bg, border: `1px solid ${s.border}` }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{s.label}</p>
                    <p className="text-sm font-extrabold flex items-center gap-1.5" style={{ color: s.iconColor }}>
                      <span style={{ color: s.iconColor }}>{s.icon}</span>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB BAR ────────────────────────────────────────────── */}
        <div
          className="flex gap-1.5 p-1.5 rounded-2xl"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
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
                    ? { background: "#2563eb", color: "#ffffff", boxShadow: "0 4px 12px rgba(37,99,235,0.25)" }
                    : { color: "#64748b", background: "transparent" }
                }
              >
                <span style={{ color: active ? "#93c5fd" : "#94a3b8" }}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ─────────────────── PROFILE TAB ─────────────────────── */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">

            {/* Main form card */}
            <div
              className="lg:col-span-8 rounded-3xl overflow-hidden"
              style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {/* Card header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Personnel & Operational Assignment</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Synced with Security.User & Platform.Organization in PostgreSQL</p>
                  </div>
                </div>
                <button
                  onClick={loadProfile}
                  disabled={isLoadingProfile}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
                  style={{ color: "#2563eb", background: "#eff6ff", border: "1px solid #bfdbfe" }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProfile ? "animate-spin" : ""}`} />
                  {isLoadingProfile ? "Syncing…" : "Sync DB"}
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="px-6 sm:px-8 py-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Official Display Name" icon={<User className="w-3.5 h-3.5 text-blue-500" />}>
                    <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                      style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                      onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)" }}
                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none" }}
                    />
                  </FormField>

                  <FormField label="Institutional Email" icon={<Mail className="w-3.5 h-3.5 text-blue-500" />} badge={
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: "#059669", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  }>
                    <input type="email" readOnly value={email}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-mono font-semibold cursor-not-allowed"
                      style={{ border: "1.5px solid #e2e8f0", background: "#f1f5f9", color: "#475569" }}
                    />
                  </FormField>

                  <FormField label="Operations Contact / Hotline" icon={<Phone className="w-3.5 h-3.5 text-blue-500" />}>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                      style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                      onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)" }}
                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none" }}
                    />
                  </FormField>

                  <FormField label="Hydrological Jurisdiction" icon={<Compass className="w-3.5 h-3.5 text-blue-500" />}>
                    <input type="text" value={sector} onChange={(e) => setSector(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                      style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                      onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)" }}
                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none" }}
                    />
                  </FormField>
                </div>

                <FormField label="Command Desk / Facility" icon={<MapPin className="w-3.5 h-3.5 text-blue-500" />}>
                  <input type="text" value={stationOffice} onChange={(e) => setStationOffice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all"
                    style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                    onFocus={(e) => { e.target.style.borderColor = "#2563eb"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)" }}
                    onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none" }}
                  />
                </FormField>

                {/* Footer bar */}
                <div className="flex items-center justify-end pt-5 mt-2 border-t border-slate-100">
                  <button
                    type="submit" disabled={isSavingProfile}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                    style={{ background: "#2563eb", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1d4ed8")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#2563eb")}
                  >
                    {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSavingProfile ? "Saving…" : "Save Profile Changes"}
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-4">

              {/* Official ID Card — white with blue accent top */}
              <div
                className="rounded-3xl overflow-hidden"
                style={{ background: "#ffffff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
              >
                {/* Colourful top bar */}
                <div className="h-1.5" style={{ background: "linear-gradient(90deg, #f59e0b, #2563eb, #6366f1)" }} />

                <div className="p-6 space-y-4">
                  {/* Ministry header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-700">Arab Republic of Egypt</p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">Ministry of Water Resources</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded" style={{ background: "#fefce8", color: "#b45309", border: "1px solid #fde68a" }}>
                      OFFICIAL
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shrink-0"
                      style={{ background: "linear-gradient(135deg, #2563eb, #0ea5e9)" }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-xs font-semibold text-blue-600 truncate">Hydrological Telemetry Officer</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">EG-MWRI-1004</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-0">
                    {[
                      { label: "Clearance", value: "Tier-1 Observer", color: "#0f172a" },
                      { label: "Jurisdiction", value: "19 Nile Basins", color: "#2563eb" },
                      { label: "Email", value: email, mono: true, color: "#374151" },
                      { label: "Created", value: profileData?.createdAtUtc ? new Date(profileData.createdAtUtc).toLocaleDateString() : "2026-09-02", color: "#374151" },
                      { label: "Crypto Seal", value: "SHA-256 ✓", color: "#059669" },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs">
                        <span className="text-slate-400 font-medium">{row.label}</span>
                        <span className={row.mono ? "font-mono font-semibold" : "font-bold"} style={{ color: row.color, fontSize: "11px" }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[10px] border-t border-slate-100">
                    <span className="flex items-center gap-1.5 font-mono font-bold text-slate-400">
                      <QrCode className="w-3.5 h-3.5 text-blue-400" />
                      DIGITAL PASS #1004
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Valid
                    </span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        )}

        {/* ─────────────────── SECURITY TAB ────────────────────── */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200">

            <div
              className="lg:col-span-7 rounded-3xl overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              {/* Header */}
              <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-slate-100 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#faf5ff", border: "1px solid #e9d5ff" }}>
                  <KeyRound className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Change Institutional Password</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Verified by ASP.NET PasswordHasher · Persisted in Security.User</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="px-6 sm:px-8 py-6 space-y-5">
                <FormField label="Current Password" icon={<Lock className="w-3.5 h-3.5 text-violet-500" />}>
                  <div className="relative">
                    <input type={showCurrent ? "text" : "password"} required value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password"
                      className="w-full pl-4 pr-11 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                      style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                      onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)" }}
                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none" }}
                    />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="New Password" icon={<KeyRound className="w-3.5 h-3.5 text-violet-500" />}>
                    <div className="relative">
                      <input type={showNew ? "text" : "password"} required value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters"
                        className="w-full pl-4 pr-11 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                        style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                        onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)" }}
                        onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none" }}
                      />
                      <button type="button" onClick={() => setShowNew(!showNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Confirm Password" icon={<CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />}>
                    <input type={showNew ? "text" : "password"} required value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password"
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-300"
                      style={{ border: "1.5px solid #e2e8f0", background: "#f8fafc" }}
                      onFocus={(e) => { e.target.style.borderColor = "#7c3aed"; e.target.style.background = "#fff"; e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.08)" }}
                      onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.background = "#f8fafc"; e.target.style.boxShadow = "none" }}
                    />
                  </FormField>
                </div>

                {newPassword && (
                  <div className="p-3.5 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-500 font-medium">Password Strength</span>
                      <span className="font-bold" style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                    </div>
                    <div className="flex gap-1.5 h-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex-1 rounded-full transition-all duration-300"
                          style={{ background: n <= pwStrength.score ? pwStrength.color : "#e2e8f0" }} />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={isUpdatingPassword}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-50 transition-all"
                    style={{ background: "#7c3aed", boxShadow: "0 4px 12px rgba(124,58,237,0.25)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#6d28d9")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#7c3aed")}
                  >
                    {isUpdatingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {isUpdatingPassword ? "Updating…" : "Update Password"}
                  </button>
                </div>

                <div className="p-4 rounded-2xl flex items-start gap-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-600">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Cryptographic Password Governance</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Password updates are verified by ASP.NET Identity PasswordHasher and persisted to Security.User with previous tokens invalidated.
                    </p>
                  </div>
                </div>
              </form>
            </div>

            {/* Session panel */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                      <Laptop className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Active Session</h3>
                      <p className="text-[10px] text-slate-400">Authenticated Operational Console</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #bbf7d0" }}>
                    Online
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div className="p-4 rounded-2xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shrink-0">
                        <Laptop className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Primary Operations Desk</p>
                        <p className="text-xs text-slate-500">Chrome · Central Console</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> Cairo Operations Center
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-[11px] border-t border-slate-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Session User</span>
                        <span className="font-mono font-semibold text-slate-700">{email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Token Lifetime</span>
                        <span className="font-bold text-slate-700">Rolling 30-Min JWT</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { logout(); addToast({ type: "info", title: "Logged Out", message: "Session terminated." }) }}
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    style={{ background: "#fff1f2", color: "#e11d48", border: "1.5px solid #fecdd3" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ffe4e6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}
                  >
                    <LogOut className="w-4 h-4" />
                    Terminate & Logout Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────── PERMISSIONS TAB ─────────────────── */}
        {activeTab === "permissions" && (
          <div className="space-y-5 animate-in fade-in duration-200">

            {/* Clearance banner — white with blue left border */}
            <div
              className="rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 relative overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e2e8f0", borderLeft: "4px solid #2563eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                  <Shield className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="text-lg font-bold text-slate-900">Tier-1 National Telemetry Viewer</h2>
                    <span className="px-3 py-0.5 rounded-full text-xs font-black" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                      ROLE: {role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                    Read-only access to real-time telemetry, AI forecasting, anomaly detection, and audit inspection across all 19 Egyptian hydrological reaches.
                  </p>
                </div>
              </div>
              <div className="sm:ml-auto px-5 py-3 rounded-2xl shrink-0" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Privilege Scope</p>
                <p className="text-sm font-extrabold text-blue-700 mt-0.5">All Reaches · Egypt</p>
              </div>
            </div>

            {/* Permission Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PermCard
                accentColor="#059669"
                icon={<Activity className="w-5 h-5" />}
                title="Telemetry & Monitoring"
                countLabel="6 of 6 Granted"
                granted
                items={[
                  "Real-time 19-Station Map & Radar",
                  "Dual Y-axis multi-parameter charts",
                  "120-Day AI LSTM neural forecasts",
                  "DBSCAN spatial anomaly inspection",
                  "SignalR WebSocket streaming",
                  "PDF, Excel & CSV report export",
                ]}
              />
              <PermCard
                accentColor="#2563eb"
                icon={<Layers className="w-5 h-5" />}
                title="Audits & Alarms"
                countLabel="4 of 4 Granted"
                granted
                items={[
                  "Critical flood & surge alarm logs",
                  "AI anomaly root-cause diagnostics",
                  "Multi-basin threshold breach inspection",
                  "Historical operational audit reviews",
                ]}
              />
              <PermCard
                accentColor="#d97706"
                icon={<Lock className="w-5 h-5" />}
                title="Controlled Actions"
                countLabel="Restricted (Level-3)"
                granted={false}
                items={[
                  "Remote sluice gate overrides",
                  "Sensor calibration threshold rewrites",
                  "RTU firmware remote flashing",
                  "User provisioning & role delegation",
                ]}
                footer="Requires Chief Hydraulic Engineer or Admin authorization per Ministerial Decree No. 418."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Helper components ─────────────────────────────────── */

const FormField: React.FC<{
  label: string
  icon: React.ReactNode
  badge?: React.ReactNode
  children: React.ReactNode
}> = ({ label, icon, badge, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-600 flex items-center justify-between">
      <span className="flex items-center gap-1.5">{icon}{label}</span>
      {badge}
    </label>
    {children}
  </div>
)

const PermCard: React.FC<{
  accentColor: string
  icon: React.ReactNode
  title: string
  countLabel: string
  granted: boolean
  items: string[]
  footer?: string
}> = ({ accentColor, icon, title, countLabel, granted, items, footer }) => (
  <div
    className="rounded-3xl overflow-hidden"
    style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
  >
    <div className="h-1" style={{ background: accentColor }} />
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: accentColor, boxShadow: `0 4px 10px ${accentColor}33` }}>
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <span className="text-[11px] font-bold" style={{ color: accentColor }}>{countLabel}</span>
        </div>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs">
            {granted
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
              : <Lock className="w-4 h-4 shrink-0 mt-0.5 text-slate-300" />}
            <span className={granted ? "text-slate-700 font-medium" : "text-slate-400"}>{item}</span>
          </li>
        ))}
      </ul>
      {footer && (
        <p className="text-[10px] text-slate-400 leading-relaxed pt-3 border-t border-slate-100">{footer}</p>
      )}
    </div>
  </div>
)

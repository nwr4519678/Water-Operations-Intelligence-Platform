// src/pages/LoginPage.tsx
import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { PinInput } from "../components/common/PinInput"
import {
  Droplets,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  Satellite,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { authApi } from "../api/auth"

type LoginStep = "CREDENTIALS" | "MFA_VERIFY"

const LIVE_METRICS = [
  { label: "Lake Nasser", value: "178.14 m", delta: "+0.12", ok: true },
  { label: "Toshka East", value: "161.63 m", delta: "−0.04", ok: true },
  { label: "Lake Qarun", value: "−42.87 m", delta: "±0.00", ok: true },
]

const TICKER = [
  "19 / 19 Telemetry Stations Uplinked",
  "Lake Nasser: 178.14 m AMSL · Nominal",
  "Toshka Spillway: 7.4 m Headroom",
  "Nile Basin: 99.94% Packet Integrity",
  "AI Anomaly Score: No Threats Detected",
]

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<LoginStep>("CREDENTIALS")
  const [email, setEmail] = useState("viewer.real@water.gov.eg")
  const [password, setPassword] = useState("WaterOps@2026!")
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickerIdx, setTickerIdx] = useState(0)

  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % TICKER.length), 3500)
    return () => clearInterval(id)
  }, [])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await login({ email, password })
      navigate("/")
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your institutional account.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mfaCode.length !== 6) return
    setIsLoading(true)
    setError(null)
    try {
      await authApi.verifyMfa(mfaCode)
      navigate("/")
    } catch {
      setError("Invalid 6-digit MFA authentication code.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-slate-950">

      {/* ═══════════════════════════════════════════
          LEFT PANEL — Cinematic National GIS Showcase
      ═══════════════════════════════════════════ */}
      <div className="relative flex-1 min-h-[320px] lg:min-h-screen flex flex-col justify-between p-7 sm:p-10 lg:p-14 overflow-hidden">

        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[30s] scale-110 hover:scale-100"
          style={{ backgroundImage: "url('/images/login-hero.jpg')" }}
        />

        {/* Layered Overlays for Depth & Legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-blue-950/40 to-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
        {/* Right edge — no separator */}

        {/* ── BRAND BADGE ── */}
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-tight">Water Operations Platform</div>
              <div className="text-[9.5px] text-cyan-300 font-bold uppercase tracking-widest">MWRI · Arab Republic of Egypt</div>
            </div>
          </div>

          {/* Live system pill */}
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/25">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wide">All Systems Live</span>
          </div>
        </div>

        {/* ── HERO TEXT + HUD ── */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/25 text-blue-200 text-[10.5px] font-bold uppercase tracking-widest rounded-full px-3.5 py-1 mb-5 backdrop-blur-sm">
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            <span>DaHITI Satellite Radar Altimetry</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-black text-white tracking-tight leading-[1.15] drop-shadow-lg">
            National Hydrological<br />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-blue-400 bg-clip-text text-transparent">
              Digital Twin Network
            </span>
          </h2>

          <p className="mt-4 text-[13px] text-slate-300/90 leading-relaxed font-medium max-w-md">
            Real-time satellite altimetry across Lake Nasser, Toshka, Qarun 
            and the Egyptian Nile Basin — with AI-powered anomaly detection 
            and live telemetry for 19 monitoring stations.
          </p>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-3 mt-7">
            {LIVE_METRICS.map((m) => (
            <div key={m.label} className="bg-white/8 backdrop-blur-md border border-white/12 rounded-2xl p-4 hover:bg-white/12 hover:border-cyan-400/30 transition-all duration-300 cursor-default">
                <div className="text-[9px] uppercase font-black tracking-widest text-slate-400/80 mb-1.5">{m.label}</div>
                <div className="text-xl font-black text-white font-mono leading-none tracking-tight">{m.value}</div>
                <div className={`text-[10px] font-bold mt-2 flex items-center gap-1.5 ${m.ok ? "text-emerald-300" : "text-amber-300"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${m.ok ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <span>Nominal · {m.delta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── ANIMATED TICKER ── */}
        <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="shrink-0 flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-widest text-emerald-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>Live</span>
          </div>
          <div className="h-4 w-px bg-white/15 shrink-0" />
          <div className="overflow-hidden h-4 flex-1">
            <div
              key={tickerIdx}
              className="text-[11px] text-slate-300 font-semibold animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {TICKER[tickerIdx]}
            </div>
          </div>
          <div className="text-[9.5px] text-slate-600 font-mono shrink-0 hidden sm:block">
            © 2026 MWRI · Egypt
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Executive Login Console
      ═══════════════════════════════════════════ */}
      <div className="w-full lg:w-[480px] xl:w-[520px] bg-white flex flex-col justify-center px-8 py-10 sm:px-12 lg:px-14 xl:px-16 relative z-10 shadow-[-8px_0_60px_rgba(0,0,0,0.15)]">

        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-700 via-cyan-400 to-blue-700" />

        {/* Panel Header */}
        <div className="mb-8">
          {/* Gov Seal Row */}
          <div className="flex items-center gap-3 mb-7 pb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/25">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 tracking-tight">Water Operations</div>
              <div className="text-[10px] text-slate-400 font-semibold">National Operations Platform · MWRI</div>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-700 font-black">Live</span>
            </div>
          </div>

          {step === "CREDENTIALS" ? (
            <>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Welcome back
              </h1>
              <p className="text-[13px] text-slate-500 mt-2 font-medium leading-relaxed">
                Sign in to access telemetry data, AI anomaly hub, GIS maps, and compliance operations.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Two-Factor Auth</h1>
              <p className="text-[13px] text-slate-500 mt-2 font-medium">Enter the 6-digit TOTP code from your authenticator app to continue.</p>
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in duration-300">
            {error}
          </div>
        )}

        {/* ── CREDENTIALS FORM ── */}
        {step === "CREDENTIALS" ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@water.gov.eg"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none transition-all shadow-2xs
                    focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-slate-400/70"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-medium outline-none transition-all shadow-2xs
                    focus:border-blue-500 focus:ring-3 focus:ring-blue-500/10 placeholder:text-slate-400/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Role badge + MFA toggle */}
            <div className="flex items-center justify-between pt-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Role: VIEWER · Read-Only</span>
              </div>
              <button
                type="button"
                onClick={() => setStep("MFA_VERIFY")}
                className="flex items-center gap-0.5 text-[11px] text-blue-600 font-bold hover:text-blue-800 cursor-pointer transition-colors"
              >
                Use MFA Token
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 rounded-xl font-black text-sm text-white tracking-wide transition-all cursor-pointer
                bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-800
                disabled:opacity-60 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 active:translate-y-0
                flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Operations Center</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>

            {/* Demo Credential Auto-Fill */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100/80 mt-1 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-widest text-blue-600 mb-0.5">Demo Credentials</div>
                  <div className="text-[11px] font-mono font-semibold text-slate-700 truncate">viewer.real@water.gov.eg</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmail("viewer.real@water.gov.eg")
                  setPassword("WaterOps@2026!")
                }}
                className="shrink-0 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-[11px] font-black hover:bg-blue-700 cursor-pointer transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
              >
                Fill →
              </button>
            </div>
          </form>

        ) : (
          /* ── MFA FORM ── */
          <form onSubmit={handleMfaSubmit} className="space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7 text-blue-600" />
            </div>

            <PinInput value={mfaCode} onChange={setMfaCode} disabled={isLoading} />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => { setStep("CREDENTIALS"); setError(null) }}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
              >
                ← Back to Login
              </button>
              <button
                type="submit"
                disabled={isLoading || mfaCode.length !== 6}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black disabled:opacity-50 cursor-pointer transition-all shadow-md hover:-translate-y-px"
              >
                Verify & Enter
              </button>
            </div>
          </form>
        )}

        {/* Security Trust Strip */}
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
          {/* Security Badges */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />, label: "TLS 1.3" },
              { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />, label: "AES-256" },
              { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />, label: "ISO 27001" },
            ].map((b) => (
              <div key={b.label} className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-[10.5px] font-bold text-emerald-700">
                {b.icon}
                {b.label}
              </div>
            ))}
          </div>


          <p className="text-center text-[10px] text-slate-400 font-medium">
            © 2026 Arab Republic of Egypt · Ministry of Water Resources & Irrigation
          </p>
        </div>
      </div>
    </div>
  )
}

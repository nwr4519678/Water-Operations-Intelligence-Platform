// src/pages/LoginPage.tsx
import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { Card } from "../components/common/Card"
import { Button } from "../components/common/Button"
import { PinInput } from "../components/common/PinInput"
import {
  Droplets,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
} from "lucide-react"
import { authApi } from "../api/auth"

type LoginStep = "CREDENTIALS" | "MFA_VERIFY"

export const LoginPage: React.FC = () => {
  const [step, setStep] = useState<LoginStep>("CREDENTIALS")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mfaCode, setMfaCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login({ email, password })
      navigate("/")
    } catch (err: any) {
      setError(err.message || "Invalid credentials.")
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
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden text-slate-900">
      {/* Background Soft Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-cyan-100/60 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-blue-500/25 mb-3">
            <Droplets className="w-8 h-8" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Water Operations Platform
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Ministry of Water Resources & Irrigation — Viewer Portal
            </span>
          </p>
        </div>

        <Card className="bg-white border-slate-200 shadow-xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {step === "CREDENTIALS" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="viewer@water.gov.eg"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Role: VIEWER (Read-Only)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setStep("MFA_VERIFY")}
                  className="text-blue-600 font-semibold hover:underline cursor-pointer"
                >
                  Use MFA Token →
                </button>
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Operations Portal
              </Button>

            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Two-Factor Authentication
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter the 6-digit TOTP code from your authenticator app
                </p>
              </div>

              <PinInput
                value={mfaCode}
                onChange={setMfaCode}
                disabled={isLoading}
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep("CREDENTIALS")}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← Back to Login
                </button>

                <Button
                  type="submit"
                  size="sm"
                  isLoading={isLoading}
                  disabled={mfaCode.length !== 6}
                >
                  Verify & Enter
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>
            © 2026 Arab Republic of Egypt • Ministry of Water Resources and
            Irrigation
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <Link
              to="/"
              className="text-blue-600 hover:underline font-semibold"
            >
              Live Operations Overview
            </Link>
            <span>•</span>
            <Link
              to="/map"
              className="text-blue-600 hover:underline font-semibold"
            >
              Hydrological Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

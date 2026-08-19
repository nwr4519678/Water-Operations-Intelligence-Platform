import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, Waves } from 'lucide-react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, viewerCredentials } from '../hooks/useAuth'

export function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard'
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email address.'); return } if (password.length < 8) { setError('Password must contain at least 8 characters.'); return } setLoading(true); const result = await login(email, password); setLoading(false); if (result.success) navigate(destination, { replace: true }); else setError(result.message ?? 'Unable to start a viewer session.') }
  return <main className="login-page"><section className="login-brand-panel"><div className="login-brand"><span><Waves size={30} /></span><strong>EchoCloud</strong></div><div className="login-message"><p className="section-kicker">WATER OPERATIONS INTELLIGENCE</p><h1>Clarity for every water movement.</h1><p>Read-only telemetry, historical trends, alarm visibility and report downloads for MERI field stations.</p><div className="login-station-list"><span><i /> Damietta Barrages · MERI Demo</span><span><i /> Wadi El Natrun · MERI-WadiAl-Natroun</span></div></div><p className="login-footer">Space Echo × Water & Marine Environmental Research Institute</p></section><section className="login-form-panel"><div className="login-card"><p className="section-kicker">VIEWER ACCESS</p><h2>Welcome back</h2><p>Sign in to view the operational monitoring workspace.</p><form onSubmit={submit} noValidate><label>Email address<div className="input-wrap"><Mail size={18} /><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="viewer@echocloud.meri" autoComplete="email" /></div></label><label>Password<div className="input-wrap"><LockKeyhole size={18} /><input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" /><button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="login-submit" type="submit" disabled={loading}>{loading ? 'Verifying access…' : 'Sign in as viewer'}</button></form><div className="demo-credentials"><strong>Demo viewer account</strong><span>{viewerCredentials.email}</span><span>{viewerCredentials.password}</span></div><small className="login-security">Viewer role only · no configuration or control permissions</small></div></section></main>
}

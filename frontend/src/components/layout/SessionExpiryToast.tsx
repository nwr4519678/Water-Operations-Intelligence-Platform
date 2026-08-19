import { AlertTriangle, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

function formatRemaining(seconds: number): string { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` }

export function SessionExpiryToast() { const { secondsRemaining, logout } = useAuth(); if (secondsRemaining === 0 || secondsRemaining > 300) return null; return <div className="session-toast" role="status"><AlertTriangle size={18} /><div><strong>Viewer session expires soon</strong><span>Automatic sign-out in {formatRemaining(secondsRemaining)}</span></div><button type="button" onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div> }

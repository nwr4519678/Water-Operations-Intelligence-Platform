import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../hooks/useAuth'
import { ThemeProvider } from '../hooks/useTheme'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../components/layout/ProtectedRoute'
import { Alerts } from '../pages/Alerts'
import { Blog } from '../pages/Blog'
import { Dashboard } from '../pages/Dashboard'
import { DeviceConfig } from '../pages/DeviceConfig'
import { DeviceDetail } from '../pages/DeviceDetail'
import { Devices } from '../pages/Devices'
import { DownloadCenter } from '../pages/DownloadCenter'
import { Login } from '../pages/Login'
import { NotFound } from '../pages/NotFound'
import { Profile } from '../pages/Profile'

export default function App() {
  return <ThemeProvider><AuthProvider><Routes><Route path="/login" element={<Login />} /><Route element={<ProtectedRoute />}><Route element={<AppLayout />}><Route path="/dashboard" element={<Dashboard />} /><Route path="/devices" element={<Devices />} /><Route path="/devices/:id" element={<DeviceDetail />} /><Route path="/alerts" element={<Alerts />} /><Route path="/download-center" element={<DownloadCenter />} /><Route path="/device-config" element={<DeviceConfig />} /><Route path="/profile" element={<Profile />} /><Route path="/blog" element={<Blog />} /><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="*" element={<NotFound />} /></Route></Route><Route path="*" element={<Navigate to="/login" replace />} /></Routes></AuthProvider></ThemeProvider>
}

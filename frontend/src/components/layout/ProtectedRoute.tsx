import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function ProtectedRoute() { const { isAuthenticated } = useAuth(); const location = useLocation(); return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} /> }

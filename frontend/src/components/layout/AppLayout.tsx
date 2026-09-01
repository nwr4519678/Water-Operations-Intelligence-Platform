// src/components/layout/AppLayout.tsx
import React, { useState } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { GlobalSearchModal } from "./GlobalSearchModal"
import { ToastContainer } from "../common/Toast"
import { useSignalR } from "../../hooks/useSignalR"
import { useAuthStore } from "../../store/authStore"

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Real-time SignalR
  useSignalR()

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <Sidebar />
      <main>
        <Header onMenuClick={() => setSidebarOpen((open) => !open)} />
        <Outlet />
      </main>

      <GlobalSearchModal />
      <ToastContainer />
    </div>
  )
}

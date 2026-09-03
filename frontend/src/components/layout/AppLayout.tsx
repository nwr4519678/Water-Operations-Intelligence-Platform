// src/components/layout/AppLayout.tsx
import React, { useState, useEffect } from "react"
import { Navigate, Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { GlobalSearchModal } from "./GlobalSearchModal"
import { ToastContainer } from "../common/Toast"
import { useSignalR } from "../../hooks/useSignalR"
import { useAuthStore } from "../../store/authStore"

const BREAKPOINT = 900

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > BREAKPOINT)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= BREAKPOINT)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Hooks must run on every render, including the unauthenticated redirect.
  useSignalR()

  // Auto-close sidebar when screen shrinks below breakpoint, auto-open when it grows back
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= BREAKPOINT
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Close sidebar on mobile when clicking anywhere outside without any blur or fog overlay
  useEffect(() => {
    if (!isMobile || !sidebarOpen) return

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null
      if (target && !target.closest(".scada-sidebar") && !target.closest(".menu")) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener("pointerdown", handleOutsideClick)
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick)
    }
  }, [isMobile, sidebarOpen])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <Sidebar />

      <main className="flex-1 w-full min-w-0 flex flex-col h-screen overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen((open) => !open)}
          sidebarOpen={sidebarOpen}
        />
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%" }}>
          <Outlet />
        </div>
      </main>

      <GlobalSearchModal />
      <ToastContainer />
    </div>
  )
}

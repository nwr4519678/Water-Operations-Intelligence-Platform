// src/components/layout/AppLayout.tsx
import React from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { GlobalSearchModal } from "./GlobalSearchModal"
import { ToastContainer } from "../common/Toast"
import { useSignalR } from "../../hooks/useSignalR"

export const AppLayout: React.FC = () => {
  // Real-time SignalR
  useSignalR()

  return (
    <div className="app-shell">
      <Sidebar />
      <main>
        <Header />
        <Outlet />
      </main>

      <GlobalSearchModal />
      <ToastContainer />
    </div>
  )
}

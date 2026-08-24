// src/components/layout/UserMenu.tsx
import React, { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth"
import { Settings, LogOut, ShieldCheck, User } from "lucide-react"

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
          {String(currentUser?.name || currentUser?.email || "OP")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 truncate max-w-[140px]">
            {currentUser?.name || "Chief Engineer"}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            VIEWER (Read-Only)
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="text-xs font-bold text-slate-900">
              {currentUser?.name || "Eng. Mohamed Atef"}
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              {currentUser?.email || "viewer.ops@water.gov.eg"}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Role: VIEWER</span>
            </div>
          </div>

          <div className="p-1.5 space-y-1 bg-white">
            <button
              onClick={() => {
                setIsOpen(false)
                navigate("/account")
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span>My Account & Profile</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false)
                navigate("/settings")
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Preferences & Matrix</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

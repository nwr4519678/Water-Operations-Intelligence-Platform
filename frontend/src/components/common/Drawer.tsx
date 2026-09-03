// src/components/common/Drawer.tsx
import React, { useEffect } from "react"
import { X } from "lucide-react"

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  width?: string
  position?: "right" | "left"
  mode?: "drawer" | "modal"
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-md",
  mode = "drawer",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto flex ${
        mode === "modal" ? "items-center justify-center p-3 sm:p-6 md:p-8" : "overflow-hidden"
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative ${
          mode === "drawer"
            ? "ml-auto h-full border-l animate-in slide-in-from-right"
            : "h-auto max-h-[92vh] rounded-2xl md:rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-950/20 animate-in zoom-in-95 overflow-hidden ring-1 ring-slate-900/5"
        } w-full ${width} bg-white z-10 flex flex-col duration-200 text-slate-900`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60 backdrop-blur-xs">
          <div className="text-sm font-bold text-slate-900 truncate">
            {title}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">{children}</div>
      </div>
    </div>
  )
}

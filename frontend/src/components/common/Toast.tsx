// src/components/common/Toast.tsx
import React from "react"
import { useUiStore } from "../../store/uiStore"
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react"

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useUiStore()

  const iconMap: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    alarm: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white border border-slate-200 shadow-xl rounded-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-bottom-3 duration-200 text-slate-900"
        >
          {iconMap[toast.type]}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-900 truncate">
              {toast.title}
            </div>
            {toast.message && (
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                {toast.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}

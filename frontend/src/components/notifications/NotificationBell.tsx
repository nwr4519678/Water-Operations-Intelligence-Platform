// src/components/notifications/NotificationBell.tsx
import React, { useState, useMemo } from "react"
import { createPortal } from "react-dom"
import { useNavigate } from "react-router-dom"
import {
  Bell, Check, X, AlertTriangle, ChevronRight,
  ExternalLink, CheckCheck, Clock, Radio
} from "lucide-react"
import {
  useNotificationsList,
  useUnreadNotificationsCount,
  useMarkNotificationRead,
} from "../../hooks/useNotificationQueries"
import { Spinner } from "../common/Spinner"

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState<"all" | "freshness" | "critical">("all")
  const navigate = useNavigate()

  const { data: unreadData } = useUnreadNotificationsCount()
  const { data: listData, isLoading } = useNotificationsList({
    unreadOnly: false,
    pageSize: 12,
  })
  const markReadMutation = useMarkNotificationRead()

  const unreadCount = unreadData?.count || 0

  const openNotification = (notification: NonNullable<typeof listData>["items"][number]) => {
    const stationIdMatch = notification.body.match(/\bDAHITI-\d+\b/i) || notification.title.match(/\bDAHITI-\d+\b/i)
    const stationId = stationIdMatch?.[0]
    if (!notification.isRead && notification.notificationId > 0) {
      markReadMutation.mutate(notification.notificationId)
    }
    setIsOpen(false)
    if (stationId) {
      navigate(`/alarms?alarmId=data-freshness-${stationId.toUpperCase()}`)
    } else {
      navigate("/alarms")
    }
  }

  const markAllRead = () => {
    if (!listData) return
    listData.items.forEach((item) => {
      if (!item.isRead && item.notificationId > 0) {
        markReadMutation.mutate(item.notificationId)
      }
    })
  }

  // Parse station metadata out of title & body
  const parsedNotifications = useMemo(() => {
    if (!listData?.items) return []
    return listData.items.map((n) => {
      const codeMatch = n.body.match(/\bDAHITI-\d+\b/i) || n.title.match(/\bDAHITI-\d+\b/i)
      const stationCode = codeMatch ? codeMatch[0].toUpperCase() : null
      
      // Clean title: extract station name
      let stationName = n.title
        .replace(/^Historical telemetry warning/i, "")
        .replace(/^Telemetry Freshness Warning · /i, "")
        .trim()
      
      if (!stationName || stationName === "Historical telemetry warning") {
        // Try extracting from body: "Toshka Lakes (East Basin) (DAHITI-17699)..."
        const bodyNameMatch = n.body.match(/^([^(]+)/)
        if (bodyNameMatch) {
          stationName = bodyNameMatch[1].replace(/^Station /i, "").trim()
        }
      }
      if (!stationName) stationName = stationCode ?? "Hydrological Station"

      const isFreshness = n.title.toLowerCase().includes("telemetry") ||
        n.title.toLowerCase().includes("historical") ||
        n.body.toLowerCase().includes("recent reading") ||
        n.body.toLowerCase().includes("telemetry")

      return {
        ...n,
        stationCode,
        stationName,
        isFreshness,
      }
    })
  }, [listData])

  const filteredItems = useMemo(() => {
    if (filterType === "freshness") return parsedNotifications.filter((i) => i.isFreshness)
    if (filterType === "critical") return parsedNotifications.filter((i) => !i.isFreshness)
    return parsedNotifications
  }, [parsedNotifications, filterType])

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-all cursor-pointer"
        title="Operations Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal((
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/35 backdrop-blur-[2px] p-4 sm:p-10"
          style={{ zIndex: 9999 }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative mt-2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-900 flex flex-col max-h-[82vh]"
            style={{ zIndex: 10000 }}
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      Operational Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                        {unreadCount} active warnings
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Telemetry transmission health &amp; station maintenance watchdog
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/80 px-2.5 py-1 rounded-md border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Acknowledge All</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-50/60 border-b border-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === "all"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Events ({parsedNotifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("freshness")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterType === "freshness"
                    ? "bg-white text-amber-800 shadow-xs border border-amber-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Telemetry Gaps ({parsedNotifications.filter((i) => i.isFreshness).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("critical")}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === "critical"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Critical Alarms (0)
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto divide-y divide-slate-100/80 bg-white flex-1 custom-scrollbar">
              {isLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-xs text-slate-400">Loading telemetry notifications...</span>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No notifications matching filter
                </div>
              ) : (
                filteredItems.map((n) => (
                  <div
                    key={n.notificationId}
                    role="button"
                    tabIndex={0}
                    onClick={() => openNotification(n)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openNotification(n)
                      }
                    }}
                    className={`group relative cursor-pointer px-6 py-4 hover:bg-blue-50/50 transition-all flex items-start gap-3.5 border-l-4 ${
                      !n.isRead ? "border-l-amber-500 bg-amber-50/20" : "border-l-transparent"
                    }`}
                  >
                    {/* Severity Icon Badge */}
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <AlertTriangle className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                            {n.stationName}
                          </span>
                          {n.stationCode && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">
                              {n.stationCode}
                            </span>
                          )}
                        </div>
                        <span className="text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 border border-amber-200/60">
                          Telemetry Stale
                        </span>
                      </div>

                      <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">
                        Station transmission is stale or in maintenance mode. Last observation has exceeded 90-day transmission SLA window.
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10.5px] text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>System Watchdog · Flagged for calibration</span>
                        </div>
                        <div className="flex items-center gap-1 font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                          <span>Inspect Station</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>

                    {/* Mark Read Quick Action */}
                    {!n.isRead && n.notificationId > 0 && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          markReadMutation.mutate(n.notificationId)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
                        title="Acknowledge notification"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/80 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate("/alarms")
                }}
                className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open Alarms Command Center</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2 text-slate-400">
                <Radio className="w-3.5 h-3.5 text-emerald-500" />
                <span>Live Satellite Ingestion Watch Active</span>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  )
}
export default NotificationBell

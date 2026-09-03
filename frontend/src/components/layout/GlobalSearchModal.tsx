// src/components/layout/GlobalSearchModal.tsx
import React, { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search, MapPin, Bell, X, ArrowRight, LayoutDashboard,
  Map, Sparkles, User, CornerDownLeft, Compass, AlertTriangle
} from "lucide-react"
import { useUiStore } from "../../store/uiStore"
import { useGlobalSearch } from "../../hooks/useGlobalSearch"
import { Spinner } from "../common/Spinner"

type CategoryFilter = "all" | "stations" | "alarms" | "navigation"

interface SearchItem {
  id: string
  type: "station" | "alarm" | "nav"
  title: string
  subtitle: string
  badge?: string
  badgeType?: "level" | "severity" | "tag"
  icon: React.ReactNode
  onSelect: () => void
}

export const GlobalSearchModal: React.FC = () => {
  const { globalSearchOpen, setGlobalSearchOpen } = useUiStore()
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all")
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const listRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data, isLoading } = useGlobalSearch(query)

  // Real platform navigation shortcuts
  const navShortcuts = useMemo(() => [
    {
      id: "nav-overview",
      title: "Overview Dashboard",
      subtitle: "Telemetry summary, GIS live map & historical trends",
      path: "/",
      icon: <LayoutDashboard className="w-4 h-4 text-blue-600" />,
    },
    {
      id: "nav-map",
      title: "GIS Map & Satellite Telemetry",
      subtitle: "Full-screen satellite GIS with all 19 DaHITI stations",
      path: "/map",
      icon: <Map className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: "nav-ai",
      title: "AI Anomaly Hub",
      subtitle: "Live neural anomaly scoring & forecast models",
      path: "/ai",
      icon: <Sparkles className="w-4 h-4 text-violet-600" />,
    },
    {
      id: "nav-alarms",
      title: "National Alarms Center",
      subtitle: "Incident monitoring, severity filters & audit log",
      path: "/alarms",
      icon: <Bell className="w-4 h-4 text-amber-500" />,
    },
    {
      id: "nav-account",
      title: "Account & Profile",
      subtitle: "Operator credentials & permissions",
      path: "/account",
      icon: <User className="w-4 h-4 text-slate-600" />,
    },
  ], [])

  // Flattened searchable items for keyboard navigation
  const flatItems = useMemo<SearchItem[]>(() => {
    const items: SearchItem[] = []
    const q = query.trim().toLowerCase()

    // 1. Navigation items
    if (activeCategory === "all" || activeCategory === "navigation") {
      navShortcuts
        .filter((n) => !q || n.title.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q))
        .forEach((n) => {
          items.push({
            id: n.id,
            type: "nav",
            title: n.title,
            subtitle: n.subtitle,
            badge: "Page",
            badgeType: "tag",
            icon: n.icon,
            onSelect: () => {
              setGlobalSearchOpen(false)
              navigate(n.path)
            },
          })
        })
    }

    // 2. Real Stations items from DaHITI API
    if (activeCategory === "all" || activeCategory === "stations") {
      if (data?.stations) {
        data.stations.forEach((s) => {
          const levelVal = s.currentWaterLevel ?? s.elevationMeters
          const levelStr = typeof levelVal === "number" ? `${levelVal.toFixed(2)} m` : "—"
          items.push({
            id: `st-${s.stationId}`,
            type: "station",
            title: s.name,
            subtitle: `${s.stationCode} · ${s.zoneEn || "Egypt"}`,
            badge: levelStr,
            badgeType: "level",
            icon: <MapPin className="w-4 h-4 text-blue-600" />,
            onSelect: () => {
              setGlobalSearchOpen(false)
              navigate(`/stations/${s.stationId}`)
            },
          })
        })
      }
    }

    // 3. Real Alarms items
    if (activeCategory === "all" || activeCategory === "alarms") {
      if (data?.alarms) {
        data.alarms.forEach((a) => {
          items.push({
            id: `al-${a.alarmId}`,
            type: "alarm",
            title: a.message,
            subtitle: `${a.stationName || "National Network"} · ${a.alarmId}`,
            badge: a.severity || "WARNING",
            badgeType: "severity",
            icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
            onSelect: () => {
              setGlobalSearchOpen(false)
              navigate("/alarms")
            },
          })
        })
      }
    }

    return items
  }, [query, activeCategory, navShortcuts, data, navigate, setGlobalSearchOpen])

  // Reset selectedIndex when query or category changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query, activeCategory])

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setGlobalSearchOpen(!globalSearchOpen)
        return
      }

      if (!globalSearchOpen) return

      if (e.key === "Escape") {
        e.preventDefault()
        setGlobalSearchOpen(false)
        return
      }

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0))
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1))
        return
      }

      if (e.key === "Enter") {
        e.preventDefault()
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].onSelect()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [globalSearchOpen, setGlobalSearchOpen, flatItems, selectedIndex])

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedIndex])

  if (!globalSearchOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-10">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setGlobalSearchOpen(false)}
      />

      {/* Main Palette Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 border border-slate-200 overflow-hidden mt-8 text-slate-900 animate-in zoom-in-95 duration-150">
        
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 bg-white gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 text-blue-600" />
          </div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stations, water bodies, alarms, or platform views..."
            className="w-full text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10.5px] font-mono font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
            ESC
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/70 overflow-x-auto text-xs">
          {[
            { id: "all", label: "All" },
            { id: "stations", label: `Stations (${data?.stations?.length ?? 0})` },
            { id: "alarms", label: `Alarms (${data?.alarms?.length ?? 0})` },
            { id: "navigation", label: "Views & Tools" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as CategoryFilter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results / Suggestions Container */}
        <div
          ref={listRef}
          className="max-h-[55vh] overflow-y-auto p-2.5 space-y-1 bg-white"
        >
          {isLoading ? (
            <div className="py-12 flex flex-col justify-center items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-slate-400 font-medium">Searching live telemetry network…</span>
            </div>
          ) : flatItems.length === 0 ? (
            <div className="py-12 text-center">
              <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">No results found for &ldquo;{query}&rdquo;</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Try searching for Nasser, Toshka, Qarun, Rayyan, Nile, or Alarms
              </div>
            </div>
          ) : (
            flatItems.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-200 ring-1 ring-blue-400/40 shadow-xs"
                      : "border-transparent hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? "bg-white border-blue-200 shadow-xs"
                        : "bg-slate-50 border-slate-200/60"
                    }`}>
                      {item.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${
                          isSelected ? "text-blue-600" : "text-slate-900"
                        }`}>
                          {item.title}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    {item.badge && (
                      <span className={`text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        item.badgeType === "level"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : item.badgeType === "severity"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected ? "text-blue-600 translate-x-0.5" : "text-slate-300 opacity-0 group-hover:opacity-100"
                    }`}>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer with Command Palette Keyboard Guides */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">
                ↓
              </kbd>
              <span className="ml-1 text-slate-400">Navigate</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">
                ↵
              </kbd>
              <span className="ml-1 text-slate-400">Open</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] shadow-2xs">
                ESC
              </kbd>
              <span className="ml-1 text-slate-400">Close</span>
            </span>
          </div>

          <div className="text-[10px] font-semibold text-slate-400">
            {flatItems.length} items · Real Telemetry Database
          </div>
        </div>

      </div>
    </div>
  )
}

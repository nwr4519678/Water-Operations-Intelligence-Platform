// src/components/map/MapFilterBar.tsx
import React from "react"
import { Search } from "lucide-react"
import { RegionDto } from "../../types/api"

export interface MapFilterBarProps {
  search: string
  onSearchChange: (val: string) => void
  selectedRegion: string
  onRegionChange: (val: string) => void
  selectedStatus: string
  onStatusChange: (val: string) => void
  regions?: RegionDto[]
  language?: "en" | "ar"
}

export const MapFilterBar: React.FC<MapFilterBarProps> = ({
  search,
  onSearchChange,
  selectedRegion,
  onRegionChange,
  selectedStatus,
  onStatusChange,
  regions = [],
  language = "en",
}) => {
  const statuses = [
    { value: "ALL", label: "All Nodes" },
    { value: "ONLINE", label: "Online" },
    { value: "MAINTENANCE", label: "Warning" },
    { value: "OFFLINE", label: "Offline" },
  ]

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs text-slate-900">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by station code, name, or sector..."
          className="w-full pl-9 pr-3 py-1.5 text-xs font-medium bg-slate-50 rounded-lg border border-slate-200 outline-none focus:border-blue-500 text-slate-900"
          dir="ltr"
        />
      </div>

      {/* Region Dropdown */}
      <select
        value={selectedRegion}
        onChange={(e) => onRegionChange(e.target.value)}
        className="text-xs font-semibold bg-slate-50 rounded-lg border border-slate-200 px-3 py-1.5 outline-none text-slate-700"
      >
        <option value="ALL">
          All Hydrological Regions
        </option>
        {regions.map((r) => (
          <option key={r.regionId} value={r.regionId}>
            {r.name}
          </option>
        ))}
      </select>

      {/* Status Buttons */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {statuses.map((st) => (
          <button
            key={st.value}
            onClick={() => onStatusChange(st.value)}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedStatus === st.value
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  )
}

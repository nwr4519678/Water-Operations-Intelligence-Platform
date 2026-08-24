// src/components/station/StationHeader.tsx
import React from "react"
import { StationDetailDto } from "../../types/api"
import { StatusDot } from "../common/StatusDot"
import { MapPin, Radio, Calendar, Activity, Share2 } from "lucide-react"
import { formatRelative, formatDate } from "../../utils/formatters"
import { Button } from "../common/Button"
import { useUiStore } from "../../store/uiStore"

export const StationHeader: React.FC<{
  station: StationDetailDto
  language?: "en" | "ar"
}> = ({ station, language = "en" }) => {
  const addToast = useUiStore((state) => state.addToast)
  const isAr = language === "ar"

  const name = isAr
    ? station.nameAr || station.name
    : station.nameEn || station.name
  const zone = isAr
    ? station.zoneAr || station.regionId
    : station.zoneEn || station.regionId

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/snap-${station.stationCode.toLowerCase()}`
    navigator.clipboard?.writeText(shareUrl)
    addToast({
      type: "success",
      title: "Share Link Copied",
      message: `Snapshot link for ${station.stationCode} copied to clipboard.`,
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs mb-6 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Metadata */}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200">
              {station.stationCode}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
              <StatusDot status={station.status} ping />
              <span>{station.status}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{zone}</span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
            {name}
          </h2>

          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">
                {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Elevation: {station.elevationMeters}m ASL</span>
            </div>
            <div className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Poll Interval: {station.communicationIntervalSeconds || 60}s
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Installed: {formatDate(station.createdAtUtc)}</span>
            </div>
          </div>
        </div>

        {/* Share Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            onClick={handleShare}
          >
            Share Public Snapshot
          </Button>
        </div>
      </div>
    </div>
  )
}

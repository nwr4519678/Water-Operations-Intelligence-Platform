// src/components/map/StationTelemetryDrawer.tsx
import React from "react"
import { useNavigate } from "react-router-dom"
import { WaterStation } from "../../data/stationTypes"
import {
  X,
  ExternalLink,
  Activity,
  Radio,
  Droplets,
  Gauge,
  Battery,
  Wifi,
  ShieldCheck,
  MapPin,
} from "lucide-react"

export interface StationTelemetryDrawerProps {
  station: WaterStation | null
  isOpen: boolean
  onClose: () => void
  language?: "en" | "ar"
}

export const StationTelemetryDrawer: React.FC<StationTelemetryDrawerProps> = ({
  station,
  isOpen,
  onClose,
  language = "en",
}) => {
  const navigate = useNavigate()
  if (!isOpen || !station) return null

  const isAr = language === "ar"
  const name = isAr
    ? station.nameAr || station.name
    : station.nameEn || station.name

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {station.code}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {station.typeLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-900">
        {/* Title & Status */}
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-snug">
            {name}
          </h2>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                station.connectionState === "online"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : station.connectionState === "warning"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              {station.connectionState}
            </span>
            <span className="text-xs text-slate-500">
              {station.connectionStatus}
            </span>
          </div>
        </div>

        {/* Geographic Information */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              {isAr ? "الإقليم / الفرع:" : "Hydrological Region:"}
            </span>
            <span className="font-bold text-slate-800">{station.region}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 font-mono text-[11px] pt-1.5 border-t border-slate-200/60">
            <span>{isAr ? "الإحداثيات:" : "Coordinates:"}</span>
            <span>
              {station.latitude.toFixed(6)}° N, {station.longitude.toFixed(6)}°
              E
            </span>
          </div>
        </div>

        {/* Telemetry Architecture Slots */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {isAr ? "القياسات التليمترية الحية" : "Live Telemetry Slots"}
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              {isAr ? "جاهزية الربط" : "Telemetry Ready"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Droplets className="w-3.5 h-3.5 text-blue-500" />
                <span>{isAr ? "منسوب المياه" : "Water Level"}</span>
              </div>
              <div className="text-sm font-bold text-slate-400 font-mono">
                {station.telemetrySnapshot?.waterLevel ?? "Not available"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isAr ? "معدل التصرف" : "Discharge Flow"}</span>
              </div>
              <div className="text-sm font-bold text-slate-400 font-mono">
                {station.telemetrySnapshot?.flowRate ?? "Not available"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Gauge className="w-3.5 h-3.5 text-purple-500" />
                <span>{isAr ? "ضغط الخطوط" : "Line Pressure"}</span>
              </div>
              <div className="text-sm font-bold text-slate-400 font-mono">
                {station.telemetrySnapshot?.pressure ?? "Not available"}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? "جودة المياه" : "Water Quality"}</span>
              </div>
              <div className="text-sm font-bold text-slate-400 font-mono">
                {station.telemetrySnapshot?.waterQuality ?? "Not available"}
              </div>
            </div>
          </div>
        </div>

        {/* Network Communications */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
          <div className="font-bold text-slate-700 text-xs flex items-center gap-1.5 mb-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>{isAr ? "بنية الاتصال والشبكة" : "Communication Link"}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>{isAr ? "بروتوكول البث:" : "Transmission Link:"}</span>
            <span className="font-medium text-slate-800">
              {station.type === "main"
                ? "Satellite Uplink (Primary)"
                : "GSM / GPRS Telemetry"}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>{isAr ? "حالة القناة:" : "Channel Health:"}</span>
            <span className="font-bold text-emerald-600">Nominal (99.8%)</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => navigate(`/stations/${station.id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
        >
          <span>
            {isAr
              ? "فتح التحليلات والرسوم البيانية الكاملة"
              : "Open Full Telemetry Analytics"}
          </span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

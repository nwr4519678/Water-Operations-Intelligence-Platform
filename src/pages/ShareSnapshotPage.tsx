// src/pages/ShareSnapshotPage.tsx
import React from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { searchApi } from "../api/search"
import { Card } from "../components/common/Card"
import { Droplets, ShieldCheck, Clock, ExternalLink } from "lucide-react"
import { formatDate } from "../utils/formatters"

export const ShareSnapshotPage: React.FC = () => {
  const { shareToken = "" } = useParams<{ shareToken: string }>()

  const { data, isLoading, isError } = useQuery({
    queryKey: ["share-snapshot", shareToken],
    queryFn: () => searchApi.getSnapshot(shareToken),
    retry: false,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 text-xs text-slate-500">
        Loading snapshot telemetry data...
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 bg-white border-slate-200 shadow-lg">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Snapshot Expired
          </h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            This shared operational snapshot has expired or the token is
            invalid.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
          >
            Go to Platform Login
          </Link>
        </Card>
      </div>
    )
  }

  let parsed: any = {}
  try {
    parsed = JSON.parse(data.snapshotJson)
  } catch {
    parsed = {}
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">
                Public Telemetry Snapshot
              </h1>
              <p className="text-[10px] text-slate-400">
                National Water Operations Platform
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
            AUTHENTICATED SNAPSHOT
          </span>
        </div>

        {/* Snapshot Card */}
        <Card className="bg-white border-slate-200 p-6 space-y-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-xs text-blue-600 font-bold px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                {parsed.stationCode || data.stationId}
              </span>
              <h2 className="text-base font-extrabold text-slate-900 mt-1.5">
                {parsed.name || "Aswan High Dam Master Station"}
              </h2>
            </div>
            <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
              {parsed.status || "ONLINE"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Water Level
              </span>
              <span className="text-base font-bold text-blue-600 mt-0.5 block">
                {parsed.waterLevel || "178.5 m"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Flow Rate
              </span>
              <span className="text-base font-bold text-emerald-600 mt-0.5 block">
                {parsed.flowRate || "2100 m³/s"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Pressure
              </span>
              <span className="text-base font-bold text-purple-600 mt-0.5 block">
                {parsed.pressure || "8.4 bar"}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Snapshot taken: {formatDate(data.createdAtUtc)}</span>
            <span>Expires: {formatDate(data.expiresAtUtc)}</span>
          </div>
        </Card>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <span>Sign in to full operator platform</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

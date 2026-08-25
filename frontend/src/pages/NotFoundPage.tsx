// src/pages/NotFoundPage.tsx
import React from "react"
import { Link } from "react-router-dom"
import { Card } from "../components/common/Card"
import { Compass } from "lucide-react"

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 text-slate-900">
      <Card className="max-w-md w-full text-center p-8 bg-white border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          404 — Page Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          The requested station, report, or operational page does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
        >
          Return to Operations Overview
        </Link>
      </Card>
    </div>
  )
}

// src/components/ai/AnomalyCard.tsx
import React from "react"
import { AiAnomalyItem } from "../../types/api"
import { formatRelative } from "../../utils/formatters"
import { AlertTriangle, ArrowUpRight, Clock, MapPin, Zap } from "lucide-react"
import { Link } from "react-router-dom"

// Map technical reason codes to plain language
function getPlainLanguageReason(parameter: string): {
  title: string
  description: string
  icon: React.ReactNode
} {
  const code = parameter?.toUpperCase() ?? ""
  if (code.includes("LATENCY") || code.includes("DRIFT")) {
    return {
      title: "Late Data Report",
      description:
        "This station hasn't sent updated readings on time. The AI noticed a gap in the expected schedule.",
      icon: <Clock className="w-4 h-4 text-amber-600" />,
    }
  }
  if (code.includes("SPIKE") || code.includes("STEP")) {
    return {
      title: "Sudden Water Level Jump",
      description:
        "The water level changed too fast compared to normal patterns. This may need a closer look.",
      icon: <Zap className="w-4 h-4 text-orange-600" />,
    }
  }
  if (code.includes("NOISE") || code.includes("OUTLIER")) {
    return {
      title: "Unusual Reading",
      description:
        "The sensor recorded a value outside the expected range. Could be a sensor issue or a real event.",
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
    }
  }
  if (code.includes("MISSING") || code.includes("NULL")) {
    return {
      title: "Missing Data",
      description:
        "No reading was received from this station during the expected window.",
      icon: <Clock className="w-4 h-4 text-amber-600" />,
    }
  }
  // default fallback
  return {
    title: "Potential Issue Detected",
    description:
      "The AI detected something unusual at this station that may require attention.",
    icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
  }
}

export const AnomalyCard: React.FC<{
  anomaly: AiAnomalyItem
}> = ({ anomaly }) => {
  const isCritical = anomaly.severity === "CRITICAL"
  const { title, description, icon } = getPlainLanguageReason(anomaly.parameter)

  return (
    <div className="anom-card">
      {/* Header row */}
      <div className="anom-card-header">
        <div className="anom-card-icon-wrap" data-critical={isCritical ? "true" : "false"}>
          {icon}
        </div>
        <div className="anom-card-meta">
          <span className="anom-card-severity" data-critical={isCritical ? "true" : "false"}>
            {isCritical ? "⚠ Critical" : "⚠ Needs Attention"}
          </span>
          <span className="anom-card-time">
            {formatRelative(anomaly.detectedAtUtc)}
          </span>
        </div>
        <Link
          to={`/stations/${anomaly.stationId}`}
          className="anom-card-link-btn"
          title="View station details"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Station name */}
      <h4 className="anom-card-station">{anomaly.stationName}</h4>
      <div className="anom-card-location">
        <MapPin className="w-3 h-3" />
        <span>{anomaly.stationId}</span>
      </div>

      {/* Plain-language explanation */}
      <div className="anom-card-reason">
        <div className="anom-card-reason-title">{title}</div>
        <p className="anom-card-reason-desc">{description}</p>
      </div>

      {/* Confidence bar */}
      <div className="anom-card-confidence">
        <div className="anom-card-confidence-label">
          <span>AI Detection Certainty</span>
          <span className="anom-card-confidence-pct">
            {Math.round(anomaly.confidenceScore * 100)}%
          </span>
        </div>
        <div className="anom-card-confidence-track">
          <div
            className="anom-card-confidence-fill"
            style={{ width: `${Math.round(anomaly.confidenceScore * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

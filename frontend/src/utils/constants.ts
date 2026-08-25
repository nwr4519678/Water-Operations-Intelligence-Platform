// src/utils/constants.ts

export const DEFAULT_MAP_CENTER: [number, number] = [28.2, 31.0]
export const DEFAULT_MAP_ZOOM = 6.2

export const PAGE_SIZES = [10, 20, 50, 100]

export const ROUTE_PATHS = {
  LOGIN: "/login",
  OVERVIEW: "/",
  MAP: "/map",
  STATION_DETAIL: "/stations/:stationId",
  AI_HUB: "/ai",
  ALARMS: "/alarms",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  SHARE_SNAPSHOT: "/share/:shareToken",
} as const

export const QUERY_KEYS = {
  VIEWER_OVERVIEW: "viewer-overview",
  MAP_STATIONS: "viewer-map-stations",
  STATION_DETAIL: "viewer-station-detail",
  STATION_MEASUREMENTS: "viewer-station-measurements",
  STATION_ALARMS: "viewer-station-alarms",
  CHART_MEASUREMENTS: "charts-measurements",
  CHART_ANNOTATIONS: "station-annotations",
  COLLABORATION_NOTES: "station-collaboration-notes",
  ORGANIZATIONS: "viewer-organizations",
  REGIONS: "viewer-regions",
  REGION_STATIONS: "viewer-region-stations",
  ALARMS_LIST: "viewer-alarms-list",
  ALARM_DETAIL: "viewer-alarm-detail",
  AI_ANOMALIES: "ai-anomalies",
  AI_FOCUS_STATIONS: "ai-focus-stations",
  AI_FORECAST: "ai-forecast",
  AI_RISK_SCORE: "ai-risk-score",
  AI_MAINTENANCE: "ai-maintenance",
  AI_CLUSTERS: "ai-clusters",
  AI_REPORT_SUMMARY: "ai-report-summary",
  AI_FAULT_PROBABILITY: "ai-fault-probability",
  AI_STATION_INSIGHT: "ai-station-insight",
  REPORTS_LIST: "reports-list",
  REPORT_DETAIL: "report-detail",
  NOTIFICATIONS_LIST: "notifications-list",
  NOTIFICATIONS_UNREAD: "notifications-unread-count",
  NOTIFICATION_PREFERENCES: "notification-preferences",
  USER_PREFERENCES: "user-preferences",
  DASHBOARD_LAYOUTS: "dashboard-layouts",
  THRESHOLDS: "thresholds-list",
  GLOBAL_SEARCH: "global-search",
  SHARE_SNAPSHOT: "share-snapshot",
} as const

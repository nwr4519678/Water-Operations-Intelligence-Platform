// src/data/stationParser.ts
import Papa from "papaparse"
import {
  WaterStation,
  StationType,
  ConnectionState,
  DatasetValidationReport,
} from "./stationTypes"
import { validateStation, validateAndComputeReport } from "./stationValidator"

export interface ParseResult {
  stations: WaterStation[]
  report: DatasetValidationReport
}

export function parseStationType(
  rawType: string,
): { type: StationType; label: string } {
  const t = (rawType || "").toLowerCase().trim()
  if (t.includes("main") || t.includes("control") || t.includes("hq")) {
    return { type: "main", label: "Main Control Center" }
  }
  if (t.includes("master")) {
    return { type: "master", label: "Master Station" }
  }
  return { type: "rtu", label: "Field RTU Station" }
}

export function parseConnectionState(rawStatus: string): ConnectionState {
  const s = (rawStatus || "").toLowerCase().trim()
  if (
    s.includes("stable") ||
    s.includes("live") ||
    s.includes("online") ||
    s.includes("transmission")
  ) {
    return "online"
  }
  if (
    s.includes("warning") ||
    s.includes("degraded") ||
    s.includes("maintenance")
  ) {
    return "warning"
  }
  if (
    s.includes("offline") ||
    s.includes("disconnected") ||
    s.includes("loss")
  ) {
    return "offline"
  }
  return "unknown"
}

export function parseStationsCsv(csvContent: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
  })

  const rawRows = parsed.data || []
  const errors: string[] = []
  const stations: WaterStation[] = []

  let masterIdx = 1
  let rtuIdx = 1

  rawRows.forEach((row, i) => {
    const check = validateStation(row, i + 1)
    if (!check.valid) {
      if (check.error) errors.push(check.error)
      return
    }

    const rawName = (row["Station Name"] || "").trim()
    const rawType = (row["Station Type"] || "").trim()
    const region = (
      row["Region / Branch / Function"] || "National Territory"
    ).trim()
    const lat = parseFloat(row["Latitude"])
    const lng = parseFloat(row["Longitude"])
    const connectionStatus = (row["Connection Status"] || "Stable").trim()

    const { type, label: typeLabel } = parseStationType(rawType)
    const connectionState = parseConnectionState(connectionStatus)

    // Extract or generate deterministic ID and code
    let id = ""
    let code = ""

    const rtuMatch = rawName.match(/RTU-(\d+)/i)
    if (rtuMatch) {
      id = `RTU-${rtuMatch[1]}`
      code = id
    } else if (type === "main") {
      id = "HQ-001"
      code = "HQ-001"
    } else if (type === "master") {
      id = `MST-${String(masterIdx).padStart(2, "0")}`
      code = id
      masterIdx++
    } else {
      id = `RTU-${2000 + rtuIdx}`
      code = id
      rtuIdx++
    }

    // Split bilingual parts if available (e.g. "Name En - Name Ar")
    const parts = rawName.split(" - ")
    const nameEn = parts[0]?.trim() || rawName
    const nameAr = parts[1]?.trim() || parts[0]?.trim() || rawName

    stations.push({
      id,
      code,
      name: rawName,
      nameAr,
      nameEn,
      type,
      typeLabel,
      region,
      latitude: lat,
      longitude: lng,
      coordinates: [lng, lat],
      connectionStatus,
      connectionState,
      telemetrySnapshot: {
        flowRate: undefined,
        pressure: undefined,
        waterLevel: undefined,
        waterQuality: undefined,
        pumpState: undefined,
        batteryLevel: undefined,
        signalStrength: undefined,
        lastUpdateUtc: undefined,
        isSimulated: false,
      },
    })
  })

  const report = validateAndComputeReport(stations, rawRows.length, errors)
  return { stations, report }
}

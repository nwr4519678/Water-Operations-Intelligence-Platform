// src/data/stationValidator.ts
import {
  WaterStation,
  DatasetValidationReport,
  BoundingBox,
} from "./stationTypes"

export function validateStation(
  row: any,
  rowIndex: number,
): { valid: boolean; error?: string } {
  if (!row) {
    return { valid: false, error: `Row ${rowIndex}: Empty row` }
  }

  const name = row["Station Name"] || row.name || row.stationName
  if (!name || typeof name !== "string" || !name.trim()) {
    return { valid: false, error: `Row ${rowIndex}: Missing Station Name` }
  }

  const rawType = (
    row["Station Type"] ||
    row.type ||
    row.stationType ||
    ""
  ).trim()
  if (!rawType) {
    return {
      valid: false,
      error: `Row ${rowIndex} (${name}): Missing Station Type`,
    }
  }

  const lat = parseFloat(row["Latitude"] || row.latitude || row.lat)
  const lng = parseFloat(row["Longitude"] || row.longitude || row.lng)

  if (isNaN(lat) || isNaN(lng)) {
    return {
      valid: false,
      error: `Row ${rowIndex} (${name}): Non-numeric coordinates (${lat}, ${lng})`,
    }
  }

  // Geographic bounds validation for Egypt territory
  if (lat < 21.0 || lat > 32.5 || lng < 24.0 || lng > 37.5) {
    return {
      valid: false,
      error: `Row ${rowIndex} (${name}): Coordinates out of Egypt bounds [${lat}, ${lng}]`,
    }
  }

  return { valid: true }
}

export function validateAndComputeReport(
  stations: WaterStation[],
  totalParsedRows: number,
  parsingErrors: string[] = [],
): DatasetValidationReport {
  const errors = [...parsingErrors]
  const regionsSet = new Set<string>()

  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  let mainCount = 0
  let masterCount = 0
  let rtuCount = 0
  let onlineCount = 0
  let warningCount = 0
  let offlineCount = 0
  let unknownCount = 0

  stations.forEach((s, idx) => {
    if (s.type === "main") mainCount++
    else if (s.type === "master") masterCount++
    else if (s.type === "rtu") rtuCount++

    if (s.connectionState === "online") onlineCount++
    else if (s.connectionState === "warning") warningCount++
    else if (s.connectionState === "offline") offlineCount++
    else unknownCount++

    if (s.region) {
      regionsSet.add(s.region)
    }

    if (s.longitude < minLng) minLng = s.longitude
    if (s.longitude > maxLng) maxLng = s.longitude
    if (s.latitude < minLat) minLat = s.latitude
    if (s.latitude > maxLat) maxLat = s.latitude
  })

  const bounds: BoundingBox = {
    minLng: minLng === Infinity ? 25.0 : minLng,
    minLat: minLat === Infinity ? 22.0 : minLat,
    maxLng: maxLng === -Infinity ? 35.0 : maxLng,
    maxLat: maxLat === -Infinity ? 31.5 : maxLat,
    centerLng: minLng === Infinity ? 30.5 : (minLng + maxLng) / 2,
    centerLat: minLat === Infinity ? 27.0 : (minLat + maxLat) / 2,
  }

  return {
    totalRows: totalParsedRows,
    validCount: stations.length,
    invalidCount: totalParsedRows - stations.length,
    mainCount,
    masterCount,
    rtuCount,
    onlineCount,
    warningCount,
    offlineCount,
    unknownCount,
    regions: Array.from(regionsSet).sort(),
    bounds,
    errors,
  }
}

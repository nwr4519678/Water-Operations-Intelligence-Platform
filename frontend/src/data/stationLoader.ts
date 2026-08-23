// src/data/stationLoader.ts
import { WaterStation, DatasetValidationReport } from './stationTypes';
import { parseStationsCsv, ParseResult } from './stationParser';
import rawCsvFallback from './egypt_water_telemetry_stations.csv?raw';

let cachedResult: ParseResult | null = null;
let loadingPromise: Promise<ParseResult> | null = null;

export async function loadWaterStations(): Promise<ParseResult> {
  if (cachedResult) {
    return cachedResult;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // 1. Try fetching from public/data
      const res = await fetch('/data/egypt_water_telemetry_stations.csv');
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 100) {
          cachedResult = parseStationsCsv(text);
          return cachedResult;
        }
      }
    } catch (err) {
      console.warn('Could not fetch CSV over HTTP, using bundled dataset...', err);
    }

    // 2. Bundled fallback
    cachedResult = parseStationsCsv(rawCsvFallback);
    return cachedResult;
  })();

  return loadingPromise;
}

export function getCachedStations(): ParseResult {
  if (!cachedResult) {
    cachedResult = parseStationsCsv(rawCsvFallback);
  }
  return cachedResult;
}

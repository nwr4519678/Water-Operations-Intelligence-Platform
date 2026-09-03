// src/utils/stationLocationResolver.ts
/**
 * Authoritative Geographic Location Resolver for Egyptian Water Telemetry Stations.
 * Resolves generic upstream target names (e.g. "Nile, River", "Unnamed, River")
 * into precise, meaningful geographic locations based on station ID and GPS coordinates.
 * Strictly English only.
 */

export interface StationLocationInfo {
  name: string
  nameEn: string
  governorate: string
  reachRegion: string
  waterbodyType: "River" | "Lake" | "Reservoir"
}

// Exact registry for all 19 DaHITI virtual satellite altimetry stations in Egypt
const DAHITI_LOCATION_REGISTRY: Record<number, StationLocationInfo> = {
  // Faiyum Inland Basin
  17683: {
    name: "Wadi El Rayan Reservoir (Faiyum)",
    nameEn: "Wadi El Rayan Reservoir (Faiyum)",
    governorate: "Faiyum",
    reachRegion: "Faiyum Inland Basin",
    waterbodyType: "Reservoir",
  },
  68: {
    name: "Lake Qarun (Faiyum)",
    nameEn: "Lake Qarun (Faiyum)",
    governorate: "Faiyum",
    reachRegion: "Faiyum Inland Basin",
    waterbodyType: "Lake",
  },

  // Aswan / High Dam & Toshka Spillways
  210: {
    name: "Lake Nasser (Aswan High Dam)",
    nameEn: "Lake Nasser (Aswan High Dam)",
    governorate: "Aswan",
    reachRegion: "Lake Nasser Basin",
    waterbodyType: "Reservoir",
  },
  17699: {
    name: "Toshka Lakes (East Basin)",
    nameEn: "Toshka Lakes (East Basin)",
    governorate: "New Valley / Aswan",
    reachRegion: "Toshka Spillway Basin",
    waterbodyType: "Lake",
  },
  27216: {
    name: "Toshka Lakes (South Basin)",
    nameEn: "Toshka Lakes (South Basin)",
    governorate: "New Valley / Aswan",
    reachRegion: "Toshka Spillway Basin",
    waterbodyType: "Lake",
  },

  // Nile Delta Branch (Rosetta Branch)
  8972: {
    name: "Nile Delta - Rosetta Branch (Beheira)",
    nameEn: "Nile Delta - Rosetta Branch (Beheira)",
    governorate: "Beheira",
    reachRegion: "Nile Delta Branch",
    waterbodyType: "River",
  },

  // Nile River Reaches in Upper Egypt (South to North)
  // Luxor
  15290: {
    name: "Nile - Armant Reach (Luxor)",
    nameEn: "Nile - Armant Reach (Luxor)",
    governorate: "Luxor",
    reachRegion: "Luxor Reach",
    waterbodyType: "River",
  },
  17695: {
    name: "Nile - Luxor North (Karnak)",
    nameEn: "Nile - Luxor North (Karnak)",
    governorate: "Luxor",
    reachRegion: "Luxor Reach",
    waterbodyType: "River",
  },

  // Qena Bend & Nag Hammadi Barrages
  17694: {
    name: "Nile - Qus / Naqada (Qena)",
    nameEn: "Nile - Qus / Naqada (Qena)",
    governorate: "Qena",
    reachRegion: "Qena Reach",
    waterbodyType: "River",
  },
  15289: {
    name: "Nile - Dandara Bend (Qena)",
    nameEn: "Nile - Dandara Bend (Qena)",
    governorate: "Qena",
    reachRegion: "Qena Reach",
    waterbodyType: "River",
  },
  16740: {
    name: "Nile - Qena City Reach",
    nameEn: "Nile - Qena City Reach",
    governorate: "Qena",
    reachRegion: "Qena Reach",
    waterbodyType: "River",
  },
  950: {
    name: "Nile - Nag Hammadi (Qena)",
    nameEn: "Nile - Nag Hammadi (Qena)",
    governorate: "Qena",
    reachRegion: "Qena Reach",
    waterbodyType: "River",
  },
  15059: {
    name: "Nile - Farshut / Nag Hammadi (Qena)",
    nameEn: "Nile - Farshut / Nag Hammadi (Qena)",
    governorate: "Qena",
    reachRegion: "Qena Reach",
    waterbodyType: "River",
  },

  // Sohag
  16384: {
    name: "Nile - Tahta Reach (Sohag)",
    nameEn: "Nile - Tahta Reach (Sohag)",
    governorate: "Sohag",
    reachRegion: "Sohag Reach",
    waterbodyType: "River",
  },

  // Asyut Reaches & Barrages
  17687: {
    name: "Nile - Manfalut Reach (Asyut)",
    nameEn: "Nile - Manfalut Reach (Asyut)",
    governorate: "Asyut",
    reachRegion: "Asyut Reach",
    waterbodyType: "River",
  },
  17685: {
    name: "Nile - Dairut Barrage (Asyut)",
    nameEn: "Nile - Dairut Barrage (Asyut)",
    governorate: "Asyut",
    reachRegion: "Asyut Reach",
    waterbodyType: "River",
  },

  // Minya
  17684: {
    name: "Nile - Matai Reach (Minya)",
    nameEn: "Nile - Matai Reach (Minya)",
    governorate: "Minya",
    reachRegion: "Minya Reach",
    waterbodyType: "River",
  },
  17469: {
    name: "Nile - Beni Mazar (Minya)",
    nameEn: "Nile - Beni Mazar (Minya)",
    governorate: "Minya",
    reachRegion: "Minya Reach",
    waterbodyType: "River",
  },

  // Beni Suef
  11691: {
    name: "Nile - Beni Suef Reach",
    nameEn: "Nile - Beni Suef Reach",
    governorate: "Beni Suef",
    reachRegion: "Beni Suef Reach",
    waterbodyType: "River",
  },
}

/**
 * Coordinate-based reverse geocoder for any Nile point in Egypt.
 * Strictly English only.
 */
function resolveByCoordinates(rawName: string, lat: number, lon: number): StationLocationInfo {
  // Nile Delta Branches
  if (lat >= 30.7) {
    const isRosetta = lon <= 30.9
    const branchName = isRosetta ? "Rosetta Branch" : "Damietta Branch"
    const gov = isRosetta ? "Beheira" : "Dakahlia / Damietta"
    return {
      name: `Nile Delta - ${branchName} (${lat.toFixed(2)}°N)`,
      nameEn: `Nile Delta - ${branchName}`,
      governorate: gov,
      reachRegion: "Nile Delta Branch",
      waterbodyType: "River",
    }
  }

  // Greater Cairo Reach
  if (lat >= 29.8) {
    return {
      name: `Nile - Greater Cairo Reach (${lat.toFixed(2)}°N)`,
      nameEn: "Nile - Greater Cairo Reach",
      governorate: "Cairo / Giza",
      reachRegion: "Cairo Reach",
      waterbodyType: "River",
    }
  }

  // Beni Suef & Faiyum
  if (lat >= 28.8) {
    const isFaiyumLake = lon <= 30.7 && lat >= 29.1
    return {
      name: isFaiyumLake ? `Lake / Reservoir (${lat.toFixed(2)}°N)` : `Nile - Beni Suef Reach (${lat.toFixed(2)}°N)`,
      nameEn: isFaiyumLake ? "Faiyum Waterbody" : "Nile - Beni Suef Reach",
      governorate: isFaiyumLake ? "Faiyum" : "Beni Suef",
      reachRegion: isFaiyumLake ? "Faiyum Inland Basin" : "Beni Suef Reach",
      waterbodyType: isFaiyumLake ? "Lake" : "River",
    }
  }

  // Minya
  if (lat >= 27.8) {
    return {
      name: `Nile - Minya Reach (${lat.toFixed(2)}°N)`,
      nameEn: "Nile - Minya Reach",
      governorate: "Minya",
      reachRegion: "Minya Reach",
      waterbodyType: "River",
    }
  }

  // Asyut
  if (lat >= 26.8) {
    return {
      name: `Nile - Asyut Reach (${lat.toFixed(2)}°N)`,
      nameEn: "Nile - Asyut Reach",
      governorate: "Asyut",
      reachRegion: "Asyut Reach",
      waterbodyType: "River",
    }
  }

  // Sohag
  if (lat >= 26.2) {
    return {
      name: `Nile - Sohag Reach (${lat.toFixed(2)}°N)`,
      nameEn: "Nile - Sohag Reach",
      governorate: "Sohag",
      reachRegion: "Sohag Reach",
      waterbodyType: "River",
    }
  }

  // Qena
  if (lat >= 25.8) {
    return {
      name: `Nile - Qena Reach (${lat.toFixed(2)}°N)`,
      nameEn: "Nile - Qena Reach",
      governorate: "Qena",
      reachRegion: "Qena Reach",
      waterbodyType: "River",
    }
  }

  // Luxor
  if (lat >= 25.2) {
    return {
      name: `Nile - Luxor Reach (${lat.toFixed(2)}°N)`,
      nameEn: "Nile - Luxor Reach",
      governorate: "Luxor",
      reachRegion: "Luxor Reach",
      waterbodyType: "River",
    }
  }

  // Aswan / Edfu / Kom Ombo
  if (lat >= 24.0) {
    return {
      name: `Nile - Aswan Reach (${lat.toFixed(2)}°N)`,
      nameEn: "Nile - Aswan Reach",
      governorate: "Aswan",
      reachRegion: "Aswan Reach",
      waterbodyType: "River",
    }
  }

  // Lake Nasser / Toshka Spillways
  const isToshka = lon <= 31.5
  return {
    name: isToshka ? `Toshka Lakes (${lat.toFixed(2)}°N)` : `Lake Nasser (${lat.toFixed(2)}°N)`,
    nameEn: isToshka ? "Toshka Lakes" : "Lake Nasser",
    governorate: "Aswan",
    reachRegion: isToshka ? "Toshka Spillway Basin" : "Lake Nasser Basin",
    waterbodyType: isToshka ? "Lake" : "Reservoir",
  }
}

/**
 * Resolves a station ID and coordinates into an expressive, meaningful geographic location.
 * Strictly English only.
 */
export function resolveStationLocation(
  dahitiId: number | string,
  rawName: string,
  latitude: number,
  longitude: number,
): StationLocationInfo {
  const numericId =
    typeof dahitiId === "number"
      ? dahitiId
      : parseInt(String(dahitiId).replace(/\D/g, ""), 10)

  if (numericId && DAHITI_LOCATION_REGISTRY[numericId]) {
    return DAHITI_LOCATION_REGISTRY[numericId]
  }

  return resolveByCoordinates(rawName, latitude, longitude)
}

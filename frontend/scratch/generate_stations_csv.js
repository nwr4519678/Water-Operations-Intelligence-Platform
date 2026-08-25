// scratch/generate_stations_csv.js
import fs from "fs"
import path from "path"

function createPrng(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const prng = createPrng(20260823)

const rows = [
  [
    "Station Type",
    "Station Name",
    "Region / Branch / Function",
    "Latitude",
    "Longitude",
    "Connection Status",
  ],
]

// 1. Main Control Center (1)
rows.push([
  "Main Control Center",
  "National Telemetry Operations HQ (MWRI) - المقر القومي الشامل للتحكم",
  "Greater Cairo Operations HQ",
  "30.0165",
  "31.2095",
  "Live satellite and real-time transmission",
])

// 2. Master Stations (9)
const masters = [
  {
    name: "Aswan High Dam Master Station - محطة السد العالي (خزان أسوان)",
    region: "Aswan & South Valley",
    lat: 23.97,
    lng: 32.88,
  },
  {
    name: "Delta Barrages Strategic Master - محطة قناطر الدلتا الاستراتيجية",
    region: "Delta Irrigation & Drainage Network",
    lat: 30.19,
    lng: 31.13,
  },
  {
    name: "Siwa Oasis Central Deep Wells Master - محطة آبار واحة سيوة المركزية",
    region: "Matrouh & Western Oases",
    lat: 29.2032,
    lng: 25.5189,
  },
  {
    name: "New Assiut Barrage Master Station - محطة قناطر أسيوط الجديدة",
    region: "Nile Valley & Middle Egypt",
    lat: 27.2,
    lng: 31.19,
  },
  {
    name: "Lake Manzala Main Outlet Master - محطة مخرج بحيرة المنزلة الرئيسية",
    region: "North Delta & Port Said",
    lat: 31.25,
    lng: 32.15,
  },
  {
    name: "Lake Burullus Main Outlet Master - محطة مخرج بحيرة البرلس الرئيسية",
    region: "North Delta & Kafr El-Sheikh",
    lat: 31.48,
    lng: 30.98,
  },
  {
    name: "Kharga Oasis Deep Aquifer Master - محطة آبار الخارجة الجوفية",
    region: "New Valley & Nubian Aquifer",
    lat: 25.44,
    lng: 30.55,
  },
  {
    name: "Toshka Spillway & Regulators - محطة مفيض وقناطر توشكى",
    region: "Toshka Axis & South Valley",
    lat: 22.5,
    lng: 31.5,
  },
  {
    name: "Wadi El-Natrun Axis Intake Master - محطة مأخذ وادي النطرون المحورية",
    region: "Beheira & Wadi El-Natrun",
    lat: 30.41,
    lng: 30.35,
  },
]

masters.forEach((m) => {
  rows.push([
    "Master Station",
    m.name,
    m.region,
    m.lat.toFixed(4),
    m.lng.toFixed(4),
    "Stable",
  ])
})

// 3. 400 Field RTUs
const fieldRegions = [
  {
    count: 180,
    region: "Delta Irrigation & Drainage Network",
    centerLat: 30.85,
    centerLng: 31.15,
    spreadLat: 0.8,
    spreadLng: 1.5,
  },
  {
    count: 60,
    region: "Fayoum & Bahr Youssef Basin",
    centerLat: 29.3,
    centerLng: 30.84,
    spreadLat: 0.3,
    spreadLng: 0.4,
  },
  {
    count: 80,
    region: "Nile Valley & Middle Egypt",
    centerLat: 26.5,
    centerLng: 31.5,
    spreadLat: 2.4,
    spreadLng: 0.8,
  },
  {
    count: 30,
    region: "Aswan & South Valley",
    centerLat: 24.5,
    centerLng: 32.9,
    spreadLat: 1.0,
    spreadLng: 0.5,
  },
  {
    count: 25,
    region: "New Valley & Nubian Aquifer",
    centerLat: 25.0,
    centerLng: 29.0,
    spreadLat: 2.8,
    spreadLng: 1.8,
  },
  {
    count: 25,
    region: "Toshka Axis & South Valley",
    centerLat: 22.6,
    centerLng: 31.7,
    spreadLat: 0.5,
    spreadLng: 0.8,
  },
]

let rtuIndex = 1
fieldRegions.forEach((fr) => {
  for (let i = 0; i < fr.count; i++) {
    const lat = fr.centerLat + (prng() - 0.5) * fr.spreadLat
    const lng = fr.centerLng + (prng() - 0.5) * fr.spreadLng
    const rtuNum = 2000 + rtuIndex
    rows.push([
      "Field RTU Station",
      `Field Telemetry Station RTU-${rtuNum}`,
      fr.region,
      lat.toFixed(4),
      lng.toFixed(4),
      "Stable via GSM/GPRS",
    ])
    rtuIndex++
  }
})

const csvContent = rows
  .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
  .join("\n")

fs.mkdirSync("public/data", { recursive: true })
fs.writeFileSync(
  "public/data/egypt_water_telemetry_stations.csv",
  csvContent,
  "utf-8",
)
fs.mkdirSync("src/data", { recursive: true })
fs.writeFileSync(
  "src/data/egypt_water_telemetry_stations.csv",
  csvContent,
  "utf-8",
)

console.log(
  `Generated CSV with ${rows.length - 1} stations. Total rows: ${rows.length}`,
)

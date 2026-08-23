export type MapLanguage = 'en' | 'ar'

export interface Station {
  id: string
  nameAr: string
  nameEn: string
  category: 'hq' | 'master' | 'field'
  zoneAr: string
  zoneEn: string
  lat: number
  lng: number
  level: string       // in meters
  flow: string        // in L/s or m³/s
  pressure: string    // in bar
  quality: 'Good' | 'Fair' | 'Critical' | 'Normal'
  status: 'online' | 'warning' | 'offline'
  lastSeenAr: string
  lastSeenEn: string
  typeAr: string
  typeEn: string
  capacityAr: string
  capacityEn: string
  install: string
  mechanismAr: string
  mechanismEn: string
  dataParamsAr: string
  dataParamsEn: string
  signalAr: string
  signalEn: string
}

export interface ZoneItem {
  id: string
  nameAr: string
  nameEn: string
}

// 1. Headquarters Station
export const hqStation: Station = {
  id: "HQ-001",
  nameAr: "المقر القومي الشامل للتحكم (الوزارة)",
  nameEn: "National Telemetry Operations HQ (MWRI)",
  category: "hq",
  zoneAr: "القاهرة الكبرى",
  zoneEn: "Greater Cairo HQ",
  lat: 30.0165,
  lng: 31.2095,
  level: "3.45",
  flow: "1450",
  pressure: "5.8",
  quality: "Good",
  status: "online",
  lastSeenAr: "بث فضائي مباشر",
  lastSeenEn: "Live satellite stream",
  typeAr: "الإدارة العليا والتحكم القومي السيادي",
  typeEn: "Executive Strategic & National Command",
  capacityAr: "إشراف وطني شامل",
  capacityEn: "Full National Oversight",
  install: "2015-01",
  mechanismAr: "منظومة رصد مركزية عبر الأقمار الصناعية وشبكات الألياف",
  mechanismEn: "Central SCADA & satellite telemetry earth stations",
  dataParamsAr: "كافة القياسات الهيدرولوجية والمناخية ونسب العكارة والتصرف",
  dataParamsEn: "Comprehensive hydrological, water quality & flow telemetry",
  signalAr: "بث فضائي ولحظي فائق الدقة",
  signalEn: "Direct Dual Satellite & Fiber Uplink"
}

// 2. 9 Strategic Master Stations
export const masterStations: Station[] = [
  {
    id: "MST-01",
    nameAr: "محطة السد العالي (خزان أسوان)",
    nameEn: "Aswan High Dam Master Station",
    category: "master",
    zoneAr: "أسوان وجنوب الوادي",
    zoneEn: "Aswan & South Valley",
    lat: 23.9700,
    lng: 32.8800,
    level: "178.5",
    flow: "2100",
    pressure: "8.4",
    quality: "Good",
    status: "online",
    lastSeenAr: "منذ دقيقة",
    lastSeenEn: "1 min ago",
    typeAr: "محطة مرجعية كبرى / موازنة مائية",
    typeEn: "Master Station / Strategic Water Balance",
    capacityAr: "2500 م³/ث",
    capacityEn: "2500 m³/s",
    install: "2016-04",
    mechanismAr: "حساسات ضغط هيدروستاتيكي ورادار دوبلر",
    mechanismEn: "Hydrostatic pressure sensors & Doppler radar",
    dataParamsAr: "منسوب البحيرة، التصرف، سرعة التيار، درجة الحرارة",
    dataParamsEn: "Lake level, discharge rate, flow velocity, temp",
    signalAr: "بث فضائي + ألياف بصرية (مستقر)",
    signalEn: "Satellite + Fiber Optic (Stable)"
  },
  {
    id: "MST-02",
    nameAr: "محطة قناطر الدلتا الاستراتيجية",
    nameEn: "Delta Barrages Strategic Master",
    category: "master",
    zoneAr: "إقليم شبكات ري الدلتا",
    zoneEn: "Delta Irrigation & Drainage Network",
    lat: 30.1900,
    lng: 31.1300,
    level: "16.8",
    flow: "1250",
    pressure: "4.6",
    quality: "Good",
    status: "online",
    lastSeenAr: "منذ دقيقتين",
    lastSeenEn: "2 mins ago",
    typeAr: "محطة مرجعية كبرى / توزيع وتصريف",
    typeEn: "Master Station / Strategic Distribution",
    capacityAr: "1800 م³/ث",
    capacityEn: "1800 m³/s",
    install: "2017-08",
    mechanismAr: "مستشعرات فوق صوتية وبوابات هيدروليكية ذكية",
    mechanismEn: "Ultrasonic sensors & smart hydraulic gates",
    dataParamsAr: "مناسيب فرعي رشيد ودمياط، التصرفات، الملوحة",
    dataParamsEn: "Rosetta & Damietta levels, discharge, salinity",
    signalAr: "شبكة 4G/GPRS صناعية مستقرة",
    signalEn: "Industrial 4G/GPRS (Stable)"
  },
  {
    id: "MST-03",
    nameAr: "محطة آبار واحة سيوة المركزية",
    nameEn: "Siwa Oasis Central Deep Wells Master",
    category: "master",
    zoneAr: "مطروح والواحات الغربية",
    zoneEn: "Matrouh & Western Oases",
    lat: 29.2032,
    lng: 25.5189,
    level: "4.20",
    flow: "380",
    pressure: "3.2",
    quality: "Fair",
    status: "online",
    lastSeenAr: "منذ 4 دقائق",
    lastSeenEn: "4 mins ago",
    typeAr: "محطة مرجعية كبرى / إدارة مياه جوفية",
    typeEn: "Master Station / Deep Aquifer Management",
    capacityAr: "500 ل/ث",
    capacityEn: "500 L/s",
    install: "2019-11",
    mechanismAr: "حساسات كهرومغناطيسية ومسبارات أعماق جوفية",
    mechanismEn: "Electromagnetic deep borehole probes",
    dataParamsAr: "عمق المياه الجوفية، نسبة الأملاح TDS، الضغط",
    dataParamsEn: "Groundwater depth, TDS salinity, pressure",
    signalAr: "قمر صناعي فضائي VSAT",
    signalEn: "Satellite VSAT Link"
  },
  {
    id: "MST-04",
    nameAr: "محطة قناطر أسيوط الجديدة",
    nameEn: "New Assiut Barrage Master Station",
    category: "master",
    zoneAr: "قطاع وادي النيل ومصر الوسطى",
    zoneEn: "Nile Valley & Middle Egypt",
    lat: 27.2000,
    lng: 31.1900,
    level: "48.3",
    flow: "980",
    pressure: "5.1",
    quality: "Good",
    status: "online",
    lastSeenAr: "منذ دقيقة",
    lastSeenEn: "1 min ago",
    typeAr: "محطة مرجعية كبرى / كهرومائية وري",
    typeEn: "Master Station / Hydroelectric & Irrigation",
    capacityAr: "1400 م³/ث",
    capacityEn: "1400 m³/s",
    install: "2018-03",
    mechanismAr: "محطات رصد أوتوماتيكية مدمجة بالمجسات الرقمية",
    mechanismEn: "Automatic telemetry station with digital gauges",
    dataParamsAr: "منسوب الأمام والخلف، فتحات العيون، التصرفات",
    dataParamsEn: "Upstream/downstream levels, sluice gates, flow",
    signalAr: "ألياف ضوئية + 4G الاحتياطي",
    signalEn: "Fiber Optic + 4G Backup"
  },
  {
    id: "MST-05",
    nameAr: "محطة مخرج بحيرة المنزلة الرئيسية",
    nameEn: "Lake Manzala Main Outlet Master",
    category: "master",
    zoneAr: "شمال الدلتا وبورسعيد",
    zoneEn: "North Delta & Port Said",
    lat: 31.2500,
    lng: 32.1500,
    level: "1.85",
    flow: "420",
    pressure: "2.1",
    quality: "Fair",
    status: "warning",
    lastSeenAr: "منذ 6 دقائق",
    lastSeenEn: "6 mins ago",
    typeAr: "محطة مرجعية كبرى / رصد مصبات وبحيرات",
    typeEn: "Master Station / Lagoon & Outlet Telemetry",
    capacityAr: "600 م³/ث",
    capacityEn: "600 m³/s",
    install: "2020-02",
    mechanismAr: "أجهزة قياس التيارات الصوتية ADCP",
    mechanismEn: "Acoustic Doppler Current Profiler (ADCP)",
    dataParamsAr: "سرعة التدفق، جودة المياه، المد والجزر",
    dataParamsEn: "Flow velocity, water quality, tidal shifts",
    signalAr: "اتصال لاسلكي راديوي UHF",
    signalEn: "UHF Telemetry Radio Link"
  },
  {
    id: "MST-06",
    nameAr: "محطة مخرج بحيرة البرلس الرئيسية",
    nameEn: "Lake Burullus Main Outlet Master",
    category: "master",
    zoneAr: "شمال الدلتا وكفر الشيخ",
    zoneEn: "North Delta & Kafr El-Sheikh",
    lat: 31.4800,
    lng: 30.9800,
    level: "1.42",
    flow: "310",
    pressure: "2.0",
    quality: "Good",
    status: "online",
    lastSeenAr: "منذ 3 دقائق",
    lastSeenEn: "3 mins ago",
    typeAr: "محطة مرجعية كبرى / حماية وموازنة ساحلية",
    typeEn: "Master Station / Coastal Balance & Protection",
    capacityAr: "450 م³/ث",
    capacityEn: "450 m³/s",
    install: "2020-09",
    mechanismAr: "رادارات منسوب مائي بدون تلامس",
    mechanismEn: "Non-contact water level radar",
    dataParamsAr: "المنسوب السطحي، اتجاه التيار، نسبة الملوحة",
    dataParamsEn: "Surface level, current direction, salinity",
    signalAr: "شبكة 4G/LTE صناعية",
    signalEn: "Industrial 4G/LTE Network"
  },
  {
    id: "MST-07",
    nameAr: "محطة آبار الخارجة الجوفية",
    nameEn: "Kharga Oasis Deep Aquifer Master",
    category: "master",
    zoneAr: "الخزان الجوفي بالوادي الجديد والواحات",
    zoneEn: "New Valley & Nubian Sandstone Aquifer",
    lat: 25.4400,
    lng: 30.5500,
    level: "8.90",
    flow: "290",
    pressure: "3.8",
    quality: "Good",
    status: "online",
    lastSeenAr: "منذ دقيقتين",
    lastSeenEn: "2 mins ago",
    typeAr: "محطة مرجعية كبرى / خزان النوبة الجوفي",
    typeEn: "Master Station / Nubian Deep Aquifer",
    capacityAr: "400 ل/ث",
    capacityEn: "400 L/s",
    install: "2019-05",
    mechanismAr: "مستشعرات ضغط رقمية بعمق 600 متر",
    mechanismEn: "Digital pressure sensors at 600m depth",
    dataParamsAr: "الهبوط الديناميكي، السحب اليومي، درجة الحرارة",
    dataParamsEn: "Dynamic drawdown, daily extraction, temp",
    signalAr: "قمر صناعي فضائي مباشر",
    signalEn: "Direct Satellite Uplink"
  },
  {
    id: "MST-08",
    nameAr: "محطة مفيض وقناطر توشكى",
    nameEn: "Toshka Spillway & Regulators Master",
    category: "master",
    zoneAr: "محور توشكى وجنوب الوادي",
    zoneEn: "Toshka Axis & South Valley",
    lat: 22.5000,
    lng: 31.5000,
    level: "172.1",
    flow: "1650",
    pressure: "6.5",
    quality: "Good",
    status: "online",
    lastSeenAr: "منذ دقيقة",
    lastSeenEn: "1 min ago",
    typeAr: "محطة مرجعية كبرى / مفيض واستصلاح قومي",
    typeEn: "Master Station / Spillway & Reclamation",
    capacityAr: "2200 م³/ث",
    capacityEn: "2200 m³/s",
    install: "2017-12",
    mechanismAr: "نظام تصوير راداري وقياس تدفق قنوات مفتوحة",
    mechanismEn: "Radar imaging & open-channel flow meters",
    dataParamsAr: "سعة مفيض توشكى، منسوب قناة الشيخ زايد",
    dataParamsEn: "Spillway capacity, Sheikh Zayed canal level",
    signalAr: "شبكة ميكروويف خاصة + ألياف",
    signalEn: "Dedicated Microwave Link + Fiber"
  },
  {
    id: "MST-09",
    nameAr: "محطة مأخذ وادي النطرون المحورية",
    nameEn: "Wadi El-Natrun Axis Intake Master",
    category: "master",
    zoneAr: "البحيرة ووادي النطرون",
    zoneEn: "Beheira & Wadi El-Natrun",
    lat: 30.4100,
    lng: 30.3500,
    level: "3.10",
    flow: "460",
    pressure: "3.5",
    quality: "Good",
    status: "online",
    lastSeenAr: "منذ 5 دقائق",
    lastSeenEn: "5 mins ago",
    typeAr: "محطة مرجعية كبرى / مأخذ وضخ محوري",
    typeEn: "Master Station / Intake & Booster Pumping",
    capacityAr: "700 ل/ث",
    capacityEn: "700 L/s",
    install: "2021-01",
    mechanismAr: "عدادات تدفق فوق صوتية متعددة المسارات",
    mechanismEn: "Multi-path transit-time ultrasonic meters",
    dataParamsAr: "معدل التدفق اللحظي، ضغط خطوط الطرد",
    dataParamsEn: "Instantaneous flow rate, discharge pressure",
    signalAr: "شبكة 4G الصناعية",
    signalEn: "Industrial 4G Network"
  }
]

// 3. 400 Field RTU Stations across 6 Egyptian regions
interface RegionConfig {
  count: number
  centerLat: number
  centerLng: number
  spreadLat: number
  spreadLng: number
  zoneAr: string
  zoneEn: string
}

const regions: RegionConfig[] = [
  { count: 180, centerLat: 30.85, centerLng: 31.15, spreadLat: 0.8, spreadLng: 1.5, zoneAr: "إقليم شبكات ري ومصارف الدلتا", zoneEn: "Nile Delta Irrigation & Drainage" },
  { count: 60,  centerLat: 29.30, centerLng: 30.84, spreadLat: 0.3, spreadLng: 0.4, zoneAr: "نطاق إدارة ري الفيوم وبحر يوسف الحرج", zoneEn: "Fayoum & Bahr Youssef Basin" },
  { count: 80,  centerLat: 26.50, centerLng: 31.50, spreadLat: 2.4, spreadLng: 0.8, zoneAr: "قطاع وادي النيل ومناسي الصعيد", zoneEn: "Upper Egypt & Nile Valley Reach" },
  { count: 30,  centerLat: 24.50, centerLng: 32.90, spreadLat: 1.0, spreadLng: 0.5, zoneAr: "توزيعات ري خزان أسوان وكوم أمبو", zoneEn: "Aswan Reservoir & Kom Ombo" },
  { count: 25,  centerLat: 25.00, centerLng: 29.00, spreadLat: 2.8, spreadLng: 1.8, zoneAr: "الخزان الجوفي بالوادي الجديد والواحات", zoneEn: "New Valley & Oases Deep Aquifers" },
  { count: 25,  centerLat: 22.60, centerLng: 31.70, spreadLat: 0.5, spreadLng: 0.8, zoneAr: "محور توشكى والزراعات الاستثمارية لجنوب الوادي", zoneEn: "Toshka Axis & South Valley Reclamation" },
]

function createPrng(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateFieldStations(): Station[] {
  const prng = createPrng(20260823)
  const stations: Station[] = []
  let stationIndex = 1

  for (const reg of regions) {
    for (let i = 0; i < reg.count; i++) {
      const lat = Number((reg.centerLat + (prng() - 0.5) * reg.spreadLat).toFixed(4))
      const lng = Number((reg.centerLng + (prng() - 0.5) * reg.spreadLng).toFixed(4))
      const stationId = `RTU-${2000 + stationIndex}`

      const levelVal = (1.1 + prng() * 2.8).toFixed(2)
      const flowVal = Math.round(40 + prng() * 320).toString()
      const pressureVal = (1.5 + prng() * 3.5).toFixed(1)

      const randStatus = prng()
      let status: 'online' | 'warning' | 'offline' = 'online'
      let quality: 'Good' | 'Fair' | 'Critical' | 'Normal' = 'Good'

      if (randStatus > 0.97) {
        status = 'offline'
        quality = 'Critical'
      } else if (randStatus > 0.91) {
        status = 'warning'
        quality = 'Fair'
      }

      const mins = status === 'offline' 
        ? Math.round(20 + prng() * 90) 
        : status === 'warning' 
        ? Math.round(5 + prng() * 15) 
        : Math.round(1 + prng() * 3)

      stations.push({
        id: stationId,
        nameAr: `محطة رصد حقلية ${stationId}`,
        nameEn: `Field Telemetry Station ${stationId}`,
        category: "field",
        zoneAr: reg.zoneAr,
        zoneEn: reg.zoneEn,
        lat,
        lng,
        level: levelVal,
        flow: status === 'offline' ? "—" : flowVal,
        pressure: pressureVal,
        quality,
        status,
        lastSeenAr: `منذ ${mins} دقيقة`,
        lastSeenEn: `${mins} min${mins > 1 ? 's' : ''} ago`,
        typeAr: "محطة رصد حقلية RTU",
        typeEn: "Field RTU Sensor Station",
        capacityAr: "350 ل/ث",
        capacityEn: "350 L/s",
        install: `202${Math.floor(prng() * 4)}-0${Math.floor(prng() * 9) + 1}`,
        mechanismAr: "مستشعرات الموجات فوق الصوتية",
        mechanismEn: "Ultrasonic level & velocity sensors",
        dataParamsAr: "المنسوب، التصرف، نسبة الملوحة",
        dataParamsEn: "Water level, flow rate, salinity",
        signalAr: status === 'offline' ? "منقطع (إعادة محاولة الاتصال)" : "مستقر (GSM/GPRS)",
        signalEn: status === 'offline' ? "Disconnected (Reconnecting)" : "Stable (GSM/GPRS)"
      })

      stationIndex++
    }
  }

  return stations
}

export const fieldStations: Station[] = generateFieldStations()

// All 410 stations
export const allStations: Station[] = [
  hqStation,
  ...masterStations,
  ...fieldStations
]

// All zones with dual language labels
export const allZonesList: ZoneItem[] = [
  { id: "all", nameAr: "جميع المناطق", nameEn: "All Regions" },
  { id: "delta", nameAr: "إقليم شبكات ري ومصارف الدلتا", nameEn: "Delta Irrigation & Drainage" },
  { id: "fayoum", nameAr: "نطاق إدارة ري الفيوم وبحر يوسف الحرج", nameEn: "Fayoum & Bahr Youssef Basin" },
  { id: "upper_egypt", nameAr: "قطاع وادي النيل ومناسي الصعيد", nameEn: "Upper Egypt & Nile Valley Reach" },
  { id: "aswan", nameAr: "أسوان وجنوب الوادي / خزان أسوان", nameEn: "Aswan & South Valley" },
  { id: "new_valley", nameAr: "الخزان الجوفي بالوادي الجديد والواحات", nameEn: "New Valley & Oases Deep Aquifers" },
  { id: "toshka", nameAr: "محور توشكى والزراعات الاستثمارية لجنوب الوادي", nameEn: "Toshka Axis & South Valley" },
  { id: "cairo", nameAr: "القاهرة الكبرى (المقر القومي)", nameEn: "Greater Cairo (HQ)" },
  { id: "siwa", nameAr: "مطروح والواحات الغربية", nameEn: "Matrouh & Western Oases" },
  { id: "north_coast", nameAr: "شمال الدلتا والبحيرات (المنزلة / البرلس)", nameEn: "North Delta Lagoons (Manzala / Burullus)" },
  { id: "natrun", nameAr: "البحيرة ووادي النطرون", nameEn: "Beheira & Wadi El-Natrun" },
]

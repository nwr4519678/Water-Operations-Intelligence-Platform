import type { Report, TelemetryPoint } from '../types'

function download(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function exportTelemetryCsv(filename: string, telemetry: TelemetryPoint[]): void {
  const lines = ['timestamp,upstream_m,downstream_m,battery_pct,signal_bars,quality,anomaly', ...telemetry.map((point) => `${point.timestamp},${point.upstream},${point.downstream},${point.battery},${point.signal},${point.quality},${point.anomaly}`)]
  download(filename, lines.join('\n'), 'text/csv;charset=utf-8')
}

export function downloadReport(report: Report): void {
  const rows = Array.from({ length: 24 }, (_, index) => `2025-11-${String(index + 1).padStart(2, '0')}T12:00:00Z,13.${780 + index},13.${350 + index},good`)
  download(report.name, ['timestamp,upstream_m,downstream_m,quality', ...rows].join('\n'), 'text/csv;charset=utf-8')
}

export function exportChartPng(filename: string, title: string, value: number): void {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="100%" height="100%" fill="#f8fafc"/><text x="72" y="105" font-family="Arial" font-size="44" fill="#172554">${title}</text><text x="72" y="168" font-family="Arial" font-size="24" fill="#64748b">EchoCloud • simulated viewer export</text><path d="M72 470 C180 420 250 470 345 390 S520 420 630 330 S810 365 920 255 S1070 305 1130 220" fill="none" stroke="#2563eb" stroke-width="12"/><text x="72" y="560" font-family="Arial" font-size="58" font-weight="700" fill="#1e3a8a">${value.toFixed(3)} m</text></svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const image = new Image()
  image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630; const context = canvas.getContext('2d'); if (context) { context.drawImage(image, 0, 0); canvas.toBlob((png) => { if (png) { const pngUrl = URL.createObjectURL(png); const anchor = document.createElement('a'); anchor.href = pngUrl; anchor.download = filename; anchor.click(); URL.revokeObjectURL(pngUrl) } }, 'image/png') } URL.revokeObjectURL(url) }
  image.src = url
}

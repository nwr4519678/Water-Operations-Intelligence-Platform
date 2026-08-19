import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Plus, Search, Settings2 } from 'lucide-react'
import { PageHeading } from '../components/ui/PageHeading'
import { downloadReport } from '../services/exportService'
import { reports, stations } from '../services/mockData'
import type { Report } from '../types'

type Column = 'station' | 'range' | 'created' | 'finished' | 'rows' | 'status'
const columnLabels: Record<Column, string> = { station: 'Station', range: 'Date range', created: 'Created at', finished: 'Finished at', rows: 'Rows', status: 'Status' }

function createInstantReport(): Report { const now = new Date(); return { id: `instant-${now.getTime()}`, stationId: 'meri-demo', name: `MERI_Demo_${now.toISOString().slice(0, 10)}_instant.csv`, range: 'Last 24 hours', createdAt: now.toLocaleString(), finishedAt: now.toLocaleString(), rows: 48, status: 'Finished' } }

export function DownloadCenter() {
  const [query, setQuery] = useState('')
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [generated, setGenerated] = useState<Report[]>([])
  const [columns, setColumns] = useState<Record<Column, boolean>>({ station: true, range: true, created: true, finished: true, rows: true, status: true })
  const data = useMemo(() => [...generated, ...reports].filter((report) => `${report.name} ${report.range}`.toLowerCase().includes(query.toLowerCase())), [generated, query])
  const pages = Math.max(1, Math.ceil(data.length / pageSize))
  const visible = data.slice((page - 1) * pageSize, page * pageSize)
  function updateQuery(value: string) { setQuery(value); setPage(1) }
  function updatePageSize(value: number) { setPageSize(value); setPage(1) }
  function generate() { const report = createInstantReport(); setGenerated((current) => [report, ...current]); setPage(1); downloadReport(report) }
  return <><PageHeading eyebrow="REPORTS / DOWNLOAD CENTER" title="Generated data exports" description="Search completed telemetry CSV files and generate an instant simulated report." action={<button className="button-primary" type="button" onClick={generate}><Plus size={17} /> Generate CSV</button>} /><section className="download-toolbar panel"><label className="search-field"><Search size={18} /><input aria-label="Search reports" placeholder="Search by filename or date range" value={query} onChange={(event) => updateQuery(event.target.value)} /></label><details className="column-selector"><summary><Settings2 size={16} /> Columns</summary><div>{(Object.keys(columnLabels) as Column[]).map((column) => <label key={column}><input type="checkbox" checked={columns[column]} onChange={() => setColumns((current) => ({ ...current, [column]: !current[column] }))} />{columnLabels[column]}</label>)}</div></details><label className="page-size">Show<select value={pageSize} onChange={(event) => updatePageSize(Number(event.target.value))}><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select> entries</label></section><section className="download-table-panel panel"><div className="responsive-table"><table><thead><tr><th>File</th>{(Object.keys(columnLabels) as Column[]).map((column) => columns[column] && <th key={column}>{columnLabels[column]}</th>)}<th>Action</th></tr></thead><tbody>{visible.map((report) => { const station = stations.find((item) => item.id === report.stationId); return <tr key={report.id}><td className="report-name"><FileSpreadsheet size={18} /><span>{report.name}</span></td>{columns.station && <td>{station?.name}</td>}{columns.range && <td>{report.range}</td>}{columns.created && <td>{report.createdAt}</td>}{columns.finished && <td>{report.finishedAt}</td>}{columns.rows && <td>{report.rows.toLocaleString()}</td>}{columns.status && <td><span className="report-status">{report.status}</span></td>}<td><button className="download-button" type="button" aria-label={`Download ${report.name}`} onClick={() => downloadReport(report)}><Download size={17} /> Download</button></td></tr> })}</tbody></table></div><div className="table-pagination"><span>Showing {data.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, data.length)} of {data.length} reports</span><div><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={17} /> Previous</button><b>{page}</b><button type="button" disabled={page === pages} onClick={() => setPage((current) => current + 1)}>Next <ChevronRight size={17} /></button></div></div></section></>
}

import { useId } from 'react'

export function SearchField({ label, value, onChange, placeholder = 'Search' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  const id = useId()
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">{label}</span>
      <span className="field__control field__control--search">
        <span aria-hidden="true">⌕</span>
        <input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      </span>
    </label>
  )
}

export function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  const id = useId()
  return (
    <label className="field" htmlFor={id}>
      <span className="field__label">{label}</span>
      <select id={id} className="field__control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

export function Tabs({ tabs, activeTab, onChange }: { tabs: Array<{ id: string; label: string }>; activeTab: string; onChange: (id: string) => void }) {
  return (
    <div className="tabs" role="tablist" aria-label="View options">
      {tabs.map((tab) => <button key={tab.id} className={`tabs__tab ${activeTab === tab.id ? 'tabs__tab--active' : ''}`} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => onChange(tab.id)}>{tab.label}</button>)}
    </div>
  )
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="button button--secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span aria-live="polite">Page {page} of {totalPages}</span>
      <button type="button" className="button button--secondary" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  )
}

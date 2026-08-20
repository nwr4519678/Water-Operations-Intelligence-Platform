import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataTable, Dialog, FeedbackState, KpiCard, StatusBadge, ViewerShell } from './index'

describe('viewer design system', () => {
  it('exposes status text alongside the status color', () => {
    render(<StatusBadge tone="critical" />)
    expect(screen.getByText('Critical')).toBeInTheDocument()
  })

  it('provides an accessible KPI label', () => {
    render(<KpiCard label="Active stations" value="112" />)
    expect(screen.getByRole('article', { name: 'Active stations: 112' })).toBeInTheDocument()
  })

  it('renders an actionable error state', () => {
    render(<FeedbackState kind="error" actionLabel="Retry" onAction={() => undefined} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled()
  })

  it('uses RTL document semantics for Arabic viewers', () => {
    render(<ViewerShell locale="ar" navigation={[]}><span>Content</span></ViewerShell>)
    expect(screen.getByRole('main').closest('[dir="rtl"]')).toBeInTheDocument()
  })

  it('renders table headers and modal semantics for assistive technology', () => {
    render(<><DataTable label="Stations" columns={[{ id: 'name', header: 'Station', render: (row: { id: string; name: string }) => row.name }]} rows={[{ id: 'st-1', name: 'River Pump' }]} /><Dialog title="Station details" open onClose={() => undefined}>Read-only details</Dialog></>)
    expect(screen.getByRole('columnheader', { name: 'Station' })).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Station details' })).toBeInTheDocument()
  })
})

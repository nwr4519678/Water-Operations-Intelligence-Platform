import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { DownloadCenter } from './DownloadCenter'

describe('DownloadCenter filtering', () => { it('filters report rows by file name', async () => { const user = userEvent.setup(); render(<MemoryRouter><DownloadCenter /></MemoryRouter>); await user.type(screen.getByLabelText('Search reports'), 'WadiAl-Natroun'); expect(screen.getByText('MERI_WadiAl-Natroun_2025-10-01_2025-10-31.csv')).toBeInTheDocument(); expect(screen.queryByText('MERI_Demo_2025-11-01_2025-11-30.csv')).not.toBeInTheDocument() }) })

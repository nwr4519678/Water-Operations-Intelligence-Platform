import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LevelGauge } from './LevelGauge'

describe('LevelGauge', () => { it('renders the tide value at three decimal places', () => { render(<LevelGauge label="Up Stream Level" value={13.825} updatedAt="11:42 AM" />); expect(screen.getByLabelText('Up Stream Level: 13.825 metres')).toBeInTheDocument(); expect(screen.getByText('13.825', { exact: false })).toBeInTheDocument() }) })

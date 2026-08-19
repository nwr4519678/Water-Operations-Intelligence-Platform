import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider, isSessionActive, useAuth } from './useAuth'

function AuthProbe() { const { isAuthenticated } = useAuth(); return <span>{isAuthenticated ? 'authenticated' : 'signed-out'}</span> }

describe('viewer session expiration', () => {
  beforeEach(() => localStorage.clear())
  it('marks an expired mock JWT session as inactive', () => { expect(isSessionActive({ token: 'mock', email: 'viewer@echocloud.meri', expiresAt: Date.now() - 1 })).toBe(false) })
  it('does not restore an expired session from storage', () => { localStorage.setItem('echocloud-viewer-session', JSON.stringify({ token: 'mock', email: 'viewer@echocloud.meri', expiresAt: Date.now() - 1000 })); render(<AuthProvider><AuthProbe /></AuthProvider>); expect(screen.getByText('signed-out')).toBeInTheDocument() })
})

import type { ReactNode } from 'react'

type FeedbackKind = 'loading' | 'empty' | 'error' | 'stale' | 'forbidden'

interface FeedbackStateProps {
  kind: FeedbackKind
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

const defaults: Record<FeedbackKind, { title: string; description: string }> = {
  loading: { title: 'Loading data', description: 'Please wait while we fetch the latest readings.' },
  empty: { title: 'No data available', description: 'There are no records matching the current view.' },
  error: { title: 'Something went wrong', description: 'We could not load this data. Try again.' },
  stale: { title: 'Data may be out of date', description: 'The latest update is older than the expected refresh window.' },
  forbidden: { title: 'Permission required', description: 'You do not have permission to view this information.' },
}

export function FeedbackState({ kind, title, description, actionLabel, onAction, icon }: FeedbackStateProps) {
  const copy = defaults[kind]
  return (
    <section className={`feedback feedback--${kind}`} role={kind === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="feedback__icon" aria-hidden="true">{icon ?? (kind === 'loading' ? '◌' : kind === 'error' ? '!' : 'i')}</span>
      <div>
        <h3>{title ?? copy.title}</h3>
        <p>{description ?? copy.description}</p>
        {actionLabel && onAction ? <button className="button button--secondary" type="button" onClick={onAction}>{actionLabel}</button> : null}
      </div>
    </section>
  )
}

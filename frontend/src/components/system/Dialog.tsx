import type { PropsWithChildren } from 'react'

export function Dialog({ title, open, onClose, children }: PropsWithChildren<{ title: string; open: boolean; onClose: () => void }>) {
  if (!open) return null
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog__header"><h2 id="dialog-title">{title}</h2><button className="button button--secondary" type="button" aria-label="Close dialog" onClick={onClose}>×</button></div>
        <div>{children}</div>
      </section>
    </div>
  )
}

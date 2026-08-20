import type { ReactNode } from 'react';

export type StateViewKind = 'loading' | 'empty' | 'error' | 'offline' | 'stale';

type StateViewProps = {
  kind: StateViewKind;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function StateView({ kind, title, description, action }: StateViewProps) {
  return (
    <section className={`state-view state-view--${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action ? <div>{action}</div> : null}
    </section>
  );
}

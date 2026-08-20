import type { PropsWithChildren } from 'react'
import { getDirection, resources } from '../../shared/i18n/resources'
import type { ViewerShellProps } from './types'

export function ViewerShell({ children, navigation, breadcrumbs = [], locale = 'en', onLocaleChange, connectionLabel = 'Live connection', connectionTone = 'healthy' }: PropsWithChildren<ViewerShellProps>) {
  const copy = resources[locale]
  return (
    <div className="viewer-shell" dir={getDirection(locale)} lang={locale}>
      <aside className="viewer-shell__sidebar" aria-label="Primary navigation">
        <a className="viewer-shell__brand" href="/">{copy.appName}</a>
        <nav>
          <ul className="viewer-shell__navigation">
            {navigation.map((item) => <li key={item.id}><a className={item.current ? 'viewer-shell__link viewer-shell__link--current' : 'viewer-shell__link'} href={item.href} aria-current={item.current ? 'page' : undefined}>{item.label}</a></li>)}
          </ul>
        </nav>
        {onLocaleChange ? <div className="locale-switcher" aria-label="Language"><button type="button" aria-pressed={locale === 'en'} onClick={() => onLocaleChange('en')}>EN</button><button type="button" aria-pressed={locale === 'ar'} onClick={() => onLocaleChange('ar')}>ع</button></div> : null}
      </aside>
      <div className="viewer-shell__main">
        <header className="viewer-shell__header">
          <div>
            {breadcrumbs.length ? <nav className="breadcrumbs" aria-label="Breadcrumb">{breadcrumbs.map((item, index) => <span key={`${item.label}-${index}`}>{item.href ? <a href={item.href}>{item.label}</a> : item.label}{index < breadcrumbs.length - 1 ? <span aria-hidden="true"> / </span> : null}</span>)}</nav> : null}
            <div className="connection-indicator"><span className={`status-dot status-dot--${connectionTone}`} aria-hidden="true" />{connectionLabel}</div>
          </div>
          <button className="avatar-button" type="button" aria-label="Open profile menu">MA</button>
        </header>
        <main className="viewer-shell__content">{children}</main>
      </div>
    </div>
  )
}

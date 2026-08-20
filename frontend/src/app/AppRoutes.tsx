import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { can } from '../lib/permissions';
import { viewerSession } from '../mocks/auth/session';
import type { Capability } from '../types/auth';

const pages: Array<{ path: string; label: string; capability: Capability }> = [
  { path: '', label: 'Overview', capability: 'overview.read' },
  { path: 'map', label: 'Map & Stations', capability: 'stations.read' },
  { path: 'alarms', label: 'Alarms', capability: 'alarms.read' },
  { path: 'reports', label: 'Reports', capability: 'reports.read' },
  { path: 'ai-insights', label: 'AI Insights', capability: 'insights.read' },
];

function ViewerPage({ label, capability }: { label: string; capability: Capability }) {
  const decision = can(viewerSession, capability);
  if (!decision.allowed)
    return (
      <section className="state-view state-view--error">
        <strong>Access denied</strong>
        <p>This read-only session cannot access this view.</p>
      </section>
    );
  return (
    <section className="page-placeholder">
      <span className="eyebrow">VIEWER</span>
      <h1>{label}</h1>
      <p>Read-only foundation route ready for feature implementation.</p>
    </section>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell nav={pages} session={viewerSession} />}>
        <Route index element={<ViewerPage label="Overview" capability="overview.read" />} />
        {pages
          .filter((page) => page.path)
          .map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<ViewerPage label={page.label} capability={page.capability} />}
            />
          ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

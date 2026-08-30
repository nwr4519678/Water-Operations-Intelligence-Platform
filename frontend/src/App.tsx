// src/App.tsx
import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
const MapPage = lazy(() => import('./pages/MapPage').then((module) => ({ default: module.MapPage })));
import { StationDetailPage } from './pages/StationDetailPage';
import { AiHubPage } from './pages/AiHubPage';
import { AlarmsPage } from './pages/AlarmsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountPage } from './pages/AccountPage';
import { ShareSnapshotPage } from './pages/ShareSnapshotPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30000,
          },
        },
      }),
    []
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/share/:shareToken" element={<ShareSnapshotPage />} />

            {/* Protected VIEWER Routes */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route
                path="/map"
                element={
                  <Suspense fallback={<div className="dashboard"><div className="panel p-8 text-center text-slate-500">Loading GIS map…</div></div>}>
                    <MapPage />
                  </Suspense>
                }
              />
              <Route path="/stations/:stationId" element={<StationDetailPage />} />
              <Route path="/ai" element={<AiHubPage />} />
              <Route path="/alarms" element={<AlarmsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

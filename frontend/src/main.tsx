import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/queryClient';
import './styles.css';

function App() {
  return <main className="shell"><span className="eyebrow">WATER OPERATIONS INTELLIGENCE</span><h1>Control room foundation</h1><p>React 19 shell ready for live telemetry, alarms, stations, reports, and AI insights.</p><div className="grid"><section><strong>API</strong><span>ASP.NET Core 10</span></section><section><strong>Data</strong><span>PostgreSQL + Redis</span></section><section><strong>AI</strong><span>Python service</span></section></div></main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></StrictMode>);

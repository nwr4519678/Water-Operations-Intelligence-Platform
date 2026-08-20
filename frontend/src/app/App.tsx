import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type AppProps = { queryClient: QueryClient };

export function App({ queryClient }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="shell">
        <span className="eyebrow">WATER OPERATIONS INTELLIGENCE</span>
        <h1>Control room foundation</h1>
        <p>React 19 shell ready for live telemetry, alarms, stations, reports, and AI insights.</p>
        <div className="grid">
          <section>
            <strong>API</strong>
            <span>ASP.NET Core 10</span>
          </section>
          <section>
            <strong>Data</strong>
            <span>PostgreSQL + Redis</span>
          </section>
          <section>
            <strong>AI</strong>
            <span>Python service</span>
          </section>
        </div>
      </main>
    </QueryClientProvider>
  );
}

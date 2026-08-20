const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5102';

export const environment = Object.freeze({
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
  signalRUrl: import.meta.env.VITE_SIGNALR_URL ?? `${apiBaseUrl}/hubs/telemetry`,
});

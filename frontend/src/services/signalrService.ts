import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr';
import type { QueryClient } from '@tanstack/react-query';
import { cacheKeys } from './viewerApi';

export type ConnectionState = 'Disconnected' | 'Connecting' | 'Connected' | 'Reconnecting';
export const reconnectDelays = [0, 2_000, 10_000, 30_000];
export function mapLiveEventToCache(queryClient: QueryClient, eventName: 'MeasurementUpdated' | 'AlarmRaised', stationId: string) {
  const detailKey = eventName === 'MeasurementUpdated' ? cacheKeys.measurements(stationId) : cacheKeys.alarms(stationId);
  void queryClient.invalidateQueries({ queryKey: detailKey });
  void queryClient.invalidateQueries({ queryKey: cacheKeys.overview });
}
export function createSignalRService(queryClient: QueryClient, accessToken: () => string | null, hubUrl = `${import.meta.env.VITE_API_BASE_URL ?? ''}/hubs/telemetry`) {
  let state: ConnectionState = 'Disconnected';
  const listeners = new Set<(state: ConnectionState) => void>();
  const connection: HubConnection = new HubConnectionBuilder().withUrl(hubUrl, { accessTokenFactory: () => accessToken() ?? '' }).withAutomaticReconnect(reconnectDelays).configureLogging(LogLevel.Warning).build();
  const setState = (value: ConnectionState) => { state = value; listeners.forEach(listener => listener(state)); };
  connection.onreconnecting(() => setState('Reconnecting')); connection.onreconnected(() => setState('Connected')); connection.onclose(() => setState('Disconnected'));
  connection.on('MeasurementUpdated', (event: { stationId: string }) => mapLiveEventToCache(queryClient, 'MeasurementUpdated', event.stationId));
  connection.on('AlarmRaised', (event: { stationId: string }) => mapLiveEventToCache(queryClient, 'AlarmRaised', event.stationId));
  return { connection, getState: () => state, subscribe: (listener: (value: ConnectionState) => void) => { listeners.add(listener); return () => listeners.delete(listener); }, start: async (organization: string, region: string) => { setState('Connecting'); await connection.start(); await connection.invoke('Subscribe', organization, region); setState('Connected'); }, stop: async () => { await connection.stop(); setState('Disconnected'); } };
}

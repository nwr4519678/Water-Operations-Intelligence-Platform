// src/services/signalr.ts
import * as signalR from '@microsoft/signalr';
import type { TelemetryPointDto } from '../types/api';

export interface AlarmRaisedEvent {
  alarmId: string;
  stationId: string;
  stationName: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  raisedAtUtc: string;
}

export interface AlarmStateChangedEvent {
  alarmId: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  updatedByEmail: string;
  updatedAtUtc: string;
  resolutionNote?: string;
}

export class TelemetrySignalRService {
  private connection: signalR.HubConnection | null = null;
  private isConnected = false;

  async start(accessToken: string): Promise<void> {
    const hubUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://localhost:7048'}/hubs/telemetry`;

    try {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => accessToken,
          transport: signalR.HttpTransportType.WebSockets,
          skipNegotiation: true
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.None)
        .build();

      await this.connection.start();
      this.isConnected = true;
    } catch {
      // Graceful fallback for preview / offline backend
      this.isConnected = false;
    }
  }

  onTelemetryReceived(fn: (data: TelemetryPointDto) => void): void {
    this.connection?.on('TelemetryReceived', fn);
  }

  onAlarmRaised(fn: (data: AlarmRaisedEvent) => void): void {
    this.connection?.on('AlarmRaised', fn);
  }

  onAlarmStateChanged(fn: (data: AlarmStateChangedEvent) => void): void {
    this.connection?.on('AlarmStateChanged', fn);
  }

  off(event: string, fn?: (...args: any[]) => void): void {
    if (fn) {
      this.connection?.off(event, fn);
    } else {
      this.connection?.off(event);
    }
  }

  async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // ignore
      }
      this.connection = null;
      this.isConnected = false;
    }
  }
}

export const signalRService = new TelemetrySignalRService();

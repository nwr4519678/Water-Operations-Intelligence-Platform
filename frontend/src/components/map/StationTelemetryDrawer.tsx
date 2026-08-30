// src/components/map/StationTelemetryDrawer.tsx
// Station detail side panel. English only. No Arabic. No fabricated telemetry values.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WaterStation } from '../../data/stationTypes';
import { STATUS_CSS } from '../../map/mapConstants';
import {
  X, ExternalLink, Activity, Radio, Droplets, Gauge,
  Battery, ShieldCheck, MapPin, Server, Wifi,
} from 'lucide-react';

export interface StationTelemetryDrawerProps {
  station: WaterStation | null;
  isOpen: boolean;
  onClose: () => void;
}

// Telemetry field row — shows "Not available" for all undefined values.
// No demo numbers. No placeholder readings.
function TelemetryRow({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | undefined;
  unit?: string;
}) {
  const isEmpty = value === undefined || value === null;
  return (
    <div className="p-3 rounded-lg border border-slate-200 bg-white shadow-xs">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-sm font-bold font-mono ${isEmpty ? 'text-slate-300' : 'text-slate-800'}`}>
        {isEmpty ? 'Not available' : `${value}${unit ? ' ' + unit : ''}`}
      </div>
    </div>
  );
}

export const StationTelemetryDrawer: React.FC<StationTelemetryDrawerProps> = ({
  station,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  if (!isOpen || !station) return null;

  const css = STATUS_CSS[station.connectionState] ?? STATUS_CSS.unknown;
  const networkLink = station.type === 'main' ? 'Satellite Uplink (Primary VSAT)' : 'GSM / GPRS Telemetry';

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      role="complementary"
      aria-label="Station telemetry panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
            {station.code}
          </span>
          <span className="text-xs font-semibold text-slate-500">{station.typeLabel}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-900">

        {/* Station name + status */}
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-snug">{station.name}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold uppercase ${css.bg} ${css.text} border ${css.ring}`}>
              <span className={`w-2 h-2 rounded-full ${css.dot}`} />
              {station.connectionState}
            </span>
            <span className="text-xs text-slate-400">{station.connectionStatus}</span>
          </div>
        </div>

        {/* Geographic info */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex justify-between items-start">
            <span className="flex items-center gap-1.5 font-semibold text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              Hydrological Region
            </span>
            <span className="font-bold text-slate-800 text-right max-w-[180px]">{station.region}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600 font-mono text-[11px] pt-1.5 border-t border-slate-200/60">
            <span>Coordinates (CSV)</span>
            <span>{station.latitude.toFixed(6)}&deg; N, {station.longitude.toFixed(6)}&deg; E</span>
          </div>
        </div>

        {/* Telemetry slots — all "Not available" until live data arrives */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Telemetry Slots</h3>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Telemetry-Ready
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <TelemetryRow icon={<Droplets className="w-3.5 h-3.5 text-blue-500" />}   label="Water Level"    value={station.telemetrySnapshot?.waterLevel}   unit="m" />
            <TelemetryRow icon={<Activity className="w-3.5 h-3.5 text-emerald-500" />} label="Flow Rate"      value={station.telemetrySnapshot?.flowRate} />
            <TelemetryRow icon={<Gauge className="w-3.5 h-3.5 text-purple-500" />}    label="Line Pressure"  value={station.telemetrySnapshot?.pressure}     unit="bar" />
            <TelemetryRow icon={<ShieldCheck className="w-3.5 h-3.5 text-amber-500" />} label="Water Quality" value={station.telemetrySnapshot?.waterQuality} />
            <TelemetryRow icon={<Battery className="w-3.5 h-3.5 text-slate-400" />}   label="Battery Level"  value={station.telemetrySnapshot?.batteryLevel}  unit="%" />
            <TelemetryRow icon={<Wifi className="w-3.5 h-3.5 text-slate-400" />}      label="Signal"         value={station.telemetrySnapshot?.signalStrength} unit="dBm" />
          </div>
          {station.telemetrySnapshot?.lastUpdateUtc ? (
            <div className="text-[10px] text-slate-400 mt-2 text-right font-mono">
              Last update: {station.telemetrySnapshot.lastUpdateUtc}
            </div>
          ) : (
            <div className="text-[10px] text-slate-300 mt-2 text-center italic">
              Awaiting real-time telemetry feed
            </div>
          )}
        </div>

        {/* Network communications */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-xs">
          <div className="font-bold text-slate-700 flex items-center gap-1.5 mb-1">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            Communication Link
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Transmission Link</span>
            <span className="font-semibold text-slate-800">{networkLink}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Station ID (internal)</span>
            <span className="font-mono text-[11px] text-slate-700">{station.id}</span>
          </div>
        </div>

        {/* Future network layer stub */}
        <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100 text-xs">
          <div className="font-bold text-blue-700 flex items-center gap-1.5 mb-1">
            <Server className="w-3.5 h-3.5" />
            Network Topology
          </div>
          <p className="text-blue-600">
            Pipeline and canal network geometry not yet available.
            This slot will display network connections when GeoJSON topology is provided.
          </p>
        </div>
      </div>

      {/* Footer action */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <button
          type="button"
          onClick={() => navigate(`/stations/${station.id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow transition-colors cursor-pointer"
        >
          <span>Open Full Station Analytics</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

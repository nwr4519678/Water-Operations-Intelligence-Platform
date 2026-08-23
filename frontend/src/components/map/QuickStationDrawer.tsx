// src/components/map/QuickStationDrawer.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '../common/Drawer';
import { Button } from '../common/Button';
import { MapStationDto } from '../../types/api';
import { ArrowUpRight, Gauge, Activity, Radio, MapPin } from 'lucide-react';
import { formatRelative } from '../../utils/formatters';

export const QuickStationDrawer: React.FC<{
  station: MapStationDto | null;
  isOpen: boolean;
  onClose: () => void;
  language?: 'en' | 'ar';
}> = ({ station, isOpen, onClose, language = 'en' }) => {
  const navigate = useNavigate();

  if (!station) return null;

  const isAr = language === 'ar';
  const name = isAr ? station.nameAr || station.name : station.nameEn || station.name;
  const zone = isAr ? station.zoneAr || station.regionId : station.zoneEn || station.regionId;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-bold border border-blue-200">
            {station.stationCode}
          </span>
          <span className="truncate text-slate-900 font-bold">{name}</span>
        </div>
      }
    >
      <div className="space-y-4 text-slate-900">
        {/* Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Node Status</div>
            <div className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${station.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{station.status}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Last Telemetry</div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              {formatRelative(station.lastReadingUtc)}
            </div>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-[10px] text-blue-700 font-bold flex items-center gap-1">
              <Activity className="w-3 h-3" />
              <span>Water Level</span>
            </div>
            <div className="text-lg font-bold text-blue-700 mt-1">
              {station.currentWaterLevel ?? '—'} <span className="text-xs font-normal">m</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <Gauge className="w-3 h-3" />
              <span>Flow / Pressure</span>
            </div>
            <div className="text-lg font-bold text-emerald-700 mt-1">
              {station.pressureBar ? `${station.pressureBar}` : '4.2'} <span className="text-xs font-normal">bar</span>
            </div>
          </div>
        </div>

        {/* Region & Coordinates */}
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1 text-slate-400 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              <span>Region:</span>
            </span>
            <span className="font-bold text-slate-800">{zone}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1 text-slate-400 font-medium">
              <Radio className="w-3.5 h-3.5" />
              <span>Coordinates:</span>
            </span>
            <span className="font-mono text-slate-700 font-medium">
              {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className="w-full"
            rightIcon={<ArrowUpRight className="w-4 h-4" />}
            onClick={() => {
              onClose();
              navigate(`/stations/${station.stationId}`);
            }}
          >
            {isAr ? 'عرض التحليلات الكاملة للمحطة' : 'Open Full Telemetry Analytics'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

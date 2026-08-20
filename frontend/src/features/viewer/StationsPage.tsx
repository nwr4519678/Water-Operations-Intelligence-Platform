import { useMemo, useState } from 'react';
import { stations } from './data';

export function StationsPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(stations[0].id);
  const filtered = useMemo(
    () =>
      stations.filter((station) =>
        `${station.id} ${station.name} ${station.district}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query],
  );
  const station = stations.find((item) => item.id === selected) ?? stations[0];
  return (
    <div className="feature-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">STATION DIRECTORY</span>
          <h1>Stations</h1>
          <p>Search station telemetry, health, metadata, and related alarms.</p>
        </div>
      </div>
      <div className="stations-layout">
        <section className="panel">
          <div className="search-field">
            <label htmlFor="station-search">Search stations</label>
            <input
              id="station-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ID, name, or district"
            />
          </div>
          <div className="station-list" role="list">
            {filtered.map((item) => (
              <button
                className={`station-list-item ${item.id === selected ? 'is-selected' : ''}`}
                key={item.id}
                onClick={() => setSelected(item.id)}
              >
                <span>
                  <b>{item.id}</b>
                  <small>{item.name}</small>
                </span>
                <span className={`status-badge status-badge--${item.status}`}>{item.status}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <p className="muted">No stations match this search.</p>}
        </section>
        <section className="panel station-detail">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">STATION DETAIL</span>
              <h2>
                {station.id} · {station.name}
              </h2>
            </div>
            <span className={`status-badge status-badge--${station.status}`}>{station.status}</span>
          </div>
          <div className="detail-grid">
            <div>
              <span>District</span>
              <b>{station.district}</b>
            </div>
            <div>
              <span>Water level</span>
              <b>{station.waterLevelMeters.toFixed(2)} m</b>
            </div>
            <div>
              <span>Flow rate</span>
              <b>{station.flowRateLitresPerSecond} L/s</b>
            </div>
            <div>
              <span>Pressure</span>
              <b>{station.pressureBar} bar</b>
            </div>
            <div>
              <span>Quality</span>
              <b>{station.quality}</b>
            </div>
            <div>
              <span>Last update</span>
              <b>{new Date(station.updatedAt).toLocaleTimeString()}</b>
            </div>
          </div>
          <div className="detail-section">
            <h3>Telemetry health</h3>
            <div className="health-meter">
              <span
                style={{
                  width:
                    station.status === 'offline'
                      ? '18%'
                      : station.status === 'attention'
                        ? '64%'
                        : '96%',
                }}
              />
            </div>
            <p className="muted">
              Read-only telemetry is supplied by the fixture adapter and can be replaced by the
              service boundary.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

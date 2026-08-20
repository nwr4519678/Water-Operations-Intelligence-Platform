import { useState } from "react";
import {
    alarms,
    insights,
    stations,
} from "../mocks/viewerFixtures";
import type { Station } from "../types/viewer";
import {
    AlarmRow,
    Button,
    Card,
    Icon,
    InsightStateCard,
    KpiCard,
    MiniChart,
    PageHeader,
    StatusBadge,
} from "../components/ui";

export function OverviewPage({
    onStationSelect,
}: {
    onStationSelect: (station: Station) => void;
}) {
    const [range, setRange] = useState("7 days");
    const [selected, setSelected] = useState<Station | null>(null);
    return (
        <>
            <PageHeader
                title="Overview"
                subtitle="Network performance at a glance"
            >
                <select
                    aria-label="Time range"
                    value={range}
                    onChange={(event) => setRange(event.target.value)}
                >
                    <option>24 hours</option>
                    <option>7 days</option>
                    <option>30 days</option>
                </select>
                <Button variant="primary">
                    <Icon name="arrow" />
                    Export snapshot
                </Button>
            </PageHeader>
            <div className="kpi-grid">
                <KpiCard
                    label="Total Stations"
                    value="24"
                    detail="Across 5 districts"
                    tone="blue"
                    icon="⌖"
                />
                <KpiCard
                    label="Active Stations"
                    value="21"
                    detail="87.5% online"
                    tone="green"
                    icon="◉"
                />
                <KpiCard
                    label="Average Water Level"
                    value="2.45 m"
                    detail="+0.15 m today"
                    tone="cyan"
                    icon="≋"
                />
                <KpiCard
                    label="Total Flow Rate"
                    value="248.6 m³/h"
                    detail="+4.8% vs yesterday"
                    tone="purple"
                    icon="↗"
                />
                <KpiCard
                    label="Water Quality"
                    value="92 / 100"
                    detail="Good · verified"
                    tone="teal"
                    icon="✓"
                />
                <KpiCard
                    label="Active Alarms"
                    value="3"
                    detail="1 critical · 1 warning"
                    tone="amber"
                    icon="!"
                />
            </div>
            <div className="dashboard-grid dashboard-grid--top">
                <Card
                    title="Network status"
                    eyebrow="LIVE OVERVIEW"
                    action={
                        <span className="card-meta">Updated 2 min ago</span>
                    }
                >
                    <div className="map-panel">
                        <div className="map-toolbar">
                            <span className="map-label">
                                River basin network
                            </span>
                            <div>
                                <button className="layer-chip layer-chip--active">
                                    Stations
                                </button>
                                <button className="layer-chip">
                                    Pipelines
                                </button>
                                <button className="layer-chip">
                                    Reservoirs
                                </button>
                            </div>
                        </div>
                        <div
                            className="map-canvas"
                            aria-label="Station network map"
                        >
                            <div className="map-river" />
                            {stations.map((station) => (
                                <button
                                    key={station.id}
                                    className={`map-marker map-marker--${station.status}`}
                                    style={{
                                        left: `${station.x}%`,
                                        top: `${station.y}%`,
                                    }}
                                    aria-label={`${station.name}, ${station.status}`}
                                    onClick={() => {
                                        setSelected(station);
                                    }}
                                >
                                    <i />
                                    <span>{station.name}</span>
                                </button>
                            ))}
                            {selected && (
                                <div className="station-popover">
                                    <button
                                        className="popover-close"
                                        onClick={() => setSelected(null)}
                                        aria-label="Close station details"
                                    >
                                        ×
                                    </button>
                                    <StatusBadge status={selected.status} />
                                    <strong>{selected.name}</strong>
                                    <span>{selected.district}</span>
                                    <div>
                                        <b>{selected.level} m</b>
                                        <small>Level</small>
                                        <b>{selected.flow} m³/h</b>
                                        <small>Flow</small>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() =>
                                            onStationSelect(selected)
                                        }
                                    >
                                        Open details
                                    </Button>
                                </div>
                            )}
                            <div className="map-legend">
                                <span>
                                    <i className="legend-dot legend-dot--healthy" />
                                    Healthy
                                </span>
                                <span>
                                    <i className="legend-dot legend-dot--attention" />
                                    Attention
                                </span>
                                <span>
                                    <i className="legend-dot legend-dot--offline" />
                                    Offline
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>
                <Card
                    title="Alarm summary"
                    eyebrow="ATTENTION REQUIRED"
                    action={<a href="/alarms">View all</a>}
                >
                    <div className="alarm-summary">
                        <div className="alarm-counts">
                            <strong className="alarm-counts__critical">
                                1
                            </strong>
                            <span>Critical</span>
                            <strong className="alarm-counts__warning">1</strong>
                            <span>Warning</span>
                            <strong className="alarm-counts__info">1</strong>
                            <span>Info</span>
                        </div>
                        {alarms.map((alarm) => (
                            <AlarmRow key={alarm.id} alarm={alarm} />
                        ))}
                    </div>
                </Card>
            </div>
            <div className="dashboard-grid dashboard-grid--bottom">
                <Card
                    title="Water level trend"
                    eyebrow="TELEMETRY"
                    action={
                        <select aria-label="Trend parameter">
                            <option>Water level</option>
                            <option>Flow rate</option>
                        </select>
                    }
                >
                    <MiniChart />
                    <div className="chart-footer">
                        <span>
                            <i className="legend-line" />
                            Observed
                        </span>
                        <span>Range: {range}</span>
                        <strong>
                            2.45 m <small>current</small>
                        </strong>
                    </div>
                </Card>
                <Card
                    title="AI risk overview"
                    eyebrow="ANALYTICS"
                    action={<span className="confidence">92% confidence</span>}
                >
                    <InsightStateCard state={insights[0].state}>
                        <div className="insight-card">
                            <div className="insight-orb">✦</div>
                            <div>
                                <strong>{insights[0].title}</strong>
                                <p>{insights[0].body}</p>
                                <span>{insights[0].source}</span>
                            </div>
                        </div>
                    </InsightStateCard>
                </Card>
            </div>
            <div className="dashboard-grid dashboard-grid--bottom">
                <Card
                    title="Real-time measurements"
                    eyebrow="LATEST READINGS"
                    action={<a href="/stations">View stations</a>}
                >
                    <div className="table-wrap">
                        <table>
                            <caption className="sr-only">
                                Latest station measurements
                            </caption>
                            <thead>
                                <tr>
                                    <th>Station</th>
                                    <th>Status</th>
                                    <th>Level</th>
                                    <th>Flow</th>
                                    <th>Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stations.slice(0, 4).map((station) => (
                                    <tr key={station.id}>
                                        <td>
                                            <strong>{station.name}</strong>
                                            <span>{station.district}</span>
                                        </td>
                                        <td>
                                            <StatusBadge
                                                status={station.status}
                                            />
                                        </td>
                                        <td>
                                            {station.level
                                                ? `${station.level} m`
                                                : "—"}
                                        </td>
                                        <td>
                                            {station.flow
                                                ? `${station.flow} m³/h`
                                                : "—"}
                                        </td>
                                        <td>{station.updated}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="AI forecast" eyebrow="NEXT 24 HOURS">
                    <MiniChart forecast />
                    <div className="forecast-note">
                        <span className="confidence">Stable trend</span>
                        <p>
                            Expected water level remains within normal operating
                            range.
                        </p>
                    </div>
                </Card>
            </div>
            <div className="bottom-strip">
                <div>
                    <Icon name="bell" />
                    <strong>System notifications</strong>
                    <span>
                        All telemetry pipelines are healthy. Last sync completed
                        2 minutes ago.
                    </span>
                </div>
                <div>
                    <span className="weather-icon">☼</span>
                    <strong>28° C</strong>
                    <span>Clear · North District</span>
                </div>
            </div>
        </>
    );
}

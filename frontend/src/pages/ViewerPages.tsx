import { useState } from "react";
import { alarms, insights, reports, stations } from "../mocks/viewerFixtures";
import type { Station } from "../types/viewer";
import {
    AlarmRow,
    Button,
    Card,
    InsightStateCard,
    MiniChart,
    PageHeader,
    StateMessage,
    StatusBadge,
} from "../components/ui";

export function StationsPage({
    onStationSelect,
}: {
    onStationSelect: (station: Station) => void;
}) {
    const [filter, setFilter] = useState("all");
    const filtered = stations.filter(
        (station) => filter === "all" || station.status === filter,
    );
    return (
        <>
            <PageHeader
                title="Map & Stations"
                subtitle="Inspect the live status of every viewer station"
            >
                <select
                    aria-label="Station status filter"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                >
                    <option value="all">All statuses</option>
                    <option value="healthy">Healthy</option>
                    <option value="attention">Attention</option>
                    <option value="offline">Offline</option>
                </select>
            </PageHeader>
            <div className="station-layout">
                <Card title="Station network" eyebrow="MAP VIEW">
                    <div className="map-canvas map-canvas--large">
                        <div className="map-river" />
                        {stations.map((station) => (
                            <button
                                key={station.id}
                                className={`map-marker map-marker--${station.status}`}
                                style={{
                                    left: `${station.x}%`,
                                    top: `${station.y}%`,
                                }}
                                onClick={() => onStationSelect(station)}
                            >
                                <i />
                                <span>{station.name}</span>
                            </button>
                        ))}
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
                </Card>
                <Card
                    title="Station list"
                    eyebrow={`${filtered.length} RESULTS`}
                >
                    <div className="station-list">
                        {filtered.length === 0 ? (
                            <StateMessage type="empty" />
                        ) : (
                            filtered.map((station) => (
                                <button
                                    className="station-list-row"
                                    key={station.id}
                                    onClick={() => onStationSelect(station)}
                                >
                                    <span
                                        className={`station-avatar station-avatar--${station.status}`}
                                    >
                                        ⌖
                                    </span>
                                    <span>
                                        <strong>{station.name}</strong>
                                        <small>{station.district}</small>
                                    </span>
                                    <StatusBadge status={station.status} />
                                    <small>{station.updated}</small>
                                </button>
                            ))
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
}
export function StationDetailPage({
    station,
    onBack,
}: {
    station: Station;
    onBack: () => void;
}) {
    return (
        <>
            <div className="breadcrumbs">
                <button onClick={onBack}>← Map & Stations</button>
                <span>/</span>
                <strong>{station.name}</strong>
            </div>
            <PageHeader
                title={station.name}
                subtitle={`${station.district} · Read-only telemetry`}
            >
                <StatusBadge status={station.status} />
            </PageHeader>
            <div className="detail-tabs">
                <button className="detail-tab detail-tab--active">
                    Overview
                </button>
                <button className="detail-tab">Telemetry</button>
                <button className="detail-tab">Reports</button>
            </div>
            <div className="dashboard-grid dashboard-grid--bottom">
                <Card title="Telemetry trend" eyebrow="LAST 24 HOURS">
                    <MiniChart />
                    <div className="chart-footer">
                        <span>
                            Data quality: <b className="text-green">Observed</b>
                        </span>
                        <strong>
                            {station.level} m <small>current level</small>
                        </strong>
                    </div>
                </Card>
                <Card title="Station summary" eyebrow="CURRENT STATUS">
                    <div className="detail-stat-grid">
                        <div>
                            <span>Flow rate</span>
                            <strong>{station.flow} m³/h</strong>
                        </div>
                        <div>
                            <span>Water quality</span>
                            <strong>{station.quality || "—"} / 100</strong>
                        </div>
                        <div>
                            <span>Last updated</span>
                            <strong>{station.updated}</strong>
                        </div>
                        <div>
                            <span>Threshold display</span>
                            <strong>Within range</strong>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}
export function AlarmsPage() {
    const [severity, setSeverity] = useState("all");
    const filtered = alarms.filter(
        (alarm) => severity === "all" || alarm.severity === severity,
    );
    return (
        <>
            <PageHeader
                title="Alarms"
                subtitle="Monitor operational events without mutation actions"
            >
                <select
                    aria-label="Alarm severity filter"
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value)}
                >
                    <option value="all">All severities</option>
                    <option value="critical">Critical</option>
                    <option value="warning">Warning</option>
                    <option value="info">Info</option>
                </select>
            </PageHeader>
            <Card title="Open alarms" eyebrow={`${filtered.length} EVENTS`}>
                <div className="alarm-list">
                    {filtered.length ? (
                        filtered.map((alarm) => (
                            <div className="alarm-detail-row" key={alarm.id}>
                                <AlarmRow alarm={alarm} />
                                <div className="alarm-context">
                                    <span>State</span>
                                    <strong>{alarm.state}</strong>
                                    <span>Station</span>
                                    <strong>{alarm.station}</strong>
                                    <Button>View details</Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <StateMessage type="empty" />
                    )}
                </div>
            </Card>
        </>
    );
}
export function ReportsPage() {
    return (
        <>
            <PageHeader
                title="Reports"
                subtitle="Read-only operational reports and data provenance"
            >
                <Button variant="secondary">Filter reports</Button>
            </PageHeader>
            <Card title="Report history" eyebrow={`${reports.length} REPORTS`}>
                <div className="report-list">
                    {reports.map((report) => (
                        <article className="report-row" key={report.id}>
                            <div className="report-icon">▤</div>
                            <div>
                                <strong>{report.title}</strong>
                                <span>
                                    {report.period} · {report.scope}
                                </span>
                            </div>
                            <span className="report-status">
                                {report.status}
                            </span>
                            <time>{report.generated}</time>
                            <Button>Read report</Button>
                        </article>
                    ))}
                </div>
            </Card>
        </>
    );
}
export function InsightsPage() {
    const [showUnavailable, setShowUnavailable] = useState(false);
    return (
        <>
            <PageHeader
                title="AI Insights"
                subtitle="Contextual explanations for viewer telemetry"
            >
                <Button onClick={() => setShowUnavailable((value) => !value)}>
                    {showUnavailable
                        ? "Show available"
                        : "Simulate unavailable"}
                </Button>
            </PageHeader>
            <div className="insight-grid">
                {showUnavailable ? (
                    <Card title="Current insight" eyebrow="AI STATUS">
                        <InsightStateCard state="unavailable" />
                    </Card>
                ) : (
                    insights.map((insight) => (
                        <Card
                            key={insight.id}
                            title={insight.title}
                            eyebrow="INSIGHT"
                        >
                            <InsightStateCard state={insight.state}>
                                <div className="insight-card">
                                    <div className="insight-orb">✦</div>
                                    <div>
                                        <p>{insight.body}</p>
                                        <span>{insight.source}</span>
                                        {insight.confidence > 0 && (
                                            <div className="confidence-bar">
                                                <i
                                                    style={{
                                                        width: `${insight.confidence}%`,
                                                    }}
                                                />
                                                <span>
                                                    {insight.confidence}%
                                                    confidence
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </InsightStateCard>
                        </Card>
                    ))
                )}
            </div>
        </>
    );
}

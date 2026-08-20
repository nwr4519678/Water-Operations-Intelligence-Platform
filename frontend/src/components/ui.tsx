import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Alarm, InsightState, StationStatus } from "../types/viewer";

export function Icon({ name }: { name: string }) {
    const paths: Record<string, string> = {
        grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
        map: "M3 6l6-3 6 3 6-3v14l-6 3-6-3-6 3zM9 3v14M15 6v14",
        bell: "M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
        search: "M11 19a8 8 0 110-16 8 8 0 010 16zm6-2 4 4",
        sun: "M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4M16 12a4 4 0 11-8 0 4 4 0 018 0",
        moon: "M20 15.5A8.5 8.5 0 019.5 5 8.5 8.5 0 1020 15.5",
        menu: "M4 6h16M4 12h16M4 18h16",
        chevron: "M7 10l5 5 5-5",
        arrow: "M5 12h14M13 6l6 6-6 6",
    };
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="icon">
            <path d={paths[name] || paths.grid} />
        </svg>
    );
}
export function Button({
    children,
    variant = "secondary",
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
}) {
    return (
        <button className={`button button--${variant}`} {...props}>
            {children}
        </button>
    );
}
export function StatusBadge({ status }: { status: StationStatus }) {
    return (
        <span className={`status status--${status}`}>
            <i />
            {status === "healthy"
                ? "Healthy"
                : status === "attention"
                  ? "Attention"
                  : status === "critical"
                    ? "Critical"
                    : "Offline"}
        </span>
    );
}
export function SeverityBadge({ severity }: { severity: Alarm["severity"] }) {
    return <span className={`severity severity--${severity}`}>{severity}</span>;
}
export function Card({
    title,
    eyebrow,
    action,
    children,
    className = "",
}: {
    title: string;
    eyebrow?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`card ${className}`}>
            <header className="card__header">
                <div>
                    {eyebrow && <span className="eyebrow">{eyebrow}</span>}
                    <h2>{title}</h2>
                </div>
                {action}
            </header>
            {children}
        </section>
    );
}
export function PageHeader({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children?: ReactNode;
}) {
    return (
        <div className="page-header">
            <div>
                <span className="eyebrow">WATER OPERATIONS / VIEWER</span>
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            <div className="page-header__actions">{children}</div>
        </div>
    );
}
export function StateMessage({
    type,
    onRetry,
}: {
    type: "loading" | "empty" | "error" | "stale";
    onRetry?: () => void;
}) {
    const messages = {
        loading: "Loading operational data…",
        empty: "No data matches the current filters.",
        error: "We could not load this data. Try again.",
        stale: "Showing the last available data. It may be stale.",
    };
    return (
        <div
            className={`state state--${type}`}
            aria-live="polite"
            aria-busy={type === "loading"}
        >
            <strong>{messages[type]}</strong>
            {type === "error" && onRetry && (
                <Button onClick={onRetry}>Retry</Button>
            )}
        </div>
    );
}
export function KpiCard({
    label,
    value,
    detail,
    tone,
    icon,
}: {
    label: string;
    value: string;
    detail: string;
    tone: string;
    icon: string;
}) {
    return (
        <article className="kpi-card">
            <div className={`kpi-icon kpi-icon--${tone}`}>{icon}</div>
            <div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{detail}</small>
            </div>
        </article>
    );
}
export function MiniChart({ forecast = false }: { forecast?: boolean }) {
    const points = forecast
        ? "0,88 20,78 42,82 64,58 86,64 108,42 130,52 152,28 174,34 196,18 218,24 240,10"
        : "0,78 20,68 42,72 64,48 86,55 108,35 130,43 152,22 174,28 196,12 218,21 240,7";
    return (
        <div
            className="chart"
            role="img"
            aria-label={
                forecast
                    ? "AI forecast chart showing increasing water level"
                    : "Water level trend chart showing increasing water level"
            }
        >
            <svg viewBox="0 0 240 100" preserveAspectRatio="none">
                <defs>
                    <linearGradient
                        id={forecast ? "forecast-fill" : "trend-fill"}
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                    >
                        <stop
                            offset="0"
                            stopColor={forecast ? "#9d7bea" : "#3f9df5"}
                            stopOpacity=".3"
                        />
                        <stop
                            offset="1"
                            stopColor={forecast ? "#9d7bea" : "#3f9df5"}
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>
                <polygon
                    points={`${points} 240,100 0,100`}
                    fill={`url(#${forecast ? "forecast-fill" : "trend-fill"})`}
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke={forecast ? "#9d7bea" : "#3f9df5"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="chart-labels">
                <span>00:00</span>
                <span>08:00</span>
                <span>16:00</span>
                <span>Now</span>
            </div>
        </div>
    );
}
export function AlarmRow({ alarm }: { alarm: Alarm }) {
    return (
        <div className="alarm-row">
            <SeverityBadge severity={alarm.severity} />
            <div>
                <strong>{alarm.station}</strong>
                <span>{alarm.message}</span>
            </div>
            <time>{alarm.time}</time>
        </div>
    );
}
export function InsightStateCard({
    state,
    children,
}: {
    state: InsightState;
    children?: ReactNode;
}) {
    if (state === "unavailable")
        return (
            <div className="insight-state">
                <strong>AI insights are temporarily unavailable.</strong>
                <span>Core telemetry remains available.</span>
            </div>
        );
    if (state === "empty")
        return (
            <div className="insight-state">
                <strong>No insight available.</strong>
                <span>This period has no usable observations.</span>
            </div>
        );
    if (state === "error")
        return (
            <div className="insight-state">
                <strong>We couldn’t load this insight.</strong>
                <Button>Try again</Button>
            </div>
        );
    return <>{children}</>;
}

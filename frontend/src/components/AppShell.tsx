import { NavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { copy } from "../shared/i18n";
import type { Locale } from "../types/viewer";
import { Button, Icon } from "./ui";

const nav = [
    { path: "/", key: "overview", icon: "grid" },
    { path: "/stations", key: "map", icon: "map" },
    { path: "/alarms", key: "alarms", icon: "bell" },
    { path: "/reports", key: "reports", icon: "reports" },
    { path: "/insights", key: "insights", icon: "spark" },
];
export function AppShell({
    children,
    locale,
    theme,
    onLocaleChange,
    onThemeChange,
    navOpen,
    onNavToggle,
}: {
    children: ReactNode;
    locale: Locale;
    theme: "dark" | "light";
    onLocaleChange: () => void;
    onThemeChange: () => void;
    navOpen: boolean;
    onNavToggle: () => void;
}) {
    const location = useLocation();
    const t = copy[locale];
    const title =
        nav.find((item) => item.path === location.pathname)?.key || "overview";
    return (
        <div className={`app-shell ${navOpen ? "app-shell--nav-open" : ""}`}>
            <div className="mobile-scrim" onClick={onNavToggle} />
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-mark">≋</span>
                    <span>
                        <strong>WaterTelemetry</strong>
                        <small>Operations viewer</small>
                    </span>
                </div>
                <nav aria-label="Viewer navigation">
                    {nav.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === "/"}
                            onClick={() =>
                                window.innerWidth < 1024 && onNavToggle()
                            }
                        >
                            <Icon name={item.icon} />
                            <span>{t[item.key]}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <span className="connection-dot" />
                    {t.live}
                    <small>{t.readOnly}</small>
                </div>
            </aside>
            <main className="app-main">
                <header className="topbar">
                    <Button
                        variant="ghost"
                        className="menu-button"
                        aria-label="Open navigation"
                        onClick={onNavToggle}
                    >
                        <Icon name="menu" />
                    </Button>
                    <div className="topbar-title">
                        <strong>{t[title]}</strong>
                        <span>{t.subtitle}</span>
                    </div>
                    <div className="topbar-tools">
                        <label className="search">
                            <Icon name="search" />
                            <input aria-label="Search" placeholder={t.search} />
                        </label>
                        <button
                            className="icon-button"
                            aria-label="Notifications"
                        >
                            <Icon name="bell" />
                            <b>3</b>
                        </button>
                        <Button
                            variant="ghost"
                            aria-label="Toggle theme"
                            onClick={onThemeChange}
                        >
                            <Icon name={theme === "dark" ? "sun" : "moon"} />
                        </Button>
                        <button
                            className="locale-button"
                            onClick={onLocaleChange}
                        >
                            {locale === "en" ? "عربي" : "English"}
                        </button>
                        <div className="avatar">MA</div>
                    </div>
                </header>
                <div className="offline-banner">
                    <span className="connection-dot" />
                    {t.live} · All systems receiving data
                </div>
                <div className="content">{children}</div>
            </main>
        </div>
    );
}

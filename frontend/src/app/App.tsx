import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useNavigate,
} from "react-router-dom";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { OverviewPage } from "../pages/OverviewPage";
import {
    AlarmsPage,
    InsightsPage,
    ReportsPage,
    StationDetailPage,
    StationsPage,
} from "../pages/ViewerPages";
import { useViewerPreferences } from "../stores/viewerStore";
import type { Station } from "../types/viewer";

function ViewerRouter() {
    const preferences = useViewerPreferences();
    const [selectedStation, setSelectedStation] = useState<Station | null>(
        null,
    );
    const navigate = useNavigate();
    const openStation = (station: Station) => {
        setSelectedStation(station);
        navigate(`/stations/${station.id}`);
    };
    return (
        <AppShell
            {...preferences}
            onLocaleChange={() =>
                preferences.setLocale(preferences.locale === "en" ? "ar" : "en")
            }
            onThemeChange={() =>
                preferences.setTheme(
                    preferences.theme === "dark" ? "light" : "dark",
                )
            }
            onNavToggle={() => preferences.setNavOpen((value) => !value)}
        >
            <Routes>
                <Route
                    path="/"
                    element={<OverviewPage onStationSelect={openStation} />}
                />
                <Route
                    path="/stations"
                    element={<StationsPage onStationSelect={openStation} />}
                />
                <Route
                    path="/stations/:stationId"
                    element={
                        selectedStation ? (
                            <StationDetailPage
                                station={selectedStation}
                                onBack={() => navigate("/stations")}
                            />
                        ) : (
                            <Navigate to="/stations" replace />
                        )
                    }
                />
                <Route path="/alarms" element={<AlarmsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/insights" element={<InsightsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AppShell>
    );
}

export function App() {
    return (
        <BrowserRouter>
            <ViewerRouter />
        </BrowserRouter>
    );
}

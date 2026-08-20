import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("viewer dashboard", () => {
    it("renders the viewer-only navigation and overview KPIs", () => {
        render(<App />);
        const nav = screen.getByRole("navigation", {
            name: "Viewer navigation",
        });
        expect(within(nav).getByText("Overview")).toBeInTheDocument();
        expect(within(nav).getByText("Map & Stations")).toBeInTheDocument();
        expect(within(nav).getByText("AI Insights")).toBeInTheDocument();
        expect(within(nav).queryByText("Maintenance")).not.toBeInTheDocument();
        expect(screen.getByText("Total Stations")).toBeInTheDocument();
        expect(screen.getByText("248.6 m³/h")).toBeInTheDocument();
    });

    it("navigates to every viewer page", () => {
        render(<App />);
        fireEvent.click(screen.getByRole("link", { name: /Alarms/ }));
        expect(
            screen.getByRole("heading", { name: "Alarms", level: 1 }),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("link", { name: /Reports/ }));
        expect(
            screen.getByRole("heading", { name: "Reports", level: 1 }),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("link", { name: /AI Insights/ }));
        expect(
            screen.getByRole("heading", { name: "AI Insights", level: 1 }),
        ).toBeInTheDocument();
    });

    it("switches theme and Arabic RTL mode", () => {
        render(<App />);
        fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));
        expect(document.documentElement).toHaveAttribute("data-theme", "light");
        fireEvent.click(screen.getByRole("button", { name: "عربي" }));
        expect(document.documentElement).toHaveAttribute("dir", "rtl");
        expect(screen.getAllByText("نظرة عامة").length).toBeGreaterThan(0);
    });

    it("selects a station and opens its read-only detail", () => {
        render(<App />);
        fireEvent.click(
            screen.getByRole("button", { name: "North Intake, healthy" }),
        );
        fireEvent.click(screen.getByRole("button", { name: "Open details" }));
        expect(
            screen.getByRole("heading", { name: "North Intake", level: 1 }),
        ).toBeInTheDocument();
        expect(screen.getByText(/Read-only telemetry/)).toBeInTheDocument();
    });

    it("renders empty alarm filters and independent AI failure state", () => {
        render(<App />);
        fireEvent.click(screen.getByRole("link", { name: /Alarms/ }));
        fireEvent.change(screen.getByLabelText("Alarm severity filter"), {
            target: { value: "critical" },
        });
        expect(
            screen.getByText("Pressure above operating threshold"),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole("link", { name: /AI Insights/ }));
        fireEvent.click(
            screen.getByRole("button", { name: "Simulate unavailable" }),
        );
        expect(
            screen.getByText("AI insights are temporarily unavailable."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Core telemetry remains available."),
        ).toBeInTheDocument();
    });
});

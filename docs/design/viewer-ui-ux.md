# Viewer UI/UX reference

This reference defines the viewer-only experience for the Water Operations Intelligence Platform. It is intentionally read-only: viewers can inspect telemetry, alarms, reports, and AI explanations, but cannot edit stations, acknowledge alarms, change thresholds, or administer users.

## Information architecture

```text
Session
├── Login
└── Session expired → Login

Viewer shell
├── Overview
├── Map & stations
│   ├── Station list
│   └── Station detail
├── Alarms
│   └── Alarm detail
├── Reports
│   └── Report detail
└── AI insights (contextual cards on Overview, Station detail, and Reports)
```

The shell uses a persistent header with the product mark, current page title, language switcher, connection state, and viewer identity. Desktop uses a left navigation rail; tablet uses a collapsible drawer. There is no admin or operator navigation item.

## Navigation behavior

| Destination | Entry point | Back behavior | Viewer actions |
| --- | --- | --- | --- |
| Overview | Default route after login | N/A | Filter time range; open linked station, alarm, report, or insight |
| Map & stations | Primary navigation | Returns to previous map/list context | Pan/zoom map; filter station status; open station |
| Station detail | Map marker or station row | Returns to map/list with filters preserved | Change time range and parameter; inspect read-only telemetry |
| Alarms | Primary navigation or overview card | Returns to filtered list | Filter and open alarm; no acknowledge/edit action |
| Alarm detail | Alarm row or overview card | Returns to alarm list | Read event, station, severity, timeline, and related report |
| Reports | Primary navigation or overview card | Returns to report history | Filter and open report; download only when permitted by product policy |
| Report detail | Report row | Returns to history with filters preserved | Read report and source period; open related station |

## Annotated wireframes

### Login and session expired

```text
┌──────────────────────────────────────────────────────────────┐
│ [water mark] Water Operations                                │
│                                                              │
│                  ┌──────────────────────────┐                │
│                  │ Sign in                  │                │
│                  │ Email                    │                │
│                  │ [____________________]   │                │
│                  │ Password                 │                │
│                  │ [____________________]   │                │
│                  │ [ Sign in ]              │                │
│                  │ English | العربية        │                │
│                  └──────────────────────────┘                │
│ Secure read-only access to water operations data.            │
└──────────────────────────────────────────────────────────────┘
```

Session expiry keeps the current route in a safe return state, shows “Your session expired. Sign in again to continue,” and never silently discards unsent viewer filters.

### Overview dashboard

```text
┌──────┬────────────────────────────────────────────────────────┐
│ NAV  │ Overview                 [7 days ▾] [English ▾] [● Live]│
│      ├────────────────────────────────────────────────────────┤
│ Home │ [ 24 stations ] [ 21 healthy ] [ 2 attention ] [ 1 off ]│
│ Map  │                                                        │
│ Alarms│ ┌──────────────────────┐ ┌───────────────────────────┐ │
│ Reports││ Station status map   │ │ Alarm summary             │ │
│      │ │ legend + last update │ │ severity + count + link  │ │
│      │ └──────────────────────┘ └───────────────────────────┘ │
│      │ ┌──────────────────────┐ ┌───────────────────────────┐ │
│      │ │ Telemetry trend      │ │ AI insight                 │ │
│      │ │ range/parameter      │ │ confidence + provenance   │ │
│      │ └──────────────────────┘ └───────────────────────────┘ │
└──────┴────────────────────────────────────────────────────────┘
```

Every card has a visible title, timestamp, data-quality label, and text alternative. KPI cards expose the underlying station count rather than relying on color or icons alone.

### Map and station status

```text
┌──────┬────────────────────────────────────────────────────────┐
│ NAV  │ Map & stations          [All statuses ▾] [Search ____]  │
│      ├──────────────────────────────┬─────────────────────────┤
│      │ Map                           │ Station list             │
│      │ [shape + text status markers]│ Name | status | update  │
│      │ [zoom] [legend]               │ North Intake | Healthy  │
│      │                               │ East Pump | Attention   │
│      │                               │ [Open station]           │
└──────┴──────────────────────────────┴─────────────────────────┘
```

Map markers have a shape, text label, and accessible list equivalent. A marker click opens station detail; map movement never changes the selected station without an explicit click.

### Station detail and charts

```text
┌──────────────────────────────────────────────────────────────┐
│ ← Map & stations   North Intake       [Healthy · updated 2m] │
├──────────────────────────────────────────────────────────────┤
│ [Overview] [Telemetry] [Reports]                             │
│ Time range [24h ▾]  Parameter [Flow ▾]  Threshold [Show ▾]   │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ chart + threshold line + keyboard-readable data table    │  │
│ └──────────────────────────────────────────────────────────┘  │
│ Data quality: ● Observed  ◐ Estimated  ▣ Missing             │
│ [stale banner when last update exceeds freshness threshold]  │
└──────────────────────────────────────────────────────────────┘
```

Chart controls are explicit and independent. Tooltips are supplementary; the same values are available through a table or accessible description. Thresholds are display-only in the viewer.

### Alarms and reports

Alarms and reports use the same list/detail pattern: page title, filters, result count, table/list, empty state, then a detail view with breadcrumbs. Alarm detail shows severity text, station, detected time, current state, and event timeline. Report detail shows report period, generated time, station scope, data-quality note, and provenance.

### AI insight card states

AI cards always show the insight text, confidence label, source period, source station/parameters, and a provenance link or “provenance unavailable” message.

| State | Card treatment and copy |
| --- | --- |
| Available | “Insight” + confidence label + source period + provenance |
| No data | “No insight available because this period has no usable observations.” |
| Learning | “The model is learning this station profile. Check back after more observations.” |
| Unavailable | “AI insights are temporarily unavailable. Core telemetry remains available.” |
| Stale | “This insight is based on data last updated at …” with stale badge |
| Error | “We couldn’t load this insight. Try again.” with retry action |

## Required data states

Every data screen implements the following states with text, not color alone:

- Loading: preserve layout with skeleton rows/cards and `aria-busy="true"`.
- Empty: explain why there are no results and offer a relevant filter reset.
- Error: explain what failed, provide retry, and preserve the user’s filters.
- Stale: show the last successful update time and a stale label.
- Reconnecting/offline: persistent banner: “Connection lost. Showing the last available data.” When live again: “Connection restored.”

## Content and accessibility rules

- Use English keys with Arabic translations ready from the first component; never concatenate translated fragments.
- Set document direction from locale (`ltr`/`rtl`); mirror navigation and chart legends in RTL while keeping numeric units and timestamps unambiguous.
- Every control has a visible label, keyboard focus ring, logical tab order, and Escape behavior for drawers/dialogs.
- Status uses text plus shape/icon/pattern. Healthy, attention, offline, and unknown labels are always rendered beside their visual marker.
- Body text targets WCAG AA contrast. Focus uses the dedicated focus token and is visible on dark and light surfaces.
- Use plain operational copy: state what happened, what data is affected, and what the viewer can do next.

## Responsive behavior

| Breakpoint | Layout |
| --- | --- |
| 1280px and up | Persistent navigation rail; two-column dashboard cards; map and list side by side |
| 768–1279px | Collapsible navigation drawer; one or two-column cards; map/list tabs when width is constrained |
| 320–767px | Single-column cards; bottom sheet for station details; tables become labeled cards; controls wrap vertically |

## Design-token contract

The initial CSS variables live in `frontend/src/styles.css`. Components should consume these variables rather than inventing page-level colors, spacing, radii, or focus treatments.

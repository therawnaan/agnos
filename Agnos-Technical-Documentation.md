# Agnos — Technical Documentation
> Patient Intake & Real-Time Staff Monitoring System

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Design](#2-design)
3. [Component Architecture](#3-component-architecture)
4. [Real-Time Synchronization Flow](#4-real-time-synchronization-flow)

---

## 1. Project Structure

Agnos is a Next.js application using the App Router. The project is split into two independent runtime concerns: the Next.js frontend (served on Vercel or locally on port 3000) and a lightweight Node.js WebSocket server (run separately on port 8080).

### 1.1 Folder & File Layout

```
agnos/
├── app/
│   ├── page.jsx                  # Landing page — portal entry point
│   ├── patient/
│   │   └── page.jsx              # Patient multi-step registration form
│   └── staff/
│       └── page.jsx              # Staff real-time monitoring dashboard
├── components/
│   └── Navbar.jsx                # Shared navigation bar used by all pages
├── server/
│   └── websocket.js              # Standalone Node.js WebSocket broadcast server
├── .env.local                    # Local environment variables (not committed to git)
└── README.md                     # Setup and run instructions
```

### 1.2 Routing

Next.js App Router maps each folder under `app/` to a URL automatically:

| Route | File |
|-------|------|
| `/` | `app/page.jsx` |
| `/patient` | `app/patient/page.jsx` |
| `/staff` | `app/staff/page.jsx` |

### 1.3 Separation of Concerns

- **`app/`** — all UI, routing, and client-side logic lives here
- **`components/`** — shared, reusable UI components that are page-agnostic
- **`server/`** — the WebSocket server is intentionally isolated from the Next.js build so it can be deployed independently (e.g. Railway) without affecting the Vercel deployment

> **Note:** The WebSocket server has no knowledge of the Next.js app. It is a pure broadcast relay — any message it receives from one client is forwarded to all other connected clients verbatim. All business logic (heartbeat timing, status derivation, form validation) lives in the frontend.

---

## 2. Design

The visual design follows a **clinical-luxury aesthetic** — precise, clean, and trustworthy. A teal and white palette is used throughout to evoke a medical setting without feeling cold or institutional. All styling is implemented with Tailwind CSS utility classes.

### 2.1 Design Principles

- **Trustworthy & calm** — soft white backgrounds, generous whitespace, no aggressive colour contrasts
- **Teal accent system** — a single accent colour (`teal-600`) provides all interactive affordances: focus rings, progress bars, buttons, icons, and status badges
- **Typography** — bold, tight tracking on headings for authority; regular weight on body text for readability; all-caps small labels for field names to create visual hierarchy without increasing size
- **Consistent component shapes** — `rounded-2xl` and `rounded-3xl` are used uniformly across cards, inputs, and buttons so the interface feels cohesive at a glance

### 2.2 Responsive Design by Breakpoint

Tailwind's responsive prefix system is used throughout. Base styles target mobile, with `sm:` overrides for wider screens.

| Breakpoint | Behaviour |
|------------|-----------|
| **Mobile** (default, `< 640px`) | Single-column form fields. Step labels hidden — only numbered circles shown. Navbar page-type pill moves below the nav bar row to avoid crowding. Cards stack vertically. |
| **Small and up** (`sm:`, `640px+`) | Form fields switch to multi-column grids (2- and 3-column). Step labels appear alongside circles. Navbar pill returns to the centre of the bar. Staff dashboard summary pills move inline with the page title. |

### 2.3 Form UX

- **Multi-step layout (4 steps)** — breaking a long form into Personal, Contact, Additional, and Review steps reduces cognitive load and makes per-step validation errors easier to surface
- **Progress bar** — a teal top-edge bar on the form card grows proportionally with each step, giving patients a clear sense of progress
- **Inline validation** — errors appear below individual fields only after the user attempts to advance, not on every keystroke, to avoid premature interruptions
- **Conditional fields** — the `Other` free-text inputs for Gender, Language, and Religion only appear when the `Other` option is selected, keeping the form compact
- **Review step** — the final step summarises all entered data before submission so patients can catch mistakes without needing to navigate back

### 2.4 Staff Dashboard UX

- **Card-based layout** — each patient is a collapsible card. The collapsed state shows essential at-a-glance info (name, age, gender, status badge, step progress). The expanded state shows the full record.
- **Status visual hierarchy** — active patients (amber, pulsing dot) are sorted to the top, submitted (green) below, inactive (grey) last. Staff attention is always drawn to patients who need it first.
- **Active state banner** — expanding a card for an in-progress patient shows a contextual notice explaining that full details are available after submission, preventing confusion from partially-filled data

---

## 3. Component Architecture

The application uses a flat, co-located component structure. Each page file contains its own sub-components rather than spreading them across deeply nested folders, which keeps related code together and makes each page self-contained.

### 3.1 Shared Components

#### `Navbar`
Shared across all three pages. Accepts a single `pageType` prop (`null | "patient" | "staff"`).

- When `null` (home page) — renders only the Agnos logo
- When set — renders the logo, a centred pill badge identifying the current section (e.g. `Patient Intake` or `Staff Portal`), and a back arrow linking to `/`

The pill colour and icon change to match the page context. On mobile, the pill drops below the nav bar row to avoid crowding the logo and back link.

---

### 3.2 Landing Page

#### `LandingPage`
Renders the two portal entry cards. Each card is a Next.js `Link` wrapping a styled `div` with a hover glow effect, section icon, title, description, and an arrow CTA. Background decorative blobs use `blur` and `opacity` to create depth without images.

---

### 3.3 Patient Page

#### `PatientPage`
Root page component. Owns all form state (`useState`), step progression, and validation. Delegates WebSocket communication entirely to the `usePatientSocket` hook.

#### `usePatientSocket` (hook)
Manages the full WebSocket lifecycle:
- Initial connection and reconnection with exponential backoff (up to 30 seconds)
- Heartbeat interval (`setInterval` every 4 seconds)
- Safe-send queuing for messages sent before the socket is open
- Final form submission (stops heartbeat, sends full payload)

Exposes three functions: `startHeartbeat(step, firstName, lastName)`, `stopHeartbeat()`, and `submitForm(form)`.

#### `Field`
Wrapper component for a form label + input/select + error message. Accepts `label`, `error`, `optional`, and `children` props. Renders the `(optional)` tag inline and the error message conditionally below the input.

#### `SectionTitle`
Renders an emoji icon and bold heading for each form step section (e.g. *Personal Information*).

#### `ReviewSection` / `ReviewRow`
Used on the Review step to render entered data in a structured two-column summary grid. `ReviewRow` accepts a `label` and `value`, rendering a fallback dash (`—`) when `value` is empty.

#### `ChevronDown`
Inline SVG icon used inside `select` dropdowns to provide a custom arrow indicator, since the `appearance-none` Tailwind class hides the browser's native arrow.

---

### 3.4 Staff Page

#### `StaffPage`
Root page component. Owns the `patients` map (keyed by patient ID), a periodic `now` ticker (every 2 seconds to re-evaluate inactive status), and sorted/counted derived values. Delegates WebSocket listening to `useStaffSocket`.

#### `useStaffSocket` (hook)
Manages the WebSocket connection for the staff side:
- Connects and handles reconnection with exponential backoff
- Filters incoming messages to only process `heartbeat` and `submit` types
- Surfaces a `wsStatus` string (`connecting | connected | error | reconnecting`) for the header pill UI

#### `PatientCard`
The primary information unit on the staff dashboard. Renders:
- **Collapsed** — avatar with initials, status dot with optional pulse animation, name, age, gender, status badge, step progress or submission time
- **Expanded** — full detail panel with all form fields grouped by section

Derives its own status by calling `deriveStatus(patient, now)`.

#### `DetailSection` / `DetailRow`
Mirror of `ReviewSection`/`ReviewRow` on the patient side. Used inside the expanded `PatientCard` to display fields in grouped, labelled pairs. `DetailRow` renders `"Not provided"` in grey italic when a field is empty.

---

## 4. Real-Time Synchronization Flow

The real-time system is built on a single persistent WebSocket connection between each browser and the Node.js server. The server is a **stateless broadcast relay** — it holds no patient data and applies no transformation to messages. All state management and status logic lives in the browser.

### 4.1 Message Flow Overview

```
Patient browser                 WS Server              Staff browser
      │                             │                        │
      │──── connect ───────────────▶│                        │
      │                             │◀─── connect ───────────│
      │                             │                        │
      │──── heartbeat (every 4s) ──▶│                        │
      │                             │──── heartbeat ────────▶│
      │                             │                        │  upsert patient by ID
      │                             │                        │  lastSeen = Date.now()
      │                             │                        │
      │  (patient fills form)       │                        │  status → "active"
      │                             │                        │  (if lastSeen < 8s ago)
      │                             │                        │
      │──── submit (full payload) ─▶│                        │
      │                             │──── submit ───────────▶│
      │                             │                        │  status → "submitted"
      │                             │                        │  (permanent)
```

| Step | What happens |
|------|-------------|
| **1. Patient page loads** | `usePatientSocket` creates a WebSocket connection and generates a stable UUID session ID (stored in `useRef`, persists for the browser session). |
| **2. Patient fills the form** | `startHeartbeat()` is called on every step change or name change. It immediately sends a heartbeat and sets a 4-second interval to continue sending. |
| **3. Server receives heartbeat** | The server logs it and broadcasts it to all *other* connected clients (not back to the sender). The staff browser receives it. |
| **4. Staff page receives heartbeat** | `useStaffSocket` calls `onMessage(data)`. `StaffPage` upserts the patient into its `patients` map by ID, setting `lastSeen` to `Date.now()`. |
| **5. Status evaluation** | Every 2 seconds, the `now` ticker updates. `PatientCard` re-renders and calls `deriveStatus(patient, now)`: if `lastSeen` < 8 seconds ago → `active`; otherwise → `inactive`. |
| **6. Patient submits** | `submitForm()` stops the heartbeat interval and sends a single `submit` message with the full form payload and `status: "submitted"`. |
| **7. Staff receives submit** | The `patients` map is updated with `status: "submitted"`. `deriveStatus()` returns `"submitted"` permanently, regardless of `lastSeen` time. |

### 4.2 Heartbeat Timing

The timing constants are deliberately coordinated between the two pages:

| Constant | Value | Reasoning |
|----------|-------|-----------|
| `HEARTBEAT_INTERVAL` (patient) | `4 000 ms` | Sends a ping every 4 seconds while the patient is on any form step. |
| `INACTIVE_TIMEOUT` (staff) | `8 000 ms` | A patient is marked inactive if no heartbeat arrives within 8 seconds. This is 2× the heartbeat interval, allowing one missed ping before the status changes. |
| `now` ticker (staff) | `2 000 ms` | The staff page re-evaluates all statuses every 2 seconds, giving near-instant feedback when a patient goes inactive. |

### 4.3 Reconnection Strategy

Both pages implement independent reconnection with exponential backoff:

- On WebSocket `close`, a reconnect is scheduled after `reconnectDelay` milliseconds
- `reconnectDelay` doubles after each failed attempt, capped at **30 seconds**
- On successful reconnect, `reconnectDelay` resets to `1 000 ms`
- On the patient side, any message queued while the socket was down is flushed immediately on the next `onopen` event
- On the staff side, the `wsStatus` value updates to `connecting`, `connected`, `reconnecting`, or `error`, which is reflected in the live status pill in the header

### 4.4 Echo Prevention

The original WebSocket server broadcast messages back to the sender. This was fixed so the broadcast skips the originating client (`client !== ws`). This prevents:
- The patient page from processing its own heartbeats
- The staff browser from seeing duplicate messages if it also sends anything

### 4.5 State Merge Strategy

The staff page stores patients as an object keyed by patient ID rather than an array. Each incoming message is merged with the existing record:

```js
[data.id]: { ...prev[data.id], ...data, lastSeen: Date.now() }
```

This means heartbeat messages (which only carry `name` and `step`) are layered on top of any previously received fields. When the final `submit` arrives with the complete form payload, it overwrites all prior partial data — giving the staff card a fully populated record.

> **Important:** Patient data is held entirely in memory. There is no database. If the WebSocket server or the staff browser is refreshed, the patient list is lost. For a production deployment, submitted records should be persisted to a database on the server before broadcasting.

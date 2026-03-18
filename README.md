# Agnos — Patient Intake System

A real-time patient registration and staff monitoring system built with **Next.js**, **Tailwind CSS**, and **WebSockets**.

---

## Project Structure

```
medicheck/
├── app/
│   ├── page.jsx                  # Landing page
│   ├── patient/
│   │   └── page.jsx              # Patient registration form
│   └── staff/
│       └── page.jsx              # Staff dashboard
├── components/
│   └── Navbar.jsx                # Shared navigation bar
├── server/
│   └── websocket.js              # Standalone WebSocket server (Node.js)
├── .env.local                    # Environment variables (you create this)
└── README.md
```

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher (comes with Node.js)

Verify your versions:

```bash
node -v
npm -v
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/medicheck.git
cd medicheck
```

### 2. Install Next.js dependencies

```bash
npm install
```

### 3. Install WebSocket server dependency

```bash
npm install ws
```

> If you keep the WebSocket server in a separate folder with its own `package.json`, run `npm install` inside that folder instead.

---

## Environment Variables

Create a `.env.local` file in the project root:

```bash
touch .env.local
```

Add the following:

```env
# WebSocket server URL
# Use ws:// for local development, wss:// for production
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

> **Note:** `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

---

## Running Locally

You need to run **two processes** simultaneously — the Next.js app and the WebSocket server.

### Terminal 1 — Start the WebSocket server

```bash
node server/websocket.js
```

You should see:

```
WebSocket server running on ws://localhost:8080
```

### Terminal 2 — Start the Next.js app

```bash
npm run dev
```

You should see:

```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

### Open in browser

| Page | URL |
|------|-----|
| Landing | http://localhost:3000 |
| Patient Form | http://localhost:3000/patient |
| Staff Dashboard | http://localhost:3000/staff |

Open the **Staff Dashboard** in one tab and the **Patient Form** in another to see real-time updates.

---

## How It Works

### Message flow

```
Patient browser  →  WebSocket server  →  Staff browser
     (sends heartbeats every 4s and a final submit)
```

### Message types

**Heartbeat** — sent every 4 seconds while the patient is on the form:
```json
{
  "type": "heartbeat",
  "id": "uuid",
  "status": "active",
  "step": 1,
  "firstName": "Jane",
  "lastName": "Doe",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Submit** — sent once when the patient completes the form:
```json
{
  "type": "submit",
  "id": "uuid",
  "status": "submitted",
  "firstName": "Jane",
  "middleName": "",
  "lastName": "Doe",
  "dob": "1990-03-14",
  "gender": "Female",
  "phone": "+61 400 000 000",
  "email": "jane@example.com",
  "addressLine": "123 Example St",
  "suburb": "Sydney",
  "state": "NSW",
  "postcode": "2000",
  "country": "Australia",
  "language": "English",
  "nationality": "Australian",
  "emergencyName": "John Doe",
  "emergencyRelationship": "Spouse",
  "religion": "Christianity",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Patient status indicators

| Status | Condition |
|--------|-----------|
| 🟡 **Filling in** | Heartbeat received within the last 8 seconds |
| 🟢 **Submitted** | Final submit message received |
| ⚪ **Inactive** | No heartbeat for more than 8 seconds |

---

## Deploying to Production

### Next.js app → Vercel

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add the environment variable in the Vercel dashboard:
   ```
   NEXT_PUBLIC_WS_URL = wss://your-websocket-server.railway.app
   ```
4. Deploy

### WebSocket server → Railway

1. Push `server/websocket.js` to GitHub (can be the same repo)
2. Go to [railway.app](https://railway.app) and create a new project from the repo
3. Set the start command to:
   ```
   node server/websocket.js
   ```
4. Railway will assign a public URL — use that as your `NEXT_PUBLIC_WS_URL` in Vercel (with `wss://`)

> **Important:** Vercel enforces HTTPS, so your WebSocket URL must use `wss://` (secure) in production. Railway and Render provide this automatically.

### Alternative WebSocket hosts

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| [Railway](https://railway.app) | $5 credit/month | Easiest setup, no sleep |
| [Render](https://render.com) | Yes | Spins down after 15 min inactivity |
| [Fly.io](https://fly.io) | Yes | More configuration required |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Build Next.js for production |
| `npm run start` | Start Next.js production server |
| `node server/websocket.js` | Start the WebSocket server |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Real-time | [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) (browser) + [ws](https://github.com/websockets/ws) (server) |
| Language | JavaScript (React) |

---

## Notes

- All patient data is handled in-memory only — there is no database. Restarting the WebSocket server clears all state.
- The WebSocket server broadcasts to all connected clients except the sender. Staff browsers receive all patient messages.
- For a production system, consider adding authentication, a database (e.g. PostgreSQL via Prisma), and HTTPS/WSS enforcement.

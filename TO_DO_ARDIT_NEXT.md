Here's a comprehensive, prioritized to-do list your team can split up and work on in parallel:

---

# GuardianAI — Hackathon To-Do List

## Priority 1 — Demo Killers (fix these first, ~1-2 hours)

These will embarrass you during the live demo if broken.

### Backend
- [ ] **Connect real chart data to frontend dashboard** — the fraud trend chart currently uses hardcoded mock data. Wire `/api/me/stats` or a new `/api/me/chart-data` endpoint and render real events over time.
- [ ] **Fix session timeout UX** — when the 90s inactivity timer fires, confirm the redirect actually works cleanly without a blank screen.
- [ ] **Make "Mark as Read" alerts persist** — verify `PATCH /api/me/alerts/{id}/read` actually updates the unread badge in real time without a page refresh.
- [ ] **Ensure both servers start cleanly with one command** — add a `start.bat` / `start.sh` that launches `fraud_api.py`, `main.py`, and `npm run dev` in parallel so teammates don't fumble during setup.

### Frontend
- [ ] **Add loading spinners everywhere** — every API call should show a spinner/skeleton while loading. Judges will see blank cards during demo.
- [ ] **Handle API errors gracefully** — if the backend is down, show "Service unavailable" instead of crashing or silently showing nothing.

---

## Priority 2 — Wow Factor (impressive for judges, ~3-5 hours)

Split these among teammates for parallel work.

### Feature: Real-Time Alerts Feed (1 person)
- [ ] Add a **live notification bell** that polls `/api/me/alerts` every 10 seconds and shows a red badge with unread count
- [ ] Clicking the bell opens a dropdown list of recent alerts with severity badges (red/orange/yellow)

### Feature: Transaction Export (1 person)
- [ ] Add a **"Download CSV"** button on the Transaction History page — export the user's transactions to a `.csv` file using a simple JS Blob
- [ ] Optionally add a **PDF export** of the fraud report

### Feature: Interactive Risk Score Visualizer (1 person)
- [ ] When the Live Scanner returns a result, show a **radial gauge / speedometer chart** for the fraud score (0–100)
- [ ] Highlight which specific flags triggered the decision (e.g., "new device + foreign country")

### Feature: Admin Analytics Enhancements (1 person)
- [ ] Add a **bar chart** on the admin dashboard: fraud count by city
- [ ] Add a **pie/doughnut chart**: breakdown of decision types (`ALLOW` / `MFA_CHALLENGE` / `BLOCK`)
- [ ] Add pagination or "Load More" to the events table (currently capped at 15)

---

## Priority 3 — Polish & Stability (~2-3 hours)

### UI/UX
- [ ] **Add form validation** on the registration page — show inline errors for weak passwords, invalid email format
- [ ] **Mobile responsiveness check** — open the app on a phone or narrow window; fix any broken layouts in the dashboard cards
- [ ] **Confirm dark mode is consistent** — some cards/modals may not switch themes properly
- [ ] **Add a favicon** — right now the browser tab shows the default Vite icon

### Backend
- [ ] **Add rate limiting** on the `/predict` endpoint — use `slowapi` (1 line of code) to prevent spam during demo
- [ ] **Add pagination params** to `/api/dashboard/events` — `?limit=50&offset=0` so the table doesn't hang on large data
- [ ] **Validate inputs on registration** — reject empty username, enforce minimum password length

---

## Priority 4 — Presentation Assets (~1-2 hours, non-code)

- [ ] **Record a 60-second demo video** as a backup in case live demo fails
- [ ] **Prepare 3 demo scripts** (one per judge scenario):
  - Normal user flow: login → see balance → make transaction → get ALLOW
  - Fraud scenario: trigger the "Account Takeover" preset → get BLOCK → see alert
  - Admin view: login as admin → see all users at risk → drill into an event
- [ ] **Create a system architecture diagram** (use draw.io / Excalidraw) showing the two FastAPI servers, React frontend, PostgreSQL, and Isolation Forest — put it in the README
- [ ] **Update the README** with a table of test accounts (username/password/PIN) so judges can log in themselves

---

## Priority 5 — Bonus / Differentiators (~2-4 hours if time allows)

- [ ] **Two-factor authentication email simulation** — when a transaction scores `MFA_CHALLENGE`, show a modal that asks the user to "enter the code sent to your email" (can be hardcoded to `123456` for demo)
- [ ] **WebSocket real-time event feed** — replace polling with a WebSocket that pushes new fraud alerts to the dashboard instantly
- [ ] **"Explain this decision" modal** — clicking any fraud event shows the GDPR-compliant reason text from the backend in a readable card
- [ ] **Geolocation map** — use Leaflet.js to plot transaction locations on a map, with fraud events shown in red

---

## Task Assignment Suggestion

| Person | Tasks |
|--------|-------|
| **Person A** | Priority 1 backend fixes + real chart data |
| **Person B** | Real-time alerts feed + loading spinners |
| **Person C** | Admin analytics charts + pagination |
| **Person D** | Transaction CSV export + form validation |
| **Person E** | Demo scripts + architecture diagram + README update |

---

The single highest-ROI item is **connecting the dashboard chart to real data** and **adding loading spinners** — those are the two things judges will see in the first 30 seconds. Start there.
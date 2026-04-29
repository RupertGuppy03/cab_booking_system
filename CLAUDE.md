# CLAUDE.md — CabsOnline Part 2

## Who I Am
Student: Rupert Guppy (ID: 23196925)
Assignment: Part 2 (35% of total grade)

---

## Project Overview

CabsOnline is a taxi booking web app. Part 1 (complete) is a vanilla JS + PHP + MySQL system on the AUT webdev server. Part 2 extends it with a React frontend and four new features. The React app is separate — it communicates with PHP endpoints via fetch.

**Never touch or modify any files inside `/assign/` on the AUT webdev server. All new PHP endpoints go in `/assign/part2/` only.** 

---

## Tech Stack

| Layer | Choice |
|---|---|
| Build tool | Vite |
| Framework | React 18 (JavaScript) |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Maps | react-leaflet + OpenStreetMap |
| Geocoding | Nominatim (free, no API key) |
| Backend | PHP on AUT webdev (`/assign/part2/`) |
| Database | Existing MySQL + new `drivers` and `trips` tables |
| Hosting | Vercel |

---

## The Four Features

1. **Map-Based Booking** — Interactive Leaflet map replaces the Part 1 address form. Customers drop pins for pickup and destination, addresses auto-fill via Nominatim reverse geocoding, and the booking is submitted to a new PHP endpoint that inserts into the existing `bookings` table.

2. **Driver Portal** — Drivers log in with a driver ID and see unassigned bookings. They can accept a job and progress its status through `assigned` → `in_progress` → `completed`, with each change saved to the DB via fetch.

3. **Live Booking Tracker** — Customers enter a BRN to view their booking's current status as a visual progress indicator. A Leaflet map shows pickup and destination pins. The page polls the backend every 5 seconds to reflect status changes made by the driver portal.

4. **Fare Estimator + Trip History** — A live fare estimate (based on straight-line distance between pins using the Haversine formula) updates as pins move on the booking map. A separate "My Trips" page lets customers enter their phone number to view all past bookings, fares, and statuses in a sortable table.

---

## Database Schema

### Existing table (Part 1 — do not modify)
```sql
bookings (
  id, brn, cname, phone, unumber, snumber, stname, sbname, dsbname,
  pickup_date, pickup_time, booking_datetime, status
)
```

### New tables for Part 2
```sql
CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  area VARCHAR(100)
);

CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brn VARCHAR(10) NOT NULL,
  driver_id VARCHAR(20),
  pickup_lat DECIMAL(10,7),
  pickup_lng DECIMAL(10,7),
  dest_lat DECIMAL(10,7),
  dest_lng DECIMAL(10,7),
  fare_estimate DECIMAL(8,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Marking Criteria, must meet these

**Functionality (10 marks)** — All four features must work end-to-end with real backend interaction, real map usage, and real DB queries. The driver portal and tracker must be visibly connected — driver actions must update what the customer sees.

**UI (10 marks)** — Clean, modern, responsive design across all pages. Consistent colours, fonts, and spacing. No broken buttons, placeholder text, or mismatched labels. Use a shared layout/nav across all pages.

**Error Handling (3 marks)** — All errors must show a user-facing message, never fail silently. Cover: network errors, invalid inputs, failed geocoding, polling errors, and driver ID not found.

---

## Code Style

### React / JavaScript
- camelCase for variables and functions, PascalCase for components
- One component per file, functional components only
- `async/await` for all fetch calls — never `.then()` chains
- Always wrap fetch in `try/catch` and set an error state

### PHP
- snake_case for all variable and function names
- Every PHP file must include CORS headers at the very top:
- Use prepared statements for every MySQL query
- Always return JSON, even for errors: `{"error": "message here"}`
- Every PHP file must have a header comment:

### General
- No commented-out code in any file
- 2-space indentation throughout
- No `console.log` left in submitted code
- Every file must have a header comment:
/**
 * Student: Rupert Guppy (23196925)
 * File: current file
 * Description: [what this file does]
 * Functions: [list any functions defined in this file]
*/

---

## Workflow

1. Build and test features locally with `npm run dev`
2. Test against live PHP endpoints on the webdev server
3. Once a feature is finished , then ask me to push to GitHub — Vercel auto-deploys and the live URL updates automatically

---

## What Not To Do

- Never edit any files in `/assign/` — Part 1 is locked
- No TypeScript — plain JavaScript only
- No class components — functional only
- No state management libraries (Redux, Zustand, etc.) — useState is sufficient
- No Google Maps — Leaflet + OpenStreetMap only
- No placeholder text or debug buttons in the final UI
- No commented-out code in submitted files
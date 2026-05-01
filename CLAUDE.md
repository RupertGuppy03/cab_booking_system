# CLAUDE.md: CabsOnline Part 2

## Who I Am
Student: Rupert Guppy (ID: 23196925)
Assignment: Web Development Assignment, Part 2

---

## Project Overview

CabsOnline is a taxi booking web app. Part 1 (already submitted) is a vanilla JS + PHP + MySQL system deployed on the AUT webdev server. Part 2 is a React-based refactor and extension of Part 1 where we reform and refactor out part 1 work into a fully functional react app with new features and deployed on vercel. ensure you follow the outlined workflow and ensure that any features that we make align with the feature descriptions and marking criteria

The Part 2 build plan has two distinct phases:

**Phase 1: Refactor.** Port Part 1's two pages (booking.html and admin.html) into modern React components that live at the repo root. The ported app uses the existing Part 1 PHP endpoints on webdev for backend logic. By the end of Phase 1, the React app should fully replicate Part 1's functionality, just rebuilt in React + Vite + Tailwind, and deployed on Vercel.

**Phase 2: Extend.** Layer four new features on top of the refactored React foundation. These features build on and enhance the ported booking and admin pages rather than replace them.

This order is deliberate. The assignment brief explicitly requires both refactoring AND extending Part 1 work, in that order.

---

## Repo Structure

```
cab_booking_system/         repo root, also Vercel root
├── Part1/                  Part 1 source, READ-ONLY reference
├── src/                    React source for Part 2
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── CLAUDE.md
```

**Important:** Part1/ exists in this repo as a read-only reference for porting work. Never modify, delete, or restructure anything in Part1/. The actual submitted Part 1 lives on the AUT webdev server and is locked. The folder here is just so you can read it for reference when porting.

---

## Part 1 Endpoints (Live on webdev, used by Part 2)

Booking flow:
- `POST https://webdev.aut.ac.nz/~pxw1781/assign/booking.php`
  - Inserts a new booking, generates BRN, returns confirmation message

Admin flow:
- `POST https://webdev.aut.ac.nz/~pxw1781/assign/admin.php`
  - Action `search`: returns booking by BRN, or all unassigned bookings due within 2 hours
  - Action `assign`: updates a booking's status to assigned

Phase 1 (the refactor) calls these existing endpoints directly. New PHP endpoints for Phase 2 features go in `/htdocs/assign/part2/` on webdev.

---

## Tech Stack
| Layer | Choice |
|-------|--------|
| Build tool | Vite |
| Framework | React 18 |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Maps | react-leaflet + OpenStreetMap |
| Geocoding | Nominatim (free, no API key) |
| Backend | PHP on AUT webdev (`/assign/part2/`) |
| Database | Existing MySQL + new `drivers` and `trips` tables |
| Hosting | Vercel |

### Vercel Config
- Repo: `RupertGuppy03/cab_booking_system`
- Root Directory: `.` (repo root)
- Live URL: `https://cab-booking-system-two.vercel.app/`

---

## Build Plan

### Phase 1: Refactor Part 1 into React (do first, in this order)

1.1. Port `Part1/booking.html` + `Part1/booking.js` + `Part1/style.css` into a React `BookingPage` component at `src/pages/BookingPage.jsx`. Call the existing `booking.php` on webdev. Preserve all Part 1 fields, validation, default date/time behaviour, error messages, and the BRN confirmation message.

1.2. Port `Part1/admin.html` + `Part1/admin.js` into a React `AdminPage` component at `src/pages/AdminPage.jsx`. Call the existing `admin.php` on webdev. Preserve all Part 1 search behaviour (BRN format check, empty-search-shows-2hr-window), the results table columns, and the assign flow.

1.3. Test both pages on Vercel against the live PHP endpoints. Confirm bookings actually insert into the DB and the admin page actually assigns.

### Phase 2: Build the four features (do after Phase 1 is working)

These features extend the refactored Part 1 React foundation.

2.1. **Map-Based Booking** extends the booking page. Replaces the address text inputs with a Leaflet map where customers drop pins for pickup and destination. Uses Nominatim reverse geocoding to populate the original Part 1 address fields. Submits to a new PHP endpoint that writes to the existing `bookings` table plus the new `trips` table for coordinates.

2.2. **Driver Portal** extends the admin concept into a driver-facing page. Drivers log in with a driver ID, see unassigned bookings, and progress them through `assigned` to `in_progress` to `completed`.

2.3. **Live Booking Tracker** is a new customer-facing page. Customers enter a BRN to view current status as a visual progress indicator with a Leaflet map showing pickup and destination. Polls the backend every 5 seconds.

2.4. **Fare Estimator + Trip History** combines a live Haversine fare estimate on the booking page with a separate `MyTripsPage` where customers enter their phone number to see all past bookings.

---

## Database Schema

### Existing (Phase 1 uses this)
```sql
bookings (
  id, brn, cname, phone, unumber, snumber, stname, sbname, dsbname,
  pickup_date, pickup_time, booking_datetime, status
)
```

### New for Phase 2
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

## Marking Criteria (must hit all of these)

**Functionality (10 marks)** — All four features must work end-to-end with real backend interaction, real map usage, and real DB queries. The driver portal and tracker must be visibly connected — driver actions must update what the customer sees.

**UI (10 marks)** — Clean, modern, responsive design across all pages. Consistent colours, fonts, and spacing. No broken buttons, placeholder text, or mismatched labels. Use a shared layout/nav across all pages.

**Error Handling (3 marks)** — All errors must show a user-facing message, never fail silently. Cover: network errors, invalid inputs, failed geocoding, polling errors, and driver ID not found.

**README.DOC (12 marks)** — Required sections: public URL, tech stack, run/build instructions, API endpoints (local and remote), feature descriptions, testing instructions (sample BRNs and driver IDs), known limitations, AI reflection.

also ensure you use a consistant coding style i.e camelccase and ensure that any code you generate has the correct comments at the top of the file an throught the various functions
---

## Code Style

### React / JavaScript
- camelCase for variables and functions, PascalCase for components
- Functional components only, no class components
- Hooks for state and side effects

### PHP
- snake_case for variables and functions
- Every PHP file gets a header comment

### Comments and Headers
- No commented-out code anywhere in submitted files
- All functions get a short, high-level description so a marker can read and understand them quickly
- Every file starts with this header block:

```
/**
 * Student: Rupert Guppy (23196925)
 * File: <filename>
 * Description: <what this file does>
 * Functions: <list of functions defined in this file>
 */
```

### Formatting
- Consistent indentation throughout
- No messy spacing or trailing junk
- One concern per file

---

## Workflow

1. **One feature or task at a time.** Never try to do the whole assignment in one go. Each Claude Code session should focus on a single bounded task from the build plan. follow the build plan, ensure added features meet the feature descriptions and any code genrerated must aim to eventually meet the marking criteria
2. **Test locally before considering anything done.** Run `npm run dev`, click through the feature, confirm it works against the real backend. 
3. Once a feature is finished, ASK ME TO PUSH TO GITHUB, NEVER DO IT ON YOUR OWN — Vercel then auto-deploys and the live URL updates automatically once I MAKE THE COMMIT
4. **Backend changes require Rupert to deploy manually.** Any new PHP file needs to be uploaded to webdev by myself via FileZilla. After writing any PHP, clearly list the files I needs to upload and where they go on the server.

---

## ABSOLUTE RULES (zero tolerance)

### I control git overall. You do not.

Under no circumstances run any git command that modifies repo state. This includes but is not limited to. Read-only git commands such as `git status`, `git log`, `git diff` are fine when needed for context.

When you finish a task:
1. Summarise what files changed.
2. Tell Rupert it is ready for him to review and commit.

### Do not modify Part1/

The Part1/ folder is read-only reference material. Never edit, rename, restructure, delete, or write new files inside Part1/.

---

## What Not To Do (other rules)
- DO NOT COMMIT ANY OF YOUR CHANGES WITH GITHUB AUTOMATICALLY, ALWAYS CONFIRM WITH ME FIRST
- Do not use class components. Functional only.
- Do not use Google Maps. Leaflet + OpenStreetMap only.
- Do not leave placeholder text, debug buttons, or commented-out code in submitted files.
- Do not invent new API endpoints, table names, or column names. Use the schema and endpoints documented above. If something is missing, ask.
e
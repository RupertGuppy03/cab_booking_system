# CLAUDE.md: CabsOnline Part 2

## Who I Am
Student: Rupert Guppy (ID: 23196925)
Assignment: Web Development Assignment, Part 2

---

## Project Overview

CabsOnline is a taxi booking web app. Part 1 (already submitted) is a vanilla JS + PHP + MySQL system deployed on the AUT webdev server. Part 2 is a React-based refactor and extension of Part 1, built with React + Vite + Tailwind and deployed entirely on the AUT webdev server — no Vercel, no external hosting. Ensure all features align with the feature descriptions and marking criteria.

The Part 2 build plan has two distinct phases (see build plan for more details):

**Phase 1: Refactor.** Port Part 1's two pages (booking.html and admin.html) into modern React components. The ported app calls the existing Part 1 PHP endpoints on webdev for backend logic. By the end of Phase 1, the React app should fully replicate Part 1's functionality, just rebuilt in React + Vite + Tailwind, and served from webdev.

**Phase 2: Extend.** Layer four new features on top of the refactored React foundation. These features build on and enhance the ported booking and admin pages rather than replace them.

This order is deliberate. The assignment brief explicitly requires both refactoring AND extending Part 1 work, in that order.

---

## Repo Structure
cab_booking_system/         repo root
├── Part1/                  Part 1 source — READ-ONLY reference, never touch
├── src/                    React source for Part 2
│   ├── pages/              One file per page/route
│   └── components/         Shared components (Layout, etc.)
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── CLAUDE.md

## Filezilla Structure
dtdocs/assign
├── Part2/                  All files needed to run part 2 of our project
├── the rest of the filezilla Part1 files live here outside the part 2 folder.

**Important:** Part1/ exists as a read-only reference for porting work. Never edit, rename, restructure, delete, or write new files inside Part1/.

---

## Hosting

| Asset | Location on webdev via filezilla |
|---|---|
| React build output | `/htdocs/assign/Part2/` |
| Part 2 PHP backend | `/htdocs/assign/Part2/` |
| Part 1 PHP (unchanged) | `/htdocs/assign/` |

**Live URL:** `http://webdev.aut.ac.nz/~pxw1781/assign/Part2/filename`

All React asset paths and the BrowserRouter basename are set to `/~pxw1781/assign/part2/` via `vite.config.js` and `App.jsx`. Do not change these.

---

## Deployment
The repo structure is for local development only. You must tell me any files that need to be uploaded to the webdev server in order for our application to be able to run. I just use this envormoment to do the coding becasue it is easier to create the files here and upload them to the webdev server.

This means that anything we need to run the frontend and backend of our project must be on the webdev server so we can pass this assignment

## API Endpoints

All API URLs are hardcoded as full webdev URLs in the React source. Do not use relative paths or environment variables.

### Phase 1 (existing Part 1 endpoints)
- `POST https://webdev.aut.ac.nz/~pxw1781/assign/booking.php` — insert booking, returns BRN confirmation
- `POST https://webdev.aut.ac.nz/~pxw1781/assign/admin.php` — action=search or action=assign
note that all new endpoints now developed need to reference our new Part2 directory in filezilla

### Phase 2 (new endpoints in /assign/part2/)
- `POST https://webdev.aut.ac.nz/~pxw1781/assign/Part2/map_booking.php`
- `POST https://webdev.aut.ac.nz/~pxw1781/assign/Part2/driver.php`
- `GET  https://webdev.aut.ac.nz/~pxw1781/assign/Part2/tracker.php`
- `POST https://webdev.aut.ac.nz/~pxw1781/assign/Part2/trips.php`
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
| Hosting | AUT webdev server only — no Vercel |

---

## Build Plan

### Phase 1: Clean and rebuild our REACT app to now be hosted on webdev server instead of vercel

1.1. refactor and remove any unnessicary files we no longer need for our updated hosting method. in the past we used vercel so these references need to be updated to the webdev server ones. Assume that our Part2 webdev folder is currently empty so you will need to tell me what existing files to add to this aswell.

1.2. Ensure that our REACT version of out part 1 folder is working with the server, database, frontend and backend etc once these updated files are added to the server.

1.3. Build and tell me what i need to upload to webdev. Test both pages at the live URL against the real PHP endpoints. Confirm bookings insert into the DB and the admin page assigns correctly. Ask me how to do all the proper testing and validation to ensure that phase 1 was done successfully before we move onto phase 2

### Phase 2: Build the four features (do after Phase 1 is working)

2.1. **Map-Based Booking** — extends the booking page. Replaces the address text inputs with a Leaflet map where customers drop pins for pickup and destination. Uses Nominatim reverse geocoding to populate the Part 1 address fields. Submits to `map_booking.php` which writes to the existing `bookings` table plus the new `trips` table for coordinates.

2.2. **Driver Portal** — extends the admin concept into a driver-facing page. Drivers log in with a driver ID, see unassigned bookings, and progress them through `assigned` → `in_progress` → `completed` via `driver.php`. Drivers can accept a job, which updates the booking's status from unassigned to assigned, and later mark it as in progress or completed as the ride progresses. 

2.3. **Live Booking Tracker** — customer-facing page. Customers enter a BRN to view current status as a visual progress indicator with a Leaflet map showing pickup and destination. Polls `tracker.php` every 5 seconds.

2.4. **Fare Estimator + Trip History** — combines a live Haversine fare estimate on the booking page with a `MyTripsPage` where customers enter their phone number to see all past bookings via `trips.php`.

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

Student: Rupert Guppy (23196925)
File: <filename>
Description: <what this file does>
Functions: <list of functions defined in this file>

### Formatting
- Consistent indentation throughout
- No messy spacing or trailing junk
- One concern per file

---

## Workflow

1. **One feature or task at a time.** Each session focuses on a single bounded task from the build plan. Follow the build plan in order. All generated code must aim to meet the marking criteria.
2. **Test locally first.** Run `npm run dev` and click through the feature. API calls to webdev will work cross-origin from localhost because all Part 2 PHP files include CORS headers.
3. **When a feature is done:** summarise changed files and tell me to review. Never commit or push automatically.
4. **To deploy:** run `npm run build` locally, then upload the `dist/` folder contents to `/htdocs/part2/` via FileZilla.
5. **After every task:** clearly list every file that needs to go on the webdev server and exactly where it goes.

---

## ABSOLUTE RULES (zero tolerance)

### I control git. You do not.
Never run any git command that modifies repo state. Read-only commands (`git status`, `git log`, `git diff`) are fine for context only.

When you finish a task:
1. Summarise what files changed.
2. Tell me it is ready to review and commit.

### Do not modify Part1/
The Part1/ folder is read-only reference material. Never edit, rename, restructure, delete, or write new files inside it.

### Always ensure you are telling me at the end of a task what files to add to the webdev server to be able to run
ensure that we are only adding the required files to the webdev server
---

## What Not To Do
- Do not commit or push anything automatically — always wait for my confirmation
- Do not use class components — functional only
- Do not use Google Maps — Leaflet + OpenStreetMap only
- Do not leave placeholder text, debug buttons, or commented-out code in submitted files
- Do not invent new API endpoints, table names, or column names — use only what is documented above. If something is missing, ask
- Do not use Vercel or any external hosting — webdev only
- Do not use environment variables for API URLs — hardcode the full webdev URLs directly in the source
- Always tell me which files need uploading to webdev and exactly where they go after every task
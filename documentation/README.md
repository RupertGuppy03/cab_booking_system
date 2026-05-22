# CabsOnline Part 2 — README

**Student:** Rupert Guppy (23196925)

---

## 1. Public URL

The deployed application is accessible at:

**http://webdev.aut.ac.nz/~pxw1781/assign/Part2/**

The application runs entirely from the AUT webdev server. No external hosting (e.g. Vercel) is used. The React build output is served from `/htdocs/assign/Part2/` and all PHP backend files are co-located in the same directory.

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Build tool | Vite | 5.2 |
| Framework | React | 18.2 |
| Routing | React Router | v6.22 |
| Styling | Tailwind CSS | 3.4 |
| Maps | React-Leaflet + Leaflet | 4.2 / 1.9 |
| Map tiles | OpenStreetMap (via tile.openstreetmap.org) | — |
| Geocoding | Nominatim (OpenStreetMap reverse geocoding API) | — |
| Backend | PHP (on AUT webdev server) | — |
| Database | MySQL (existing Part 1 schema + new `trips` and `reviews` tables) | — |
| Hosting | AUT webdev server only | — |

---

## 3. How to Run and Build Locally

**Prerequisites:** Node.js 18+ and npm installed.

**Install dependencies:**
```
npm install
```

**Run in development mode (hot reload):**
```
npm run dev
```
Open `http://localhost:5173` in your browser. All API calls are directed to the live AUT webdev server, so a working internet connection is required. No local backend setup is needed.

**Build for production:**
```
npm run build
```
Output is placed in the `dist/` folder. Upload the contents of `dist/` (not the folder itself) to `/htdocs/assign/Part2/` on the webdev server via FileZilla.

**Preview production build locally:**
```
npm run preview
```

---

## 4. API Endpoints

All endpoints are hosted on the AUT webdev server and accept `POST` requests with `multipart/form-data` bodies.

| Endpoint | URL | Purpose |
|---|---|---|
| booking.php | `https://webdev.aut.ac.nz/~pxw1781/assign/Part2/booking.php` | Submit a new text-mode booking; inserts into `bookings` table and returns a BRN confirmation |
| map_booking.php | `https://webdev.aut.ac.nz/~pxw1781/assign/Part2/map_booking.php` | Submit a map-based booking; inserts into both `bookings` and `trips` tables (stores coordinates and fare estimate) |
| admin.php | `https://webdev.aut.ac.nz/~pxw1781/assign/Part2/admin.php` | `action=search` returns bookings matching a BRN or all unassigned bookings due within 2 hours; `action=assign` sets status to `assigned` |
| driver.php | `https://webdev.aut.ac.nz/~pxw1781/assign/Part2/driver.php` | Driver login, claim a booking, progress status (`assigned` → `in_progress` → `completed`), retrieve driver's active jobs |
| review.php | `https://webdev.aut.ac.nz/~pxw1781/assign/Part2/review.php` | `action=submit` posts a star rating and comment for a completed BRN; `action=get_for_driver` retrieves all reviews for a driver |
| trips.php | `https://webdev.aut.ac.nz/~pxw1781/assign/Part2/trips.php` | `action=search` returns all bookings for a phone number or BRN including trip data; `action=cancel` cancels an unassigned booking |

**Local development base URL:** `http://localhost:5173` (Vite dev server — API calls still go to webdev)

---

## 5. Feature Descriptions

### Feature 1 — Map-Based Booking

Extends the booking page. Instead of typing a street address, the customer can click a "Select Location on Map" toggle to reveal a Leaflet/OpenStreetMap map. They drop a pickup pin and a destination pin by clicking. On each pin drop, Nominatim reverse geocoding is called (with a 10-second timeout) to resolve the coordinates into a suburb and street address, which is automatically populated into the booking form fields. If geocoding succeeds for both pins, a live Haversine fare estimate is calculated and displayed (rate: $2.50/km, minimum $5.00). If the pickup location is unreachable by road (e.g. ocean, forest), submission is blocked. If the destination is unreachable, the booking still proceeds but stores `UNKNOWN` and warns the customer to confirm with the driver. Bookings made via the map are submitted to `map_booking.php`, which stores both the standard booking fields and the coordinates and fare estimate in the `trips` table.

### Feature 2 — Driver Portal

A dedicated driver-facing page where drivers log in with their driver ID (verified against the `drivers` table). After login, the dashboard shows two sections: **My Active Jobs** (bookings this driver has claimed) and **Available Bookings** (all currently unassigned bookings). Drivers can claim an available booking, then progress it through `assigned` → `in_progress` (Start Trip) → `completed` (Complete Trip). The dashboard auto-refreshes every 30 seconds. A **My Reviews** tab shows all customer ratings and comments left for completed trips handled by this driver. The driver session persists in `sessionStorage` so drivers remain logged in across page navigation without having to re-authenticate; they must explicitly click Logout to end the session.

### Feature 3 — Customer Rating & Review

Extends the My Trips page and Driver Portal. When a booking reaches `completed` status, a star rating form (1–5 stars) with an optional comment field appears on the booking card in My Trips. The customer submits via `review.php`, which stores the review in the `reviews` table linked to both the BRN and the assigned driver ID. Once submitted, the form is replaced with a read-only display of the submitted rating and comment — it cannot be re-submitted. On the Driver Portal, the My Reviews tab displays all reviews received by the logged-in driver, including star rating, customer name, comment, and submission date.

### Feature 4 — Fare Estimator & Trip History

Two sub-features combined. The fare estimator uses the Haversine formula on pickup and destination coordinates to calculate a straight-line distance fare estimate displayed before and after booking. The Trip History page (My Trips) allows customers to enter their phone number or a booking reference (BRN) to retrieve all their bookings. Results show the booking status, fare estimate, driver assignment, pickup date/time, and a route map for upcoming trips. Upcoming bookings (status: `unassigned`, `assigned`, or `in_progress`) display a Leaflet map with pickup and destination pins, provided coordinate data exists. Unassigned bookings can be cancelled directly from this page. Results auto-refresh every time the user navigates back to My Trips, ensuring status changes made by drivers are immediately visible.

---

## 6. Testing Instructions

### Book a Cab

1. Navigate to **Book a Cab**
2. Enter name (e.g. `Test User`) and phone number (e.g. `0211234567`)
3. Click **Select Location on Map**
4. Click anywhere in Auckland CBD to place the pickup pin — the address fields will populate automatically
5. Click **Set Destination Pin**, then click a different Auckland suburb for the destination
6. A fare estimate will appear (e.g. `$12.50`)
7. Click **Confirm Booking** — a confirmation message with the new BRN will appear

### My Trips — example booking references

| BRN | Status | Notes |
|---|---|---|
| BRN00023 | completed | Has a submitted 5-star review |
| BRN00026 | completed | Has a submitted 5-star review |
| BRN00030 | completed | Has a submitted 4-star review |
| BRN00034 | completed | Has a submitted 5-star review, assigned to DRV001 |

Search by BRN to see the booking card. For completed bookings with no review, the star rating form will appear.

**Phone number search:** Use the phone number shown in the booking confirmation after submitting a new booking.

### Driver Portal — sample driver IDs

| Driver ID | Name | Area |
|---|---|---|
| DRV001 | John Smith | Auckland CBD |

1. Navigate to **Driver Portal**, enter `DRV001` and click Login
2. Any unassigned bookings appear under **Available Bookings** — click **Claim** to take one
3. The booking moves to **My Active Jobs** with a **Start Trip** button
4. Click **Start Trip** → status changes to `In Progress`; a **Complete Trip** button appears
5. Click **Complete Trip** → booking is marked completed
6. Navigate to the **My Reviews** tab to see all customer feedback for this driver

### Admin

1. Navigate to **Admin**, leave the search blank and click **Search** — shows all unassigned bookings due within the next 2 hours
2. Enter a BRN (e.g. `BRN00034`) and click **Search** — shows that specific booking with its current status and assigned driver
3. For an `unassigned` booking, click **Assign** to mark it assigned

---

## 7. Limitations and Known Issues

- **Fare estimate uses straight-line (Haversine) distance**, not actual road distance. Estimates may be lower than a real metered fare for indirect routes.
- **Nominatim geocoding rate limit:** Nominatim enforces a 1 request/second limit on its public API. Rapid successive pin drops may return a geocoding error; waiting a moment before re-pinning resolves this.
- **Fare estimate only available for map bookings.** Bookings made via text-input (manual address) mode do not have coordinates stored, so no fare estimate is available and the trip map in My Trips will not show a route.
- **No payment processing.** The fare estimate is informational only; no payment is collected.
- **No admin authentication.** The Admin page is publicly accessible. In a production system, authentication would be required.
- **Driver IDs must be pre-seeded** in the `drivers` database table — there is no self-registration flow for drivers.
- **My Trips does not live-poll.** Results auto-refresh on navigation back to the page, but do not update while the page is open. Refreshing the page or re-navigating to My Trips will always show the latest status.
- **Cancellation is only available for unassigned bookings.** Once a driver has claimed a booking, it cannot be cancelled from My Trips.

---

## 8. Reflection on AI-Supported Development

Part 2 was developed using Claude Code (Anthropic) as the primary AI assistant throughout the build process.

**How AI was used:** Claude Code was used for the majority of code generation — scaffolding React components, writing PHP backend files, designing database JOIN queries, and implementing features such as Nominatim reverse geocoding, the Haversine fare formula, and the review submission flow. It also helped debug specific issues, such as a stale-data problem where My Trips showed cached booking statuses after a driver had updated them. This was resolved by switching from persisted trip results to an auto-fetch on component mount, a solution the AI helped design once the bug was described.

**What worked well:** AI was effective at generating boilerplate quickly, translating natural-language feature descriptions into working code, and handling edge cases such as geocoding timeout handling and blocking submission when a pickup location is unreachable by road. It also produced consistent, well-structured PHP with prepared statements throughout, preventing SQL injection without requiring manual review of every query.

**What required human judgment:** AI output still required careful review at every step. On several occasions the generated code needed adjustment — for example, an initial implementation persisted search results to `sessionStorage`, causing a stale-data bug where outdated booking statuses were shown after a driver updated them. Design decisions about which state to persist (driver login session: yes; search results: no) required understanding the application's user flows, which could not be delegated entirely to the AI. The AI also occasionally proposed unnecessary abstractions or additional features beyond the task scope, which had to be redirected to keep the codebase focused.

**Overall assessment:** AI-assisted development significantly accelerated the implementation of Part 2, particularly for repetitive patterns like form validation, error handling, and REST endpoint wiring. However, it functions best as a code-generation accelerator rather than a decision-maker — the developer still needs to direct the design, verify correctness, and catch subtle bugs that AI tools can miss.

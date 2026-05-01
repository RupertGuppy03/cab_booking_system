/**
 * Student: Rupert Guppy (23196925)
 * File: BookingPage.jsx
 * Description: Map-based booking page. Customers drop pins on an interactive
 *              Leaflet map for pickup and destination, with addresses auto-filled
 *              via Nominatim reverse geocoding, then submit to the PHP backend.
 * Functions: BookingPage
 */

export default function BookingPage() {
  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-xl font-semibold text-brand mb-2">Book a Cab</h2>
      <p className="text-gray-500">
        Drop pins on the map to set your pickup and destination — coming soon.
      </p>
    </div>
  );
}

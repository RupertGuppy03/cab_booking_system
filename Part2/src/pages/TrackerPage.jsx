/**
 * Student: Rupert Guppy (23196925)
 * File: TrackerPage.jsx
 * Description: Live booking tracker page. Customers enter a BRN to see their
 *              booking status as a visual progress indicator, with pickup and
 *              destination pins on a Leaflet map. Polls the backend every 5 seconds.
 * Functions: TrackerPage
 */

export default function TrackerPage() {
  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-xl font-semibold text-brand mb-2">Track Your Booking</h2>
      <p className="text-gray-500">
        Enter your booking reference number to see live status updates — coming soon.
      </p>
    </div>
  );
}

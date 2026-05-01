/**
 * Student: Rupert Guppy (23196925)
 * File: TripHistoryPage.jsx
 * Description: Fare estimator and trip history page. Shows a live fare estimate
 *              based on straight-line distance between map pins (Haversine formula)
 *              and lets customers view all past bookings by phone number.
 * Functions: TripHistoryPage
 */

export default function TripHistoryPage() {
  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-xl font-semibold text-brand mb-2">My Trips</h2>
      <p className="text-gray-500">
        Enter your phone number to view your booking history and fare estimates — coming soon.
      </p>
    </div>
  );
}

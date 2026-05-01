/**
 * Student: Rupert Guppy (23196925)
 * File: DriverPortalPage.jsx
 * Description: Driver portal page. Drivers log in with a driver ID and can view,
 *              accept, and progress unassigned bookings through assigned →
 *              in_progress → completed.
 * Functions: DriverPortalPage
 */

export default function DriverPortalPage() {
  return (
    <div className="bg-white rounded-lg shadow p-8">
      <h2 className="text-xl font-semibold text-brand mb-2">Driver Portal</h2>
      <p className="text-gray-500">
        Log in with your driver ID to view and accept bookings — coming soon.
      </p>
    </div>
  );
}

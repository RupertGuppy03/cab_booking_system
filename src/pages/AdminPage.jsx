/**
 * Student: Rupert Guppy (23196925)
 * File: AdminPage.jsx
 * Description: Admin panel for managing and assigning taxi bookings. Staff can search
 *              by booking reference number or view all unassigned bookings due within
 *              2 hours. Each result row has an Assign button that updates the booking
 *              status via admin.php.
 * Functions: AdminPage, validateBrn
 */

import { useState } from 'react';

const ADMIN_URL = '/api/admin';

/** Checks whether a string matches the BRN format: BRN followed by exactly 5 digits. */
function validateBrn(brn) {
  return /^BRN\d{5}$/.test(brn);
}

export default function AdminPage() {
  const [bsearch, setBsearch] = useState('');
  const [brnError, setBrnError] = useState(false);
  const [records, setRecords] = useState(null);
  const [fetchError, setFetchError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assignedBrns, setAssignedBrns] = useState(new Set());
  const [assignConfirmation, setAssignConfirmation] = useState('');

  /**
   * Validates the BRN format if input is non-empty, then POSTs to admin.php
   * with action=search and displays the returned bookings in the results table.
   */
  async function searchBookings() {
    const trimmed = bsearch.trim();
    setBrnError(false);
    setFetchError(false);
    setAssignConfirmation('');

    if (trimmed !== '' && !validateBrn(trimmed)) {
      setBrnError(true);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('action', 'search');
    formData.append('bsearch', trimmed);

    try {
      const response = await fetch(ADMIN_URL, { method: 'POST', body: formData });
      const data = await response.json();
      setRecords(data);
    } catch {
      setFetchError(true);
      setRecords(null);
    } finally {
      setLoading(false);
    }
  }

  /**
   * POSTs the given BRN to admin.php with action=assign to mark it as assigned.
   * On success, disables the row's Assign button and shows a confirmation message.
   */
  async function assignBooking(brn) {
    const formData = new FormData();
    formData.append('action', 'assign');
    formData.append('brn', brn);

    try {
      const response = await fetch(ADMIN_URL, { method: 'POST', body: formData });
      const result = await response.text();
      setAssignedBrns(prev => new Set([...prev, brn]));
      setAssignConfirmation(result);
    } catch {
      setAssignConfirmation('An error occurred while assigning the booking. Please try again.');
    }
  }

  const columns = [
    'Booking Reference', 'Customer Name', 'Phone',
    'Pickup Suburb', 'Destination Suburb', 'Pickup Date & Time', 'Status', 'Assign',
  ];

  return (
    <div className="space-y-6">

      {/* Search card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-brand mb-4">Search Bookings</h2>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            name="bsearch"
            id="bsearch"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Enter booking reference e.g. BRN00001"
            value={bsearch}
            onChange={e => setBsearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchBookings()}
          />
          <button
            name="sbutton"
            id="sbutton"
            onClick={searchBookings}
            disabled={loading}
            className="px-6 py-2 bg-brand text-white rounded text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors cursor-pointer"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        {brnError && (
          <p className="text-red-600 text-xs mt-2">
            Invalid format. Booking reference must be in the format BRN00001.
          </p>
        )}
        <p className="text-gray-400 text-xs mt-2">
          Leave blank to view all unassigned bookings due within the next 2 hours.
        </p>
      </div>

      {/* Results card */}
      <div className="content bg-white rounded-lg shadow p-6">
        {fetchError ? (
          <p className="text-gray-500 text-sm">An error occurred while retrieving bookings. Please try again.</p>
        ) : records === null ? (
          <p className="text-gray-500 text-sm">Use the search above to find bookings.</p>
        ) : records.length === 0 ? (
          <p className="text-gray-500 text-sm">No bookings found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-brand text-white">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="px-3 py-3 text-left font-normal">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map(record => {
                    const isAssigned = record.status === 'assigned' || assignedBrns.has(record.brn);
                    return (
                      <tr key={record.brn} id={`row-${record.brn}`} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2">{record.brn}</td>
                        <td className="px-3 py-2">{record.cname}</td>
                        <td className="px-3 py-2">{record.phone}</td>
                        <td className="px-3 py-2">{record.sbname}</td>
                        <td className="px-3 py-2">{record.dsbname}</td>
                        <td className="px-3 py-2">{record.pickup_date} {record.pickup_time}</td>
                        <td className="px-3 py-2" id={`status-${record.brn}`}>
                          {isAssigned ? 'assigned' : record.status}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            name="Assign"
                            id={`btn-${record.brn}`}
                            onClick={() => assignBooking(record.brn)}
                            disabled={isAssigned}
                            className={`px-3 py-1.5 rounded text-xs text-white font-medium transition-colors ${
                              isAssigned
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-brand hover:bg-brand-dark cursor-pointer'
                            }`}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {assignConfirmation && (
              <div className="mt-4 p-3 bg-green-50 border border-green-400 rounded-lg text-sm text-brand">
                {assignConfirmation}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

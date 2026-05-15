/**
 * Student: Rupert Guppy (23196925)
 * File: TripHistoryPage.jsx
 * Description: Trip history page. Customers search by phone number or BRN to view
 *              all their bookings. Upcoming trips show a Leaflet map with pickup and
 *              destination pins plus driver assignment status. Past trips show fare,
 *              addresses, and driver info. Unassigned bookings can be cancelled.
 * Functions: TripHistoryPage, TripCard, TripMap
 */

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TRIPS_URL = 'https://webdev.aut.ac.nz/~pxw1781/assign/Part2/trips.php';

const UPCOMING_STATUSES = ['unassigned', 'assigned', 'in_progress'];

const STATUS_LABELS = {
  unassigned:  'Awaiting Driver',
  assigned:    'Driver Assigned',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
};

const STATUS_COLOURS = {
  unassigned:  'bg-yellow-100 text-yellow-800',
  assigned:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-green-100 text-green-800',
  completed:   'bg-gray-100 text-gray-700',
  cancelled:   'bg-red-100 text-red-700',
};

const pickupIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#1e3a5f;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const destIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#dc2626;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

/*
  TripMap({ trip })
  Renders a small Leaflet map centred between pickup and destination pins.
  Only shown for bookings that have coordinate data in the trips table.
*/
function TripMap({ trip }) {
  const hasPickup = trip.pickup_lat !== null && trip.pickup_lat !== '0';
  const hasDest   = trip.dest_lat   !== null && trip.dest_lat   !== '0';

  if (!hasPickup) return null;

  const pickupLat = parseFloat(trip.pickup_lat);
  const pickupLng = parseFloat(trip.pickup_lng);
  const destLat   = hasDest ? parseFloat(trip.dest_lat)  : pickupLat;
  const destLng   = hasDest ? parseFloat(trip.dest_lng)  : pickupLng;

  const centerLat = (pickupLat + destLat) / 2;
  const centerLng = (pickupLng + destLng) / 2;

  return (
    <div className="mt-3 rounded overflow-hidden border border-gray-200" style={{ height: '250px' }}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <Marker position={[pickupLat, pickupLng]} icon={pickupIcon}>
          <Popup>Pickup: {trip.sbname}</Popup>
        </Marker>
        {hasDest && (
          <Marker position={[destLat, destLng]} icon={destIcon}>
            <Popup>Destination: {trip.dsbname}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

/*
  TripCard({ trip, onCancel, cancellingBrn, cancelError })
  Renders one booking card. Upcoming bookings include a map and optional cancel
  button. Past bookings show a text-only summary.
*/
function TripCard({ trip, onCancel, cancellingBrn, cancelError }) {
  const isUpcoming = UPCOMING_STATUSES.includes(trip.status);
  const fare = trip.fare_estimate && parseFloat(trip.fare_estimate) > 0
    ? `$${parseFloat(trip.fare_estimate).toFixed(2)}`
    : 'N/A';

  return (
    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-brand">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <span className="text-xs font-mono text-gray-500">{trip.brn}</span>
          <p className="font-semibold text-gray-800 mt-0.5">
            {trip.sbname} → {trip.dsbname}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {trip.pickup_date} at {trip.pickup_time}
          </p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOURS[trip.status] ?? 'bg-gray-100 text-gray-600'}`}>
          {STATUS_LABELS[trip.status] ?? trip.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <div>
          <span className="text-gray-500">Fare estimate</span>
          <p className="font-medium text-gray-800">{fare}</p>
        </div>
        <div>
          <span className="text-gray-500">Driver</span>
          <p className="font-medium text-gray-800">
            {trip.driver_id ? trip.driver_id : (isUpcoming ? 'Not yet assigned' : 'N/A')}
          </p>
        </div>
      </div>

      {isUpcoming && <TripMap trip={trip} />}

      {isUpcoming && (
        <div className="mt-3 flex items-center gap-3">
          {trip.status === 'unassigned' && (
            <button
              onClick={() => onCancel(trip.brn)}
              disabled={cancellingBrn === trip.brn}
              className="text-sm px-3 py-1.5 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {cancellingBrn === trip.brn ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          )}
          {cancelError && cancelError.brn === trip.brn && (
            <p className="text-sm text-red-600">{cancelError.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

/*
  TripHistoryPage
  Main page component. Handles search input validation, fetching from trips.php,
  and dispatching cancel requests. Renders the list of TripCards.
*/
export default function TripHistoryPage() {
  const [query, setQuery]               = useState('');
  const [trips, setTrips]               = useState(null);
  const [loading, setLoading]           = useState(false);
  const [searchError, setSearchError]   = useState('');
  const [inputError, setInputError]     = useState('');
  const [cancellingBrn, setCancellingBrn] = useState(null);
  const [cancelError, setCancelError]   = useState(null);

  function validateQuery(value) {
    const trimmed = value.trim();
    if (/^\d{10,12}$/.test(trimmed)) return { type: 'phone', value: trimmed };
    if (/^BRN\d+$/i.test(trimmed))   return { type: 'brn',   value: trimmed.toUpperCase() };
    return null;
  }

  async function handleSearch(e) {
    e.preventDefault();
    setInputError('');
    setSearchError('');
    setTrips(null);
    setCancelError(null);

    const parsed = validateQuery(query);
    if (!parsed) {
      setInputError('Enter a 10–12 digit phone number or a booking reference like BRN00001.');
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append('action', 'search');
      if (parsed.type === 'phone') body.append('phone', parsed.value);
      else                         body.append('brn',   parsed.value);

      const res  = await fetch(TRIPS_URL, { method: 'POST', body });
      const data = await res.json();

      if (data.error) {
        setSearchError(data.error);
      } else {
        setTrips(data);
      }
    } catch {
      setSearchError('Network error — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(brn) {
    setCancelError(null);
    setCancellingBrn(brn);
    try {
      const body = new FormData();
      body.append('action', 'cancel');
      body.append('brn', brn);

      const res  = await fetch(TRIPS_URL, { method: 'POST', body });
      const data = await res.json();

      if (data.error) {
        setCancelError({ brn, message: data.error });
      } else {
        setTrips(prev => prev.map(t =>
          t.brn === brn ? { ...t, status: 'cancelled' } : t
        ));
      }
    } catch {
      setCancelError({ brn, message: 'Network error — could not cancel. Please try again.' });
    } finally {
      setCancellingBrn(null);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-brand mb-1">My Trips</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter your phone number or booking reference to see your bookings.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setInputError(''); }}
              placeholder="Phone number or BRN (e.g. BRN00012)"
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
            {inputError && (
              <p className="mt-1 text-xs text-red-600">{inputError}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching…' : 'Find My Trips'}
          </button>
        </form>
      </div>

      {searchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-4">
          {searchError}
        </div>
      )}

      {trips !== null && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {trips.length === 0
              ? 'No bookings found for that phone number or booking reference.'
              : `${trips.length} booking${trips.length !== 1 ? 's' : ''} found`}
          </p>
          {trips.map(trip => (
            <TripCard
              key={trip.brn}
              trip={trip}
              onCancel={handleCancel}
              cancellingBrn={cancellingBrn}
              cancelError={cancelError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

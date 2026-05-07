/**
 * Student: Rupert Guppy (23196925)
 * File: BookingPage.jsx
 * Description: Customer-facing booking form. Default mode shows standard text address
 *              inputs (snumber, stname, sbname, dsbname). An optional map toggle reveals
 *              a Leaflet map where customers drop pins for pickup and destination;
 *              Nominatim reverse geocoding then populates the address fields and a
 *              Haversine fare estimate is shown. Text mode posts to booking.php; map
 *              mode posts to map_booking.php which also writes coordinates to the trips
 *              table.
 * Functions: BookingPage, MapClickHandler, geocodePin, haversineKm,
 *            isValidDate, isValidTime, isNotPast
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BOOKING_URL     = 'https://webdev.aut.ac.nz/~pxw1781/assign/Part2/booking.php';
const MAP_BOOKING_URL = 'https://webdev.aut.ac.nz/~pxw1781/assign/Part2/map_booking.php';
const AUCKLAND_CENTER = [-36.8485, 174.7633];
const FARE_RATE = 2.50;
const MIN_FARE  = 5.00;

const pickupIcon = L.divIcon({
  className: '',
  html: '<div style="background:#1a1a2e;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -20],
});

const destIcon = L.divIcon({
  className: '',
  html: '<div style="background:#ef4444;width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -20],
});

/** Returns the great-circle distance in km between two lat/lng points using the Haversine formula. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Checks that dateStr matches DD/MM/YYYY and represents a real calendar date. */
function isValidDate(dateStr) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return false;
  const [d, m, y] = dateStr.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** Checks that timeStr matches HH:MM in 24-hour format. */
function isValidTime(timeStr) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

/** Returns false if the combined pickup date/time is earlier than the current moment. */
function isNotPast(dateStr, timeStr) {
  const [d, m, y] = dateStr.split('/').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(y, m - 1, d, h, min) >= new Date();
}

/** Inner component that listens for map clicks and calls the provided handler. */
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function BookingPage() {
  const [fields, setFields] = useState({
    cname: '', phone: '', unumber: '', date: '', time: '',
    snumber: '', stname: '', sbname: '', dsbname: '',
  });
  const [errors, setErrors] = useState({});
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [pickupPin, setPickupPin] = useState(null);
  const [destPin, setDestPin] = useState(null);
  const [pinMode, setPinMode] = useState('pickup');
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState('');
  const [fareEstimate, setFareEstimate] = useState(null);

  /** Populates the date (DD/MM/YYYY) and time (HH:MM) fields with the current date and time on mount. */
  useEffect(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    setFields(prev => ({ ...prev, date: `${dd}/${mm}/${now.getFullYear()}`, time: `${hh}:${mi}` }));
  }, []);

  /** Updates a single field in the form state on user input. */
  function handleChange(e) {
    const { name, value } = e.target;
    setFields(prev => ({ ...prev, [name]: value }));
  }

  /** Toggles the map on or off. Clears map state and any map-related errors when hiding. */
  function toggleMap() {
    if (showMap) {
      setPickupPin(null);
      setDestPin(null);
      setFareEstimate(null);
      setGeocodeError('');
      setPinMode('pickup');
      setErrors(prev => {
        const next = { ...prev };
        delete next.pickupPin;
        delete next.destPin;
        return next;
      });
    }
    setShowMap(prev => !prev);
  }

  /** Calls Nominatim reverse geocoding for a lat/lng and updates the relevant address fields. */
  async function geocodePin(lat, lng, type) {
    setGeocoding(true);
    setGeocodeError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) throw new Error('Geocoding request failed');
      const data = await res.json();
      const addr = data.address || {};
      const suburb = addr.suburb || addr.city_district || addr.neighbourhood || addr.town || '';
      if (type === 'pickup') {
        setFields(prev => ({
          ...prev,
          snumber: addr.house_number || '',
          stname: addr.road || addr.pedestrian || addr.path || '',
          sbname: suburb,
        }));
      } else {
        setFields(prev => ({ ...prev, dsbname: suburb }));
      }
    } catch {
      setGeocodeError('Could not look up address for that location. Your pin is still saved — the coordinates will be recorded with your booking.');
    } finally {
      setGeocoding(false);
    }
  }

  /** Places a pin (pickup or destination) and triggers geocoding. Updates fare estimate when both pins are set. */
  function handleMapClick(lat, lng) {
    setGeocodeError('');
    if (pinMode === 'pickup') {
      setPickupPin({ lat, lng });
      geocodePin(lat, lng, 'pickup');
      if (destPin) {
        const km = haversineKm(lat, lng, destPin.lat, destPin.lng);
        setFareEstimate(Math.max(MIN_FARE, km * FARE_RATE));
      }
    } else {
      setDestPin({ lat, lng });
      geocodePin(lat, lng, 'dest');
      if (pickupPin) {
        const km = haversineKm(pickupPin.lat, pickupPin.lng, lat, lng);
        setFareEstimate(Math.max(MIN_FARE, km * FARE_RATE));
      }
    }
  }

  /**
   * Validates all required fields. In map mode, requires both pins to be placed.
   * In text mode, requires snumber and stname to be filled in.
   * Returns an errors object — empty means valid.
   */
  function validateForm() {
    const errs = {};
    if (!fields.cname.trim()) errs.cname = 'Please enter your name.';
    if (!/^\d{10,12}$/.test(fields.phone.trim())) errs.phone = 'Phone must be 10–12 digits, numbers only.';
    if (showMap) {
      if (!pickupPin) errs.pickupPin = 'Please drop a pickup pin on the map.';
      if (!destPin) errs.destPin = 'Please drop a destination pin on the map.';
    } else {
      if (!fields.snumber.trim()) errs.snumber = 'Please enter a street number.';
      if (!fields.stname.trim()) errs.stname = 'Please enter a street name.';
    }
    if (!isValidDate(fields.date.trim())) errs.date = 'Please enter a valid date (DD/MM/YYYY).';
    if (!isValidTime(fields.time.trim())) errs.time = 'Please enter a valid time (HH:MM).';
    if (!errs.date && !errs.time && !isNotPast(fields.date.trim(), fields.time.trim())) {
      errs.datetime = 'Pickup date and time cannot be in the past.';
    }
    return errs;
  }

  /**
   * Validates the form then POSTs to the appropriate endpoint.
   * Text mode → booking.php. Map mode → map_booking.php (also records coordinates in trips).
   */
  async function submitBooking() {
    const errs = validateForm();
    setErrors(errs);
    setConfirmation('');
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const formData = new FormData();
    ['cname', 'phone', 'unumber', 'snumber', 'stname', 'sbname', 'dsbname', 'date', 'time'].forEach(
      key => formData.append(key, fields[key].trim())
    );

    const endpoint = showMap ? MAP_BOOKING_URL : BOOKING_URL;
    if (showMap) {
      formData.append('pickup_lat', pickupPin.lat);
      formData.append('pickup_lng', pickupPin.lng);
      formData.append('dest_lat', destPin.lat);
      formData.append('dest_lng', destPin.lng);
      formData.append('fare_estimate', fareEstimate ? fareEstimate.toFixed(2) : '0.00');
    }

    try {
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      setConfirmation(await response.text());
    } catch {
      setConfirmation('An error occurred while submitting your booking. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand';
  const labelClass = 'block text-sm font-bold mb-1';
  const dividerClass = 'text-xs uppercase tracking-widest text-gray-400 mt-5 mb-3 border-b border-gray-200 pb-1';

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-3xl">
      <h2 className="text-xl font-semibold text-brand mb-2">New Booking</h2>

      {/* Your Details */}
      <p className={dividerClass}>Your Details</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="cname">Customer Name</label>
          <input className={inputClass} id="cname" name="cname" placeholder="Full name" value={fields.cname} onChange={handleChange} />
          {errors.cname && <p className="text-red-600 text-xs mt-1">{errors.cname}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Phone Number</label>
          <input className={inputClass} id="phone" name="phone" placeholder="10–12 digit number" value={fields.phone} onChange={handleChange} />
          {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>
      <div className="mt-4 max-w-xs">
        <label className={labelClass}>Unit Number <span className="font-normal text-gray-400 text-xs">(optional)</span></label>
        <input className={inputClass} name="unumber" placeholder="e.g. 2A" value={fields.unumber} onChange={handleChange} />
      </div>

      {/* Pickup Address — text inputs, hidden when map is active */}
      {!showMap && (
        <>
          <p className={dividerClass}>Pickup Address</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass} htmlFor="snumber">Street Number</label>
              <input className={inputClass} id="snumber" name="snumber" placeholder="e.g. 45" value={fields.snumber} onChange={handleChange} />
              {errors.snumber && <p className="text-red-600 text-xs mt-1">{errors.snumber}</p>}
            </div>
            <div>
              <label className={labelClass} htmlFor="stname">Street Name</label>
              <input className={inputClass} id="stname" name="stname" placeholder="e.g. Queen Street" value={fields.stname} onChange={handleChange} />
              {errors.stname && <p className="text-red-600 text-xs mt-1">{errors.stname}</p>}
            </div>
          </div>
          <div className="max-w-xs">
            <label className={labelClass}>Suburb <span className="font-normal text-gray-400 text-xs">(optional)</span></label>
            <input className={inputClass} name="sbname" placeholder="e.g. Auckland CBD" value={fields.sbname} onChange={handleChange} />
          </div>
        </>
      )}

      {/* Map Toggle Button */}
      <div className="mt-5">
        <button
          type="button"
          onClick={toggleMap}
          className={`w-full py-2 text-sm rounded font-medium border transition-colors cursor-pointer ${
            showMap
              ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
              : 'bg-white text-brand border-brand hover:bg-brand hover:text-white'
          }`}
        >
          {showMap ? '✕ Hide Map — Enter Address Manually' : '📍 Select Location on Map'}
        </button>
      </div>

      {/* Map Section — shown only when showMap is true */}
      {showMap && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-3">Select which pin to place, then click the map to set your location.</p>

          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setPinMode('pickup')}
              className={`flex-1 py-2 text-sm rounded font-medium border transition-colors cursor-pointer ${
                pinMode === 'pickup'
                  ? 'bg-brand text-white border-brand'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-brand'
              }`}
            >
              {pickupPin ? '✓ Pickup Set' : 'Set Pickup Pin'}
            </button>
            <button
              type="button"
              onClick={() => setPinMode('dest')}
              className={`flex-1 py-2 text-sm rounded font-medium border transition-colors cursor-pointer ${
                pinMode === 'dest'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-red-400'
              }`}
            >
              {destPin ? '✓ Destination Set' : 'Set Destination Pin'}
            </button>
          </div>

          {(errors.pickupPin || errors.destPin) && (
            <p className="text-red-600 text-xs mb-2">{errors.pickupPin || errors.destPin}</p>
          )}

          <div className="rounded overflow-hidden border border-gray-200 mb-3" style={{ height: '300px' }}>
            <MapContainer center={AUCKLAND_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {pickupPin && (
                <Marker position={[pickupPin.lat, pickupPin.lng]} icon={pickupIcon}>
                  <Popup>Pickup</Popup>
                </Marker>
              )}
              {destPin && (
                <Marker position={[destPin.lat, destPin.lng]} icon={destIcon}>
                  <Popup>Destination</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>

          {geocoding && <p className="text-xs text-gray-500 mb-2">Locating address…</p>}
          {geocodeError && <p className="text-xs text-red-500 mb-2">{geocodeError}</p>}

          {(pickupPin || destPin) && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 text-sm mb-3 space-y-1">
              {pickupPin && (
                <p className="text-gray-700">
                  <span className="font-semibold text-brand">Pickup:</span>{' '}
                  {[fields.snumber, fields.stname, fields.sbname].filter(Boolean).join(', ') || 'Address loading…'}
                </p>
              )}
              {destPin && (
                <p className="text-gray-700">
                  <span className="font-semibold text-red-500">Destination:</span>{' '}
                  {fields.dsbname || 'Suburb loading…'}
                </p>
              )}
              {fareEstimate !== null && (
                <p className="text-gray-800 font-medium pt-1 border-t border-gray-200 mt-1">
                  Estimated fare: <span className="text-brand">${fareEstimate.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Destination & Pickup Time */}
      <p className={dividerClass}>Destination &amp; Pickup Time</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Destination Suburb <span className="font-normal text-gray-400 text-xs">(optional)</span></label>
          <input
            className={inputClass}
            name="dsbname"
            placeholder="e.g. Newmarket"
            value={fields.dsbname}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="date">Pickup Date</label>
          <input className={inputClass} id="date" name="date" placeholder="DD/MM/YYYY" value={fields.date} onChange={handleChange} />
          {errors.date && <p className="text-red-600 text-xs mt-1">{errors.date}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="time">Pickup Time</label>
          <input className={inputClass} id="time" name="time" placeholder="HH:MM" value={fields.time} onChange={handleChange} />
          {errors.time && <p className="text-red-600 text-xs mt-1">{errors.time}</p>}
        </div>
      </div>
      {errors.datetime && <p className="text-red-600 text-xs mt-2">{errors.datetime}</p>}

      <button
        onClick={submitBooking}
        disabled={loading}
        className="w-full mt-6 py-3 bg-brand text-white rounded font-medium text-sm hover:bg-brand-dark disabled:opacity-50 transition-colors cursor-pointer"
      >
        {loading ? 'Submitting…' : 'Confirm Booking'}
      </button>

      {confirmation && (
        <div className="mt-6 p-4 bg-green-50 border border-green-400 rounded-lg">
          <p id="reference" className="text-sm text-brand leading-relaxed" dangerouslySetInnerHTML={{ __html: confirmation }} />
        </div>
      )}
    </div>
  );
}

/**
 * Student: Rupert Guppy (23196925)
 * File: BookingPage.jsx
 * Description: Customer-facing booking form. Collects passenger details and pickup
 *              information, validates all fields client-side, and POSTs to the
 *              booking.php endpoint on webdev. Displays the BRN confirmation message
 *              returned by the server on success.
 * Functions: BookingPage, isValidDate, isValidTime, isNotPast
 */

import { useState, useEffect } from 'react';

const BOOKING_URL = '/api/booking';

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

export default function BookingPage() {
  const [fields, setFields] = useState({
    cname: '', phone: '', unumber: '', snumber: '',
    stname: '', sbname: '', dsbname: '', date: '', time: '',
  });
  const [errors, setErrors] = useState({});
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

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

  /** Validates all required fields. Returns an errors object — empty means valid. */
  function validateForm() {
    const errs = {};
    if (!fields.cname.trim()) errs.cname = 'Please enter your name.';
    if (!/^\d{10,12}$/.test(fields.phone.trim())) errs.phone = 'Phone must be 10–12 digits, numbers only.';
    if (!fields.snumber.trim()) errs.snumber = 'Please enter a street number.';
    if (!fields.stname.trim()) errs.stname = 'Please enter a street name.';
    if (!isValidDate(fields.date.trim())) errs.date = 'Please enter a valid date (DD/MM/YYYY).';
    if (!isValidTime(fields.time.trim())) errs.time = 'Please enter a valid time (HH:MM).';
    if (!errs.date && !errs.time && !isNotPast(fields.date.trim(), fields.time.trim())) {
      errs.datetime = 'Pickup date and time cannot be in the past.';
    }
    return errs;
  }

  /** Validates the form, then POSTs all field values to booking.php and shows the confirmation message. */
  async function submitBooking() {
    const errs = validateForm();
    setErrors(errs);
    setConfirmation('');
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const formData = new FormData();
    Object.entries(fields).forEach(([key, val]) => formData.append(key, val.trim()));

    try {
      const response = await fetch(BOOKING_URL, { method: 'POST', body: formData });
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

      {/* Pickup Address */}
      <p className={dividerClass}>Pickup Address</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelClass}>Unit Number <span className="font-normal text-gray-400 text-xs">(optional)</span></label>
          <input className={inputClass} name="unumber" placeholder="e.g. 2A" value={fields.unumber} onChange={handleChange} />
        </div>
        <div>
          <label className={labelClass} htmlFor="snumber">Street Number</label>
          <input className={inputClass} id="snumber" name="snumber" placeholder="e.g. 45" value={fields.snumber} onChange={handleChange} />
          {errors.snumber && <p className="text-red-600 text-xs mt-1">{errors.snumber}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="stname">Street Name</label>
          <input className={inputClass} id="stname" name="stname" placeholder="e.g. Queen Street" value={fields.stname} onChange={handleChange} />
          {errors.stname && <p className="text-red-600 text-xs mt-1">{errors.stname}</p>}
        </div>
        <div>
          <label className={labelClass}>Suburb <span className="font-normal text-gray-400 text-xs">(optional)</span></label>
          <input className={inputClass} name="sbname" placeholder="e.g. Auckland CBD" value={fields.sbname} onChange={handleChange} />
        </div>
      </div>

      {/* Destination & Pickup Time */}
      <p className={dividerClass}>Destination &amp; Pickup Time</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Destination Suburb <span className="font-normal text-gray-400 text-xs">(optional)</span></label>
          <input className={inputClass} name="dsbname" placeholder="e.g. Newmarket" value={fields.dsbname} onChange={handleChange} />
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

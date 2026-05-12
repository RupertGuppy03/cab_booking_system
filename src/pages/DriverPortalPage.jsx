/**
 * Student: Rupert Guppy (23196925)
 * File: DriverPortalPage.jsx
 * Description: Driver portal page. Drivers log in with a driver ID and can view
 *              unassigned bookings, claim them, and progress each job through
 *              assigned → in_progress → completed via driver.php.
 * Functions: DriverPortalPage, post
 */

import { useState, useEffect, useCallback } from 'react';

const DRIVER_URL = 'https://webdev.aut.ac.nz/~pxw1781/assign/Part2/driver.php';

/** Posts form data to driver.php and returns the parsed JSON response. */
async function post(params) {
  const fd = new FormData();
  Object.entries(params).forEach(([k, v]) => fd.append(k, v));
  const res = await fetch(DRIVER_URL, { method: 'POST', body: fd });
  return res.json();
}

const STATUS_LABELS = {
  unassigned: 'Unassigned',
  assigned:   'Assigned',
  in_progress: 'In Progress',
  completed:  'Completed',
};

const STATUS_COLOURS = {
  unassigned:  'bg-gray-100 text-gray-700',
  assigned:    'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed:   'bg-green-100 text-green-700',
};

export default function DriverPortalPage() {
  const [driver,        setDriver]       = useState(null);
  const [driverIdInput, setDriverIdInput] = useState('');
  const [loginError,    setLoginError]   = useState('');
  const [loginLoading,  setLoginLoading] = useState(false);

  const [myBookings,   setMyBookings]  = useState([]);
  const [unassigned,   setUnassigned]  = useState([]);
  const [fetchError,   setFetchError]  = useState('');
  const [fetchLoading, setFetchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(new Set());
  const [actionErrors,  setActionErrors]  = useState({});

  /**
   * Fetches the driver's active jobs and the unassigned booking pool in parallel.
   * Memoised so it can be called from action handlers and the auto-refresh interval.
   */
  const loadDashboard = useCallback(async () => {
    if (!driver) return;
    setFetchError('');
    setFetchLoading(true);
    try {
      const [myData, poolData] = await Promise.all([
        post({ action: 'get_my_bookings', driver_id: driver.driver_id }),
        post({ action: 'get_unassigned' }),
      ]);

      const errors = [];
      if (Array.isArray(myData))  setMyBookings(myData);
      else errors.push(myData.error  || 'Failed to load your active jobs.');

      if (Array.isArray(poolData)) setUnassigned(poolData);
      else errors.push(poolData.error || 'Failed to load available bookings.');

      if (errors.length > 0) setFetchError(errors.join(' '));
    } catch {
      setFetchError('Network error while loading bookings. Please use the Refresh button to try again.');
    } finally {
      setFetchLoading(false);
    }
  }, [driver]);

  /** Load dashboard on login and auto-refresh every 30 seconds. */
  useEffect(() => {
    if (!driver) return;
    loadDashboard();
    const id = setInterval(loadDashboard, 30000);
    return () => clearInterval(id);
  }, [driver, loadDashboard]);

  /** Verifies the typed driver ID against the drivers table and logs in on success. */
  async function handleLogin() {
    const trimmed = driverIdInput.trim();
    setLoginError('');

    if (!trimmed) {
      setLoginError('Please enter your driver ID.');
      return;
    }

    setLoginLoading(true);
    try {
      const data = await post({ action: 'login', driver_id: trimmed });
      if (data.error) {
        setLoginError(data.error);
      } else {
        setDriver({ driver_id: trimmed, name: data.name, area: data.area });
      }
    } catch {
      setLoginError('Network error. Please check your connection and try again.');
    } finally {
      setLoginLoading(false);
    }
  }

  /** Claims an unassigned booking for this driver and refreshes both lists. */
  async function handleClaim(brn) {
    setActionLoading(prev => new Set([...prev, brn]));
    setActionErrors(prev => { const e = { ...prev }; delete e[brn]; return e; });
    try {
      const data = await post({ action: 'claim', driver_id: driver.driver_id, brn });
      if (data.error) {
        setActionErrors(prev => ({ ...prev, [brn]: data.error }));
      } else {
        await loadDashboard();
      }
    } catch {
      setActionErrors(prev => ({ ...prev, [brn]: 'Network error. Please try again.' }));
    } finally {
      setActionLoading(prev => { const s = new Set(prev); s.delete(brn); return s; });
    }
  }

  /** Advances a booking to new_status (in_progress or completed) and refreshes. */
  async function handleUpdateStatus(brn, newStatus) {
    setActionLoading(prev => new Set([...prev, brn]));
    setActionErrors(prev => { const e = { ...prev }; delete e[brn]; return e; });
    try {
      const data = await post({ action: 'update_status', driver_id: driver.driver_id, brn, new_status: newStatus });
      if (data.error) {
        setActionErrors(prev => ({ ...prev, [brn]: data.error }));
      } else {
        await loadDashboard();
      }
    } catch {
      setActionErrors(prev => ({ ...prev, [brn]: 'Network error. Please try again.' }));
    } finally {
      setActionLoading(prev => { const s = new Set(prev); s.delete(brn); return s; });
    }
  }

  /** Logs the driver out and resets all dashboard state. */
  function handleLogout() {
    setDriver(null);
    setDriverIdInput('');
    setMyBookings([]);
    setUnassigned([]);
    setFetchError('');
    setActionErrors({});
  }

  /* ── LOGIN VIEW ──────────────────────────────────────────────────────── */
  if (!driver) {
    return (
      <div className="flex justify-center">
        <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
          <h2 className="text-xl font-semibold text-brand mb-6">Driver Login</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="driver_id" className="block text-sm font-medium text-gray-700 mb-1">
                Driver ID
              </label>
              <input
                id="driver_id"
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="e.g. DRV001"
                value={driverIdInput}
                onChange={e => setDriverIdInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {loginError && (
              <p className="text-red-600 text-sm">{loginError}</p>
            )}
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full py-2 bg-brand text-white rounded text-sm font-medium hover:bg-brand-dark disabled:opacity-50 transition-colors cursor-pointer"
            >
              {loginLoading ? 'Logging in…' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── DASHBOARD VIEW ──────────────────────────────────────────────────── */
  const columns = ['Booking Ref', 'Customer', 'Phone', 'Pickup Suburb', 'Destination', 'Date & Time', 'Status'];

  /** Renders a single booking row with a caller-supplied action cell. */
  function renderRow(b, actionCell) {
    const isActing = actionLoading.has(b.brn);
    const err = actionErrors[b.brn];
    return (
      <tr key={b.brn} className="border-b border-gray-100 last:border-0">
        <td className="px-3 py-2">{b.brn}</td>
        <td className="px-3 py-2">{b.cname}</td>
        <td className="px-3 py-2">{b.phone}</td>
        <td className="px-3 py-2">{b.sbname}</td>
        <td className="px-3 py-2">{b.dsbname}</td>
        <td className="px-3 py-2 whitespace-nowrap">{b.pickup_date} {b.pickup_time}</td>
        <td className="px-3 py-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOURS[b.status] || ''}`}>
            {STATUS_LABELS[b.status] || b.status}
          </span>
        </td>
        <td className="px-3 py-2">
          {err && <p className="text-red-600 text-xs mb-1">{err}</p>}
          {actionCell(b, isActing)}
        </td>
      </tr>
    );
  }

  return (
    <div className="space-y-6">

      {/* Driver header strip */}
      <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-semibold text-brand text-lg">{driver.name}</p>
          <p className="text-gray-500 text-sm">{driver.driver_id} &middot; {driver.area}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboard}
            disabled={fetchLoading}
            className="px-4 py-1.5 border border-brand text-brand rounded text-sm hover:bg-brand hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
          >
            {fetchLoading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      {fetchError && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* My Active Jobs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Active Jobs</h3>
        {myBookings.length === 0 ? (
          <p className="text-gray-500 text-sm">No active jobs right now.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-brand text-white">
                <tr>
                  {[...columns, 'Action'].map(col => (
                    <th key={col} className="px-3 py-3 text-left font-normal">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myBookings.map(b => renderRow(b, (booking, isActing) => (
                  <>
                    {booking.status === 'assigned' && (
                      <button
                        onClick={() => handleUpdateStatus(booking.brn, 'in_progress')}
                        disabled={isActing}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                      >
                        {isActing ? '…' : 'Start Trip'}
                      </button>
                    )}
                    {booking.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(booking.brn, 'completed')}
                        disabled={isActing}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                      >
                        {isActing ? '…' : 'Complete Trip'}
                      </button>
                    )}
                  </>
                )))}

              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Bookings</h3>
        {unassigned.length === 0 ? (
          <p className="text-gray-500 text-sm">No unassigned bookings available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-brand text-white">
                <tr>
                  {[...columns, 'Claim'].map(col => (
                    <th key={col} className="px-3 py-3 text-left font-normal">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unassigned.map(b => renderRow(b, (booking, isActing) => (
                  <button
                    onClick={() => handleClaim(booking.brn)}
                    disabled={isActing}
                    className="px-3 py-1 bg-brand text-white rounded text-xs hover:bg-brand-dark disabled:opacity-50 cursor-pointer"
                  >
                    {isActing ? '…' : 'Claim'}
                  </button>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

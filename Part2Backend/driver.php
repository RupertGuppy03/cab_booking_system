<?php
/*
  Student: Rupert Guppy (23196925)
  File: driver.php
  Description: Part 2 backend handler for the CabsOnline driver portal. Handles driver
               authentication, booking retrieval, booking claiming, and booking status
               progression through assigned → in_progress → completed. All responses
               are JSON-encoded.

  Functions:
    - sanitise_input():         Trims whitespace and strips HTML/PHP tags from a string.
    - handle_login():           Verifies a driver ID exists in the drivers table and
                                returns the driver's name and area on success.
    - handle_get_unassigned():  Returns all bookings with status 'unassigned'.
    - handle_get_my_bookings(): Returns active bookings (assigned or in_progress)
                                belonging to the given driver.
    - handle_claim():           Atomically claims an unassigned booking for a driver.
    - handle_update_status():   Advances a booking's status along the allowed path
                                (assigned → in_progress → completed).
*/

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }
header('Content-Type: application/json');

define('DB_HOST', 'localhost');
define('DB_USER', 'pxw1781');
define('DB_PASS', 'uhqdtgqqoqcjwsrogzppzinqasodkdl');
define('DB_NAME', 'pxw1781');

/*
  sanitise_input(value)
  Trims whitespace and strips tags from a user-supplied string.
  Returns the cleaned string.
*/
function sanitise_input($value) {
    return strip_tags(trim($value));
}

/*
  handle_login(conn, driver_id)
  Looks up the driver_id in the drivers table.
  Returns JSON with name and area on success, or a JSON error on failure.
*/
function handle_login($conn, $driver_id) {
    if ($driver_id === '') {
        echo json_encode(['error' => 'Please enter your driver ID.']);
        return;
    }

    $stmt = mysqli_prepare($conn,
        "SELECT name, area FROM drivers WHERE driver_id = ?"
    );
    mysqli_stmt_bind_param($stmt, 's', $driver_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $row = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    if ($row) {
        echo json_encode(['name' => $row['name'], 'area' => $row['area']]);
    } else {
        echo json_encode(['error' => 'Driver ID not found. Please check your credentials.']);
    }
}

/*
  handle_get_unassigned(conn)
  Returns all bookings with status 'unassigned' as a JSON array,
  ordered by booking creation time ascending.
*/
function handle_get_unassigned($conn) {
    $stmt = mysqli_prepare($conn,
        "SELECT brn, cname, phone, sbname, dsbname, pickup_date, pickup_time, status
         FROM bookings
         WHERE status = 'unassigned'
         ORDER BY booking_datetime ASC"
    );
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $records = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $records[] = $row;
    }

    mysqli_stmt_close($stmt);
    echo json_encode($records);
}

/*
  handle_get_my_bookings(conn, driver_id)
  Returns bookings assigned to this driver that are still active
  (status is 'assigned' or 'in_progress'), as a JSON array.
*/
function handle_get_my_bookings($conn, $driver_id) {
    $stmt = mysqli_prepare($conn,
        "SELECT brn, cname, phone, sbname, dsbname, pickup_date, pickup_time, status
         FROM bookings
         WHERE driver_id = ? AND status IN ('assigned', 'in_progress')
         ORDER BY booking_datetime ASC"
    );
    mysqli_stmt_bind_param($stmt, 's', $driver_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $records = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $records[] = $row;
    }

    mysqli_stmt_close($stmt);
    echo json_encode($records);
}

/*
  handle_claim(conn, driver_id, brn)
  Atomically claims an unassigned booking by setting status to 'assigned'
  and recording the driver_id. Returns a JSON error if the booking was
  already claimed by another driver.
*/
function handle_claim($conn, $driver_id, $brn) {
    if ($driver_id === '' || $brn === '') {
        echo json_encode(['error' => 'Missing driver ID or booking reference.']);
        return;
    }

    $stmt = mysqli_prepare($conn,
        "UPDATE bookings SET status = 'assigned', driver_id = ?
         WHERE brn = ? AND status = 'unassigned'"
    );
    mysqli_stmt_bind_param($stmt, 'ss', $driver_id, $brn);
    mysqli_stmt_execute($stmt);
    $affected = mysqli_stmt_affected_rows($stmt);
    mysqli_stmt_close($stmt);

    if ($affected > 0) {
        $stmt2 = mysqli_prepare($conn,
            "UPDATE trips SET driver_id = ? WHERE brn = ?"
        );
        mysqli_stmt_bind_param($stmt2, 'ss', $driver_id, $brn);
        mysqli_stmt_execute($stmt2);
        mysqli_stmt_close($stmt2);

        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Booking ' . $brn . ' could not be claimed — it may have already been taken.']);
    }
}

/*
  handle_update_status(conn, driver_id, brn, new_status)
  Advances a booking's status along the allowed path:
    assigned → in_progress → completed
  The driver_id must match to prevent drivers from updating each other's jobs.
*/
function handle_update_status($conn, $driver_id, $brn, $new_status) {
    $allowed_transitions = [
        'in_progress' => 'assigned',
        'completed'   => 'in_progress',
    ];

    if (!array_key_exists($new_status, $allowed_transitions)) {
        echo json_encode(['error' => 'Invalid status transition.']);
        return;
    }

    $required_current = $allowed_transitions[$new_status];

    $stmt = mysqli_prepare($conn,
        "UPDATE bookings SET status = ?
         WHERE brn = ? AND driver_id = ? AND status = ?"
    );
    mysqli_stmt_bind_param($stmt, 'ssss', $new_status, $brn, $driver_id, $required_current);
    mysqli_stmt_execute($stmt);
    $affected = mysqli_stmt_affected_rows($stmt);
    mysqli_stmt_close($stmt);

    if ($affected > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Could not update booking ' . $brn . '. Please refresh and try again.']);
    }
}

/*
  Main execution — only runs when the request method is POST.
  Reads all shared POST fields upfront, then dispatches to the handler
  matching the action field.
*/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if (!$conn) {
        echo json_encode(['error' => 'Database connection failed.']);
        exit;
    }

    $action     = sanitise_input($_POST['action']     ?? '');
    $driver_id  = sanitise_input($_POST['driver_id']  ?? '');
    $brn        = sanitise_input($_POST['brn']        ?? '');
    $new_status = sanitise_input($_POST['new_status'] ?? '');

    switch ($action) {
        case 'login':
            handle_login($conn, $driver_id);
            break;
        case 'get_unassigned':
            handle_get_unassigned($conn);
            break;
        case 'get_my_bookings':
            handle_get_my_bookings($conn, $driver_id);
            break;
        case 'claim':
            handle_claim($conn, $driver_id, $brn);
            break;
        case 'update_status':
            handle_update_status($conn, $driver_id, $brn, $new_status);
            break;
        default:
            echo json_encode(['error' => 'Invalid action.']);
    }

    mysqli_close($conn);
}
?>

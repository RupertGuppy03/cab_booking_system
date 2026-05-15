<?php
/*
  Student: Rupert Guppy (23196925)
  File: trips.php
  Description: Part 2 backend handler for the trip history and cancellation features.
               Supports two actions: 'search' returns all bookings matching a phone number
               or BRN (joined with the trips table for coordinates/fare and the reviews
               table for rating data), and 'cancel' sets an unassigned booking's status
               to 'cancelled'.

  Functions:
    - sanitise_input():   Trims whitespace and strips HTML/PHP tags from a string.
    - handle_search():    LEFT JOINs bookings with trips and reviews, returns rows as JSON.
    - handle_cancel():    Cancels an unassigned booking by BRN, returns JSON result.
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
  handle_search(conn, phone, brn)
  Searches for bookings by phone number or BRN. LEFT JOINs the trips table for
  coordinates and fare, and the reviews table for submitted rating data.
  Returns a JSON array ordered with upcoming trips first, then past trips.
*/
function handle_search($conn, $phone, $brn) {
    if ($phone === '' && $brn === '') {
        echo json_encode(['error' => 'Please provide a phone number or booking reference.']);
        return;
    }

    $base_query = "
        SELECT
            b.brn, b.cname, b.phone, b.sbname, b.dsbname,
            b.pickup_date, b.pickup_time, b.status, b.booking_datetime,
            b.driver_id,
            t.pickup_lat, t.pickup_lng, t.dest_lat, t.dest_lng,
            t.fare_estimate,
            r.rating AS review_rating, r.comment AS review_comment
        FROM bookings b
        LEFT JOIN trips t ON b.brn = t.brn
        LEFT JOIN reviews r ON b.brn = r.brn
        WHERE ";

    if ($brn !== '') {
        $stmt = mysqli_prepare($conn, $base_query . "b.brn = ?
            ORDER BY
                FIELD(b.status, 'unassigned', 'assigned', 'in_progress', 'completed', 'cancelled'),
                b.pickup_date ASC"
        );
        mysqli_stmt_bind_param($stmt, 's', $brn);
    } else {
        $stmt = mysqli_prepare($conn, $base_query . "b.phone = ?
            ORDER BY
                FIELD(b.status, 'unassigned', 'assigned', 'in_progress', 'completed', 'cancelled'),
                b.pickup_date ASC"
        );
        mysqli_stmt_bind_param($stmt, 's', $phone);
    }

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
  handle_cancel(conn, brn)
  Sets a booking's status to 'cancelled' only if it is currently 'unassigned'.
  Returns JSON success or error based on affected rows.
*/
function handle_cancel($conn, $brn) {
    if ($brn === '') {
        echo json_encode(['error' => 'Missing booking reference.']);
        return;
    }

    $stmt = mysqli_prepare($conn,
        "UPDATE bookings SET status = 'cancelled' WHERE brn = ? AND status = 'unassigned'"
    );
    mysqli_stmt_bind_param($stmt, 's', $brn);
    mysqli_stmt_execute($stmt);
    $affected = mysqli_stmt_affected_rows($stmt);
    mysqli_stmt_close($stmt);

    if ($affected > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Booking ' . $brn . ' could not be cancelled — it may have already been assigned or cancelled.']);
    }
}

/*
  Main execution — only runs when the request method is POST.
  Reads action, phone, and brn from POST, then dispatches to the matching handler.
*/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if (!$conn) {
        echo json_encode(['error' => 'Database connection failed. Please try again later.']);
        exit;
    }

    $action = sanitise_input($_POST['action'] ?? '');
    $phone  = sanitise_input($_POST['phone']  ?? '');
    $brn    = sanitise_input($_POST['brn']    ?? '');

    switch ($action) {
        case 'search':
            handle_search($conn, $phone, $brn);
            break;
        case 'cancel':
            handle_cancel($conn, $brn);
            break;
        default:
            echo json_encode(['error' => 'Invalid action.']);
    }

    mysqli_close($conn);
}
?>

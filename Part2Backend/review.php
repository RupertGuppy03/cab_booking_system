<?php
/*
  Student: Rupert Guppy (23196925)
  File: review.php
  Description: Part 2 backend handler for the customer rating and review feature.
               Customers can submit a 1-5 star rating and optional comment for a
               completed booking. Drivers can retrieve all reviews left for their trips.

  Functions:
    - sanitise_input():        Trims whitespace and strips HTML/PHP tags from a string.
    - handle_submit():         Inserts a new review for a completed booking into the reviews table.
    - handle_get_for_driver(): Returns all reviews left for a given driver, joined with booking info.
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
  handle_submit(conn, brn, rating, comment, driver_id)
  Inserts a review row for the given BRN. Rating must be 1-5.
  The UNIQUE constraint on brn prevents duplicate submissions.
  Stores NULL for driver_id if none is provided.
*/
function handle_submit($conn, $brn, $rating, $comment, $driver_id) {
    if ($brn === '') {
        echo json_encode(['error' => 'Missing booking reference.']);
        return;
    }

    $rating_int = (int)$rating;
    if ($rating_int < 1 || $rating_int > 5) {
        echo json_encode(['error' => 'Rating must be between 1 and 5.']);
        return;
    }

    $stmt = mysqli_prepare($conn,
        "INSERT INTO reviews (brn, driver_id, rating, comment)
         VALUES (?, NULLIF(?, ''), ?, ?)"
    );
    mysqli_stmt_bind_param($stmt, 'ssis', $brn, $driver_id, $rating_int, $comment);
    $ok = mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    if (!$ok) {
        if (mysqli_errno($conn) === 1062) {
            echo json_encode(['error' => 'You have already submitted a review for this booking.']);
        } else {
            echo json_encode(['error' => 'Failed to save review. Please try again.']);
        }
        return;
    }

    echo json_encode(['success' => true]);
}

/*
  handle_get_for_driver(conn, driver_id)
  Returns all reviews for the given driver, joined with the bookings table
  to include the customer name. Ordered newest first.
*/
function handle_get_for_driver($conn, $driver_id) {
    if ($driver_id === '') {
        echo json_encode(['error' => 'Missing driver ID.']);
        return;
    }

    $stmt = mysqli_prepare($conn,
        "SELECT r.brn, r.rating, r.comment, r.created_at, b.cname
         FROM reviews r
         LEFT JOIN bookings b ON r.brn = b.brn
         WHERE r.driver_id = ?
         ORDER BY r.created_at DESC"
    );
    mysqli_stmt_bind_param($stmt, 's', $driver_id);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);

    $rows = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $rows[] = $row;
    }
    mysqli_stmt_close($stmt);

    echo json_encode($rows);
}

/*
  Main execution — only runs when the request method is POST.
  Reads action and relevant POST fields, then dispatches to the matching handler.
*/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if (!$conn) {
        echo json_encode(['error' => 'Database connection failed. Please try again later.']);
        exit;
    }

    $action    = sanitise_input($_POST['action']    ?? '');
    $brn       = sanitise_input($_POST['brn']       ?? '');
    $rating    = sanitise_input($_POST['rating']    ?? '');
    $comment   = sanitise_input($_POST['comment']   ?? '');
    $driver_id = sanitise_input($_POST['driver_id'] ?? '');

    switch ($action) {
        case 'submit':
            handle_submit($conn, $brn, $rating, $comment, $driver_id);
            break;
        case 'get_for_driver':
            handle_get_for_driver($conn, $driver_id);
            break;
        default:
            echo json_encode(['error' => 'Invalid action.']);
    }

    mysqli_close($conn);
}
?>

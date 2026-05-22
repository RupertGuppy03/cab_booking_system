<?php
/*
  Student: Rupert Guppy (23196925)
  File: admin.php
  Description: Part 2 backend handler for the CabsOnline admin panel. Responds to two
               types of POST requests from the React frontend — booking searches and
               taxi assignment updates. For searches, returns a JSON array of matching
               bookings. For assignments, updates a booking's status to assigned and
               returns a plain text confirmation message.

  Functions:
    - sanitise_input(): Trims whitespace and strips HTML/PHP tags from a string.
    - handle_search():  Queries the database for a specific BRN or all unassigned
                        bookings due within 2 hours. Returns results as JSON.
    - handle_assign():  Updates a booking's status from unassigned to assigned.
                        Returns a plain text confirmation message.
*/

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

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
  handle_search(conn, bsearch)
  If bsearch is non-empty, queries for the record matching that BRN.
  If bsearch is empty, returns all unassigned bookings with a pickup time
  within 2 hours of the current server time.
  Returns the results as a JSON-encoded array.
*/
function handle_search($conn, $bsearch) {
    if ($bsearch !== '') {
        $stmt = mysqli_prepare($conn,
            "SELECT b.brn, b.cname, b.phone, b.sbname, b.dsbname,
                    b.pickup_date, b.pickup_time, b.status, t.driver_id
             FROM bookings b
             LEFT JOIN trips t ON t.brn = b.brn
             WHERE b.brn = ?"
        );
        mysqli_stmt_bind_param($stmt, 's', $bsearch);

    } else {
        $stmt = mysqli_prepare($conn,
            "SELECT b.brn, b.cname, b.phone, b.sbname, b.dsbname,
                    b.pickup_date, b.pickup_time, b.status, t.driver_id
             FROM bookings b
             LEFT JOIN trips t ON t.brn = b.brn
             WHERE b.status = 'unassigned'
             AND STR_TO_DATE(CONCAT(b.pickup_date, ' ', b.pickup_time), '%d/%m/%Y %H:%i')
             BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 2 HOUR)"
        );
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
  handle_assign(conn, brn)
  Updates the status of the booking matching the given BRN from unassigned
  to assigned. Returns a plain text confirmation message.
*/
function handle_assign($conn, $brn) {
    $stmt = mysqli_prepare($conn,
        "UPDATE bookings SET status = 'assigned' WHERE brn = ? AND status = 'unassigned'"
    );
    mysqli_stmt_bind_param($stmt, 's', $brn);
    $success = mysqli_stmt_execute($stmt);

    if ($success && mysqli_stmt_affected_rows($stmt) > 0) {
        echo "Congratulations! Booking request {$brn} has been assigned!";
    } else {
        echo "Unable to assign booking {$brn}. It may already be assigned or does not exist.";
    }

    mysqli_stmt_close($stmt);
}

/*
  Main execution — only runs when the request method is POST.
  Reads the action field to determine whether to run a search or an assignment.
*/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if (!$conn) {
        echo json_encode([]);
        exit;
    }

    $action = sanitise_input($_POST['action']);

    if ($action === 'search') {
        $bsearch = sanitise_input($_POST['bsearch']);
        handle_search($conn, $bsearch);

    } else if ($action === 'assign') {
        $brn = sanitise_input($_POST['brn']);
        handle_assign($conn, $brn);
    }

    mysqli_close($conn);
}
?>

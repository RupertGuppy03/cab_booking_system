<?php
/*
  Student: Rupert Guppy (23196925)
  File: map_booking.php
  Description: Part 2 backend handler for map-based booking submissions. Receives POST
               data including pickup and destination coordinates, sanitises inputs,
               generates a unique BRN, inserts the booking into the bookings table,
               and records the trip coordinates and fare estimate into the trips table.
               Returns an HTML confirmation message with the BRN, pickup date, and time.

  Functions:
    - sanitise_input(): Trims whitespace and strips HTML/PHP tags from a string.
    - generate_brn():   Queries the database for the highest existing BRN, increments
                        it, and returns the next BRN in BRN00001 format.
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
  generate_brn(conn)
  Queries the bookings table for the highest BRN number currently stored.
  Increments it by one and returns the next BRN formatted as BRN00001.
*/
function generate_brn($conn) {
    $query = "SELECT MAX(CAST(SUBSTRING(brn, 4) AS UNSIGNED)) AS max_num FROM bookings";
    $result = mysqli_query($conn, $query);
    $row = mysqli_fetch_assoc($result);
    $next_num = ($row['max_num'] === null) ? 1 : (int)$row['max_num'] + 1;
    return 'BRN' . str_pad($next_num, 5, '0', STR_PAD_LEFT);
}

/*
  Main execution — only runs when the request method is POST.
  Connects to the database, sanitises inputs, generates BRN, inserts the booking
  into the bookings table, then inserts coordinates and fare into the trips table.
*/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if (!$conn) {
        echo 'Database connection failed. Please try again later.';
        exit;
    }

    $cname       = sanitise_input($_POST['cname']);
    $phone       = sanitise_input($_POST['phone']);
    $unumber     = sanitise_input($_POST['unumber']);
    $snumber     = sanitise_input($_POST['snumber']);
    $stname      = sanitise_input($_POST['stname']);
    $sbname      = sanitise_input($_POST['sbname']);
    $dsbname     = sanitise_input($_POST['dsbname']);
    $pickup_date = sanitise_input($_POST['date']);
    $pickup_time = sanitise_input($_POST['time']);

    $pickup_lat    = isset($_POST['pickup_lat'])    ? (float) $_POST['pickup_lat']    : 0;
    $pickup_lng    = isset($_POST['pickup_lng'])    ? (float) $_POST['pickup_lng']    : 0;
    $dest_lat      = isset($_POST['dest_lat'])      ? (float) $_POST['dest_lat']      : 0;
    $dest_lng      = isset($_POST['dest_lng'])      ? (float) $_POST['dest_lng']      : 0;
    $fare_estimate = isset($_POST['fare_estimate']) ? (float) $_POST['fare_estimate'] : 0;

    $brn              = generate_brn($conn);
    $booking_datetime = date('Y-m-d H:i:s');
    $status           = 'unassigned';

    $stmt = mysqli_prepare($conn,
        "INSERT INTO bookings
            (brn, cname, phone, unumber, snumber, stname, sbname, dsbname,
             pickup_date, pickup_time, booking_datetime, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    mysqli_stmt_bind_param($stmt, 'ssssssssssss',
        $brn, $cname, $phone, $unumber, $snumber, $stname, $sbname, $dsbname,
        $pickup_date, $pickup_time, $booking_datetime, $status
    );

    $success = mysqli_stmt_execute($stmt);
    mysqli_stmt_close($stmt);

    if (!$success) {
        echo 'There was an error saving your booking. Please try again.';
        mysqli_close($conn);
        exit;
    }

    $stmt2 = mysqli_prepare($conn,
        "INSERT INTO trips (brn, pickup_lat, pickup_lng, dest_lat, dest_lng, fare_estimate)
         VALUES (?, ?, ?, ?, ?, ?)"
    );

    mysqli_stmt_bind_param($stmt2, 'sddddd',
        $brn, $pickup_lat, $pickup_lng, $dest_lat, $dest_lng, $fare_estimate
    );

    mysqli_stmt_execute($stmt2);
    mysqli_stmt_close($stmt2);

    echo "Thank you for your booking!<br>
          Booking reference number: {$brn}<br>
          Pickup time: {$pickup_time}<br>
          Pickup date: {$pickup_date}";

    mysqli_close($conn);
}
?>

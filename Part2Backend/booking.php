<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

/*
  Student: Rupert Guppy | ID: 23196925
  File: booking.php
  Description: Server-side handler for the CabsOnline booking form. Receives POST data
               from the React frontend, sanitises inputs, generates a unique booking
               reference number (BRN), booking datetime, and status, then inserts the
               full record into the MySQL bookings table. Returns an HTML confirmation
               message containing the booking reference number, pickup date, and pickup
               time. CORS headers are included so the React frontend on Vercel can call
               this endpoint cross-origin.

  Functions:
    - sanitise_input(): Trims whitespace and strips HTML/PHP tags from a given string
                        to prevent XSS and injection via user inputs.
    - generate_brn():   Queries the database for the highest existing BRN number,
                        increments it by one, and returns the next BRN in BRN00001 format.
*/

/*
  Database connection constants.
*/
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
  Returns the generated BRN string.
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
  Connects to the database, sanitises inputs, generates BRN and
  booking datetime, inserts the record, and returns a confirmation message.
*/
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $conn = mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if (!$conn) {
        echo 'Database connection failed. Please try again later.';
        exit;
    }

    $cname   = sanitise_input($_POST['cname']);
    $phone   = sanitise_input($_POST['phone']);
    $unumber = sanitise_input($_POST['unumber']);
    $snumber = sanitise_input($_POST['snumber']);
    $stname  = sanitise_input($_POST['stname']);
    $sbname  = sanitise_input($_POST['sbname']);
    $dsbname = sanitise_input($_POST['dsbname']);
    $pickup_date = sanitise_input($_POST['date']);
    $pickup_time = sanitise_input($_POST['time']);

    $brn = generate_brn($conn);
    $booking_datetime = date('Y-m-d H:i:s');
    $status = 'unassigned';

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

    if ($success) {
        echo "Thank you for your booking!<br>
              Booking reference number: {$brn}<br>
              Pickup time: {$pickup_time}<br>
              Pickup date: {$pickup_date}";
    } else {
        echo 'There was an error saving your booking. Please try again.';
    }

    mysqli_stmt_close($stmt);
    mysqli_close($conn);
}
?>

Student: Rupert Guppy | ID: 23196925
File: readme.txt
Description: Overview of the CabsOnline system, list of all files, what each file is responsible for and
             explains how to use the booking system.

=== Files in the system ===

booking.html      — Customer-facing booking form, uses the .css file to dictate the overall font and 
                    colour scheme along with <style> headers to control the layout of the booking page
booking.js        — Client-side validation and fetch logic for booking page
booking.php       — Server-side handler for processing booking submissions, before inserting the full record
                    into the MySQL bookings table
admin.html        — Admin panel for searching and assigning bookings, similar to the booking.html file, it
                    borrows the style sheet from the .css file while including <style> headers to control 
                    the layout of the admin page
admin.js          — Client-side logic for admin search for the admin page
admin.php         — Server-side handler for booking searches. queries the database for a specific
                    bookings via BRN number or by upcoming pickup time, and processes taxi assignment updates 
                    in the database
style.css         — Shared stylesheet for booking.html and admin.html, controls the color pallete, font, 
                    button styles etc.
mysqlcommand.txt  — contains the MySQL CREATE TABLE command used to set up the bookings table
readme.txt        — Explains how to use the CabsOnline system and explains what each file does

=== How to use the CabsOnline booking system ===

BOOKING PAGE
1. Open booking.html in a browser (https://webdev.aut.ac.nz/~pxw1781/assign/booking.html)
2. Fill in your name, phone number, and pickup address
3. Set your desired pickup date and time (must not be in the past), current date and time has already 
   been filled out
4. Click Confirm Booking
5. A confirmation message with your booking reference number, date and time will appear on the page. 
   This then gets automatically saved to the mySQL database 

ADMIN PAGE
1. Open admin.html in a browser (https://webdev.aut.ac.nz/~pxw1781/assign/admin.html)
2. To find a specific booking: enter a booking reference number (e.g. BRN00001) and click Search
3. To view all upcoming unassigned bookings, leave the search field empty and click Search
   — this returns all unassigned bookings with a pickup time within the next 2 hours
4. Click Assign on any row to assign a taxi to that booking
   — the status updates to assigned and a confirmation message appears
   - then the mySQL database gets updated from 'unassigned' to 'assigned' for that particular booking
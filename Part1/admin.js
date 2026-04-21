/*
  Student: Rupert Guppy | ID: 23196925
  File: admin.js
  Description: Client-side logic for the CabsOnline admin panel. Handles BRN format
               validation, fetch requests for booking searches, dynamic table rendering
               of results, and taxi assignment status updates via fetch.

  Functions:
    - validateBrn():     Checks whether a given string matches the BRN format
                         (BRN followed by exactly 5 digits). Returns true if valid,
                         false otherwise.
    - searchBookings():  Reads the bsearch input value. If non-empty, validates the
                         BRN format and shows an error if invalid. If valid or empty,
                         sends a fetch request to admin.php with the search value and
                         passes the response to renderTable().
    - renderTable():     Takes a JSON array of booking records returned from admin.php
                         and builds an HTML table inside the .content div. Shows a
                         no-results message if the array is empty.
    - assignBooking():   Sends a fetch request to admin.php with a BRN to update its
                         status from unassigned to assigned. On success, disables the
                         corresponding Assign button and displays a confirmation message.
*/


/*
  validateBrn(brn)
  Checks whether the given string matches the format BRN followed by exactly 5 digits.
  Returns true if valid, false otherwise.
*/
function validateBrn(brn) {
    const pattern = /^BRN\d{5}$/;
    return pattern.test(brn);
}


/*
  searchBookings()
  Called when the Search button is clicked. Reads the bsearch input.
  If non-empty, validates the BRN format and shows an error if invalid.
  If the input is valid or empty, sends a POST fetch request to admin.php
  with the search value and passes the parsed JSON response to renderTable().
*/
async function searchBookings() {
    const bsearch = document.getElementById('bsearch').value.trim();
    const errBrn = document.getElementById('err-brn');

    errBrn.style.display = 'none';

    if (bsearch !== '' && !validateBrn(bsearch)) {
        errBrn.style.display = 'block';
        return;
    }

    const formData = new FormData();
    formData.append('action', 'search');
    formData.append('bsearch', bsearch);

    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            body: formData
        });

        const records = await response.json();
        renderTable(records);

    } catch (error) {
        const contentDiv = document.getElementById('contentDiv');
        contentDiv.innerHTML = '<p class="no-results">An error occurred while retrieving bookings. Please try again.</p>';
    }
}


/*
  renderTable(records)
  Takes a JSON array of booking records and builds an HTML results table
  inside the .content div. Each row contains booking details and an Assign
  button. Shows a no-results message if the records array is empty.
*/
function renderTable(records) {
    const contentDiv = document.getElementById('contentDiv');

    if (!records || records.length === 0) {
        contentDiv.innerHTML = '<p class="no-results">No bookings found.</p>';
        return;
    }

    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Booking reference number</th>
                    <th>Customer name</th>
                    <th>Phone</th>
                    <th>Pickup suburb</th>
                    <th>Destination suburb</th>
                    <th>Pickup date and time</th>
                    <th>Status</th>
                    <th>Assign</th>
                </tr>
            </thead>
            <tbody>
    `;

    records.forEach(function(record) {
        const isAssigned = record.status === 'assigned';
        const btnDisabled = isAssigned ? 'disabled' : '';
        const btnStyle = isAssigned ? 'style="background-color:#aaa; cursor:not-allowed;"' : '';

        tableHtml += `
            <tr id="row-${record.brn}">
                <td>${record.brn}</td>
                <td>${record.cname}</td>
                <td>${record.phone}</td>
                <td>${record.sbname}</td>
                <td>${record.dsbname}</td>
                <td>${record.pickup_date} ${record.pickup_time}</td>
                <td id="status-${record.brn}">${record.status}</td>
                <td>
                    <button
                        name="Assign"
                        class="assign-btn"
                        id="btn-${record.brn}"
                        onclick="assignBooking('${record.brn}')"
                        ${btnDisabled}
                        ${btnStyle}>
                        Assign
                    </button>
                </td>
            </tr>
        `;
    });

    tableHtml += '</tbody></table>';
    tableHtml += '<div class="assign-confirmation confirmation-box" id="assignConfirmation"></div>';

    contentDiv.innerHTML = tableHtml;
}


/*
  assignBooking(brn)
  Called when an Assign button is clicked in the results table.
  Sends a POST fetch request to admin.php with the selected BRN to update
  its status from unassigned to assigned in the database. On success,
  updates the status cell in the table, disables the Assign button,
  and displays a confirmation message below the table.
*/
async function assignBooking(brn) {
    const formData = new FormData();
    formData.append('action', 'assign');
    formData.append('brn', brn);

    try {
        const response = await fetch('admin.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.text();

        const btn = document.getElementById('btn-' + brn);
        btn.disabled = true;
        btn.style.backgroundColor = '#aaa';
        btn.style.cursor = 'not-allowed';

        const statusCell = document.getElementById('status-' + brn);
        statusCell.textContent = 'assigned';

        const confirmation = document.getElementById('assignConfirmation');
        confirmation.style.display = 'block';
        confirmation.textContent = result;

    } catch (error) {
        const confirmation = document.getElementById('assignConfirmation');
        confirmation.style.display = 'block';
        confirmation.textContent = 'An error occurred while assigning the booking. Please try again.';
    }
}
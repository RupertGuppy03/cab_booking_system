/*
  Student: Rupert Guppy | ID: 23196925
  File: booking.js
  Description: Client-side logic for the CabsOnline booking form. Handles input
               validation, sets default date and time on page load, and submits
               booking data to booking.php via fetch. Displays confirmation message
               with booking reference number, pickup date, and pickup time on success.

  Functions:
    - setDefaults():    Sets the pickup date field to today (DD/MM/YYYY) and the
                        pickup time field to the current time (HH:MM) on page load.
    - isValidDate():    Checks whether a given string matches DD/MM/YYYY format
                        and represents a real calendar date.
    - isValidTime():    Checks whether a given string matches HH:MM 24-hour format.
    - isNotPast():      Compares the entered pickup date and time against the current
                        datetime and returns false if the pickup is in the past.
    - showError():      Makes a specific error message element visible on the page.
    - clearErrors():    Hides all error message elements before each validation run.
    - validateForm():   Runs all client-side validation checks on the form fields.
                        Returns true if all checks pass, false otherwise.
    - submitBooking():  Called when the user clicks Confirm Booking. Validates the
                        form, builds a FormData object, sends it to booking.php via
                        fetch, and displays the confirmation message on success.
*/


/*
  setDefaults()
  Runs on page load. Populates the date field with today's date in DD/MM/YYYY
  format and the time field with the current time in HH:MM 24-hour format.
*/
function setDefaults() {
    const now = new Date();

    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    document.getElementById('date').value = `${day}/${month}/${year}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('time').value = `${hours}:${minutes}`;
}


/*
  isValidDate(dateStr)
  Checks that dateStr matches DD/MM/YYYY and is a real date.
  Returns true if valid, false otherwise.
*/
function isValidDate(dateStr) {
    const pattern = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!pattern.test(dateStr)) return false;

    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
    );
}


/*
  isValidTime(timeStr)
  Checks that timeStr matches HH:MM in 24-hour format.
  Returns true if valid, false otherwise.
*/
function isValidTime(timeStr) {
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return pattern.test(timeStr);
}


/*
  isNotPast(dateStr, timeStr)
  Combines the entered date and time into a Date object and compares
  it against the current datetime. Returns false if pickup is in the past.
*/
function isNotPast(dateStr, timeStr) {
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    const pickupDatetime = new Date(year, month, day, hours, minutes);
    const now = new Date();

    return pickupDatetime >= now;
}


/*
  showError(id)
  Makes the error message element with the given id visible.
*/
function showError(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
}


/*
  clearErrors()
  Hides all validation error messages before each form submission attempt.
*/
function clearErrors() {
    const errorIds = [
        'err-cname',
        'err-phone',
        'err-snumber',
        'err-stname',
        'err-date',
        'err-time',
        'err-datetime'
    ];
    errorIds.forEach(function(id) {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}


/*
  validateForm()
  Validates all required form fields. Checks for empty NOT NULL fields,
  phone number format, date format, time format, and whether the pickup
  datetime is not in the past.
  Returns true if all validations pass, false if any fail.
*/
function validateForm() {
    let isValid = true;

    const cname = document.getElementById('cname').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const snumber = document.getElementById('snumber').value.trim();
    const stname = document.getElementById('stname').value.trim();
    const date = document.getElementById('date').value.trim();
    const time = document.getElementById('time').value.trim();

    if (cname === '') {
        showError('err-cname');
        isValid = false;
    }

    if (!/^\d{10,12}$/.test(phone)) {
        showError('err-phone');
        isValid = false;
    }

    if (snumber === '') {
        showError('err-snumber');
        isValid = false;
    }

    if (stname === '') {
        showError('err-stname');
        isValid = false;
    }

    if (!isValidDate(date)) {
        showError('err-date');
        isValid = false;
    }

    if (!isValidTime(time)) {
        showError('err-time');
        isValid = false;
    }

    if (isValid && !isNotPast(date, time)) {
        showError('err-datetime');
        isValid = false;
    }

    return isValid;
}


/*
  submitBooking()
  Called when the user clicks the Confirm Booking button. Clears any existing
  errors, runs validateForm(), and if valid, sends all form field values to
  booking.php using fetch. On a successful response, displays the confirmation
  message containing the booking reference number, pickup date, and pickup time
  inside the #reference element.
*/
async function submitBooking() {
    clearErrors();

    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('cname', document.getElementById('cname').value.trim());
    formData.append('phone', document.getElementById('phone').value.trim());
    formData.append('unumber', document.getElementById('unumber').value.trim());
    formData.append('snumber', document.getElementById('snumber').value.trim());
    formData.append('stname', document.getElementById('stname').value.trim());
    formData.append('sbname', document.getElementById('sbname').value.trim());
    formData.append('dsbname', document.getElementById('dsbname').value.trim());
    formData.append('date', document.getElementById('date').value.trim());
    formData.append('time', document.getElementById('time').value.trim());

    try {
        const response = await fetch('booking.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.text();

        const referenceEl = document.getElementById('reference');
        const confirmationBox = document.getElementById('confirmationBox');

        referenceEl.innerHTML = result;
        confirmationBox.style.display = 'block';

    } catch (error) {
        const referenceEl = document.getElementById('reference');
        const confirmationBox = document.getElementById('confirmationBox');

        referenceEl.innerHTML = 'An error occurred while submitting your booking. Please try again.';
        confirmationBox.style.display = 'block';
    }
}


window.onload = setDefaults;
const SHEET_NAME = 'RSVP';
const HEADERS = ['Timestamp', 'Name', 'Phone', 'Attendance', 'Guests', 'Message'];

/**
 * GET endpoint used by the website to load public wishes through JSONP.
 * Phone numbers are deliberately excluded from the returned data.
 */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const callback = params.callback || '';

  if (params.action !== 'list' || !/^[A-Za-z_$][\w$]*$/.test(callback)) {
    return jsonOutput_({ ok: false, error: 'Invalid request.' });
  }

  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues().slice(1).slice(-100).reverse();
  const wishes = rows
    .filter((row) => row[1] && row[5])
    .map((row) => ({
      name: String(row[1]),
      message: String(row[5]),
      timestamp: row[0] instanceof Date ? row[0].toISOString() : String(row[0] || '')
    }));

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(wishes) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

/** Stores full RSVP details privately in the linked spreadsheet. */
function doPost(e) {
  const params = (e && e.parameter) || {};

  // Ignore automated submissions caught by the off-screen honeypot field.
  if (params.website) return jsonOutput_({ ok: true });

  const name = String(params.name || '').trim().slice(0, 100);
  const phone = String(params.phone || '').trim().slice(0, 40);
  const attendance = String(params.attendance || '').trim();
  const guests = Number.parseInt(params.guests, 10);
  const message = String(params.message || '').trim().slice(0, 1000);

  if (!name || !phone || !['yes', 'no'].includes(attendance) ||
      !Number.isInteger(guests) || guests < 1 || guests > 10) {
    return jsonOutput_({ ok: false, error: 'Invalid RSVP data.' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date(), name, phone, attendance, guests, message]);
  } finally {
    lock.releaseLock();
  }

  return jsonOutput_({ ok: true });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Bind this Apps Script project to a Google Sheet.');

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

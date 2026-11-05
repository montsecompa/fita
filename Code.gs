/**
 * FITA: receives litter reports from the web form,
 * saves the photo to Google Drive and adds a row to the Google Sheet.
 *
 * Standalone Apps Script project linked to the Sheet below by its ID.
 * Run setup() once to grant access, then
 * Deploy → New deployment → Web app
 *   Execute as: Me
 *   Who has access: Anyone
 */

const SPREADSHEET_ID = '1KgpukYcsKwKyeaK0yCQHMb9jZV7dDuQhAqeMtHyFJ8w'; // the "FITA – Avisos" Google Sheet
const SHEET_NAME = 'Avisos';
const FOLDER_NAME = 'FITA – fotos';
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

const HEADERS = [
  'Received', 'Photo taken', 'Time source', 'Latitude', 'Longitude', 'Accuracy (m)',
  'Location source', 'Map', 'Place description', 'J-code', 'Item (EN)', 'Count',
  'Note', 'Language', 'Photo'
];

// Run once from the editor: asks for permission and creates the sheet tab and photo folder.
function setup() {
  getSheet();
  getFolder();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);

    // Simple spam trap: real people never fill the hidden "website" field.
    if (d.website) return json({ ok: true });
    if (!d.photo) return json({ ok: false, error: 'no_photo' });

    const bytes = Utilities.base64Decode(d.photo);
    if (bytes.length > MAX_PHOTO_BYTES) return json({ ok: false, error: 'too_large' });

    const stamp = Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyyMMdd-HHmmss');
    const file = getFolder().createFile(
      Utilities.newBlob(bytes, 'image/jpeg', 'fita-' + stamp + '-' + Utilities.getUuid().slice(0, 6) + '.jpg')
    );

    const lat = num(d.lat), lon = num(d.lon);
    const map = (lat !== '' && lon !== '')
      ? 'https://www.google.com/maps?q=' + lat + ',' + lon : '';

    lock.waitLock(20000);
    getSheet().appendRow([
      new Date(),
      d.takenAt ? new Date(d.takenAt) : '',
      txt(d.timeSource, 10),
      lat, lon, num(d.accuracy),
      txt(d.locSource, 10),
      map,
      txt(d.place, 300),
      txt(d.jcode, 8),
      txt(d.item, 80),
      Math.max(1, Math.min(999, parseInt(d.count, 10) || 1)),
      txt(d.note, 500),
      txt(d.lang, 4),
      file.getUrl()
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

// Open the web app URL in a browser to check it's live.
function doGet() {
  return json({ ok: true, service: 'FITA' });
}

function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function getFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', folder.getId());
  return folder;
}

// Formula-safe text: stops entries like "=HYPERLINK(...)" being run as formulas.
function txt(v, max) {
  let s = (v == null ? '' : String(v)).slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}
function num(v) { const n = Number(v); return (v === null || v === '' || !isFinite(n)) ? '' : n; }
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

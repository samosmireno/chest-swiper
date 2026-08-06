// DETECT Summit Swiper — Google Sheets fallback receiver
// Deploy as: Extensions → Apps Script → Deploy → New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
// Copy the deployment URL into SHEETS_WEBHOOK_URL in src/config.ts
//
// Column order mirrors buildPayload() in src/game/payload.ts. The app reads back
// participant_name / total_* / session_id / submitted_at and filters rows
// client-side on app_version + summit_id, so those names must stay exact.
//
// case_id ("case1"/"case2") tags which single case a row belongs to. The app
// uses it to scope the leaderboard per case; if absent it infers the case from
// whichever caseN_total column is populated, but persisting it here is the
// robust path and keeps Sheets in parity with the Drupal webform.
//
// NOTE: the header row is only written when the sheet is empty (see doPost). If
// the tab already holds rows under an OLD header, inserting case_id mid-array
// misaligns every later column. Before the event, start from a fresh/cleared
// sheet (also keeps test rows off the live leaderboard) so this header is
// (re)written in full.

const COLUMNS = [
  "webform_id", "app_version", "summit_id", "case_id", "session_id",
  "participant_name", "identity_type", "email", "specialty",
  "submitted_at", "duration_seconds",
  "total_correct", "total_questions", "total_score",
  "case1_correct", "case1_total", "case1_score",
  "case2_correct", "case2_total", "case2_score",
  "c1q1_answer", "c1q1_correct", "c1q2_answer", "c1q2_correct", "c1q3_answer", "c1q3_correct",
  "c2q1_answer", "c2q1_correct", "c2q2_answer", "c2q2_correct", "c2q3_answer", "c2q3_correct",
];

function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
    }

    // Write the row as plain text so date-shaped values (summit_id "2026-06-23",
    // submitted_at ISO datetimes) round-trip verbatim. Without this, Sheets
    // coerces them to Date cells and reads them back as timezone-shifted UTC
    // datetimes, which breaks the client's summit_id filter. Set the format
    // BEFORE writing — coercion happens at write time. Numeric fields stay
    // string-typed too, but the client Number()-coerces those on read.
    const values = COLUMNS.map((col) => String(data[col] ?? ""));
    const targetRow = sheet.getLastRow() + 1;
    sheet
      .getRange(targetRow, 1, 1, COLUMNS.length)
      .setNumberFormat("@")
      .setValues([values]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

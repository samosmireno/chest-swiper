// Who Would You Screen? — Google Sheets results store (primary storage)
// POST appends a submission row; GET returns all rows as JSON.
// Two deployment modes. Both end with the /exec URL going into
// SHEETS_WEBHOOK_URL in src/config.ts.
//
// BOUND (SHEET_ID = ""): Extensions → Apps Script inside the spreadsheet.
// Only works if you can deploy in the spreadsheet owner's Workspace —
// an editor on someone else's sheet usually cannot.
//
// STANDALONE (SHEET_ID set): script.google.com → New project, in YOUR OWN
// Drive, writing to the client's sheet by ID. Use this when the sheet is
// shared with you and Deploy is blocked. You need editor access on the
// sheet; the web app runs as you, so your access is what authorizes the
// write. First deploy prompts an OAuth consent screen for the Sheets scope
// (it is an unverified app — Advanced → Go to <project>).
//
// Deploy → New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
// "Anyone" is required: the kiosk POSTs without signing in. If that option
// is missing, the account you are deploying from is in a Workspace whose
// admin has disabled it — deploy from a personal account instead.
//
// Schema changes: v2.0 (asthma/COPD deck) has 12 cards, so card_p13–p15
// are gone; v2.1 adds total_ms (the session clock's total — the sum of the
// card_p*_ms — which the leaderboard shows as its time column) after
// speed_bonus. The header row only auto-writes into an EMPTY sheet — deploy
// against a fresh/cleared sheet, or new rows will misalign against a header
// that still carries the old columns.

// Spreadsheet to append to. Leave "" for a bound script (uses the container);
// set to the sheet's file ID for a standalone deployment — the middle chunk
// of the sheet URL: docs.google.com/spreadsheets/d/<SHEET_ID>/edit
const SHEET_ID = "";
// Tab to write to when standalone. "" = the spreadsheet's first sheet.
const SHEET_NAME = "";

function targetSheet() {
  const ss = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      'No spreadsheet: SHEET_ID is "" and this is not a bound script. ' +
        "Set SHEET_ID to the sheet's file ID for a standalone deployment.",
    );
  }
  const sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  // getSheetByName returns null for a name that doesn't exist — without this
  // the miss surfaces as a null-pointer on the next call, several frames from
  // the actual cause, and the kiosk POST swallows it whole (no-cors).
  if (!sheet) {
    const names = ss
      .getSheets()
      .map((s) => '"' + s.getName() + '"')
      .join(", ");
    throw new Error(
      'No tab named "' + SHEET_NAME + '" in "' + ss.getName() + '". ' +
        "Tabs are: " + names + ". Fix SHEET_NAME, or set it to \"\" for the first tab.",
    );
  }
  return sheet;
}

const COLUMNS = [
  "app_version",
  "username",
  "email",
  "specialty",
  "submitted_at",
  "score",
  "cards_correct",
  "cards_total",
  "max_streak",
  "speed_bonus",
  "total_ms",
  "card_p1_correct",
  "card_p2_correct",
  "card_p3_correct",
  "card_p4_correct",
  "card_p5_correct",
  "card_p6_correct",
  "card_p7_correct",
  "card_p8_correct",
  "card_p9_correct",
  "card_p10_correct",
  "card_p11_correct",
  "card_p12_correct",
  "card_p1_ms",
  "card_p2_ms",
  "card_p3_ms",
  "card_p4_ms",
  "card_p5_ms",
  "card_p6_ms",
  "card_p7_ms",
  "card_p8_ms",
  "card_p9_ms",
  "card_p10_ms",
  "card_p11_ms",
  "card_p12_ms",
  "session_id",
];

function doGet() {
  try {
    const sheet = targetSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length < 2) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(
        ContentService.MimeType.JSON,
      );
    }
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i];
      });
      return obj;
    });
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
      ContentService.MimeType.JSON,
    );
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ error: err.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const sheet = targetSheet();
    const data = JSON.parse(e.postData.contents);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
    }

    sheet.appendRow(COLUMNS.map((col) => data[col] ?? ""));

    return ContentService.createTextOutput(
      JSON.stringify({ result: "ok" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: err.toString() }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

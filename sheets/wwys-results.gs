// Who Would You Screen? — Google Sheets results store (primary storage)
// POST appends a submission row; GET returns all rows as JSON.
// Deploy as: Extensions → Apps Script → Deploy → New deployment
//   Type: Web app | Execute as: Me | Who has access: Anyone
// Copy the deployment URL into SHEETS_WEBHOOK_URL in src/config.ts

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
  "card_p13_correct",
  "card_p14_correct",
  "card_p15_correct",
  "session_id",
];

function doGet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
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

/* ============================================================
   다원HR 우선순위 실행리스트 — 클라우드 저장소 (Google Apps Script)
   구글 시트 한 칸(store 시트의 A2)에 체크 기록 전체를 JSON으로 저장합니다.
   priority.html 의 SYNC_TOKEN 과 아래 TOKEN 값이 반드시 같아야 합니다.
============================================================ */

const TOKEN = "dowon-okr-7k3m9q2";   // ← priority.html 의 SYNC_TOKEN 과 동일하게 유지
const SHEET_ID = "11gkXD0mC2SYMi3L9Bni3OFIxTFrWqh63ZwTreFLbmlk";  // 저장소 구글 시트 ID
const SHEET_NAME = "store";

function _sheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange("A1").setValue("data(JSON)");
  }
  return sh;
}

// 불러오기 (priority.html 이 열릴 때 호출)
function doGet(e) {
  const token = e && e.parameter && e.parameter.token;
  if (token !== TOKEN) return _json({ error: "unauthorized" });
  const val = _sheet().getRange("A2").getValue();
  return _json(val ? JSON.parse(val) : {});
}

// 저장하기 (체크할 때마다 호출)
function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) {}
  if (body.token !== TOKEN) return _json({ error: "unauthorized" });
  const data = body.data || {};
  _sheet().getRange("A2").setValue(JSON.stringify(data));
  return _json({ ok: true, savedAt: new Date().toISOString() });
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

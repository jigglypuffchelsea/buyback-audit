/**
 * 買回時間 Audit — Google Apps Script
 *
 * 功能：
 * 1. doGet / doPost — API for frontend CRUD
 * 2. initSheet() — 初始化 Sheet 結構
 *
 * 部署方式：
 * 1. 在 Google Sheet 中開啟 Extensions > Apps Script
 * 2. 貼上此程式碼
 * 3. 先執行 initSheet()
 * 4. 部署為 Web App（Execute as me / Anyone with link）
 */

// ===== 設定 =====
const SHEET_NAME = 'Entries';
const CONFIG_SHEET = 'Config';

// ===== API Handlers =====

function doGet(e) {
  const action = e.parameter.action || 'getEntries';
  let result;

  switch (action) {
    case 'getEntries':
      result = getEntries(e.parameter.date);
      break;
    case 'getAllEntries':
      result = getEntries();
      break;
    default:
      result = { error: 'Unknown action' };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  let result;

  switch (action) {
    case 'saveEntry':
      result = saveEntry(body.entry);
      break;
    case 'deleteEntry':
      result = deleteEntry(body.id);
      break;
    default:
      result = { error: 'Unknown action' };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== CRUD =====

function getEntries(date) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { entries: [] };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { entries: [] };

  const headers = data[0];
  const entries = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((h, j) => { row[h] = data[i][j]; });

    // 日期篩選
    if (date && row.date !== date) return;

    entries.push({
      id: row.id,
      date: row.date,
      startTime: row.startTime,
      activity: row.activity,
      energy: row.energy || null,
      delegationCost: row.delegationCost ? Number(row.delegationCost) : null,
      createdAt: row.createdAt,
    });
  }

  return { entries };
}

function saveEntry(entry) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { error: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();

  // 找是否已存在
  let rowIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === entry.id) {
      rowIndex = i + 1; // 1-indexed
      break;
    }
  }

  const rowData = [
    entry.id,
    entry.date,
    entry.startTime,
    entry.activity,
    entry.energy || '',
    entry.delegationCost || '',
    entry.createdAt,
  ];

  if (rowIndex > 0) {
    // 更新
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // 新增
    sheet.appendRow(rowData);
  }

  return { success: true };
}

function deleteEntry(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { error: 'Sheet not found' };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: 'Entry not found' };
}

// ===== 初始化 =====

function initSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Entries sheet
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  sheet.getRange(1, 1, 1, 7).setValues([
    ['id', 'date', 'startTime', 'activity', 'energy', 'delegationCost', 'createdAt']
  ]);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold');

  // Config sheet
  let configSheet = ss.getSheetByName(CONFIG_SHEET);
  if (!configSheet) {
    configSheet = ss.insertSheet(CONFIG_SHEET);
  }
  configSheet.getRange(1, 1, 2, 2).setValues([
    ['key', 'value'],
    ['startDate', Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd')],
  ]);
  configSheet.setFrozenRows(1);
  configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');

  Logger.log('初始化完成！');
}


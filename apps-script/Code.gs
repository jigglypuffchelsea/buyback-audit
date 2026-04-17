/**
 * 買回時間 Audit — Google Apps Script
 *
 * 功能：
 * 1. doGet / doPost — API for frontend CRUD
 * 2. initSheet() — 初始化 Sheet 結構
 * 3. setupCalendarReminders() — 建立兩週 Google Calendar 提醒
 *
 * 部署方式：
 * 1. 在 Google Sheet 中開啟 Extensions > Apps Script
 * 2. 貼上此程式碼
 * 3. 先執行 initSheet()
 * 4. 部署為 Web App（Execute as me / Anyone with link）
 * 5. 設定好 Vercel URL 後執行 setupCalendarReminders()
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
  configSheet.getRange(1, 1, 3, 2).setValues([
    ['key', 'value'],
    ['startDate', Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd')],
    ['appUrl', ''],
  ]);
  configSheet.setFrozenRows(1);
  configSheet.getRange(1, 1, 1, 2).setFontWeight('bold');

  Logger.log('初始化完成！');
}

// ===== Google Calendar 提醒 =====

function setupCalendarReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(CONFIG_SHEET);
  const configData = configSheet.getDataRange().getValues();

  let startDate = '';
  let appUrl = '';

  for (let i = 1; i < configData.length; i++) {
    if (configData[i][0] === 'startDate') startDate = configData[i][1];
    if (configData[i][0] === 'appUrl') appUrl = configData[i][1];
  }

  if (!startDate) {
    Logger.log('請先在 Config sheet 設定 startDate');
    return;
  }

  const cal = CalendarApp.getDefaultCalendar();
  const start = new Date(startDate);
  const DAYS = 14;

  let count = 0;

  for (let day = 0; day < DAYS; day++) {
    const date = new Date(start);
    date.setDate(date.getDate() + day);

    // 09:30 到 23:30（同一天）
    for (let h = 9; h <= 23; h++) {
      const minutes = (h === 9) ? [30] : [0, 30];
      for (const m of minutes) {
        const eventStart = new Date(date);
        eventStart.setHours(h, m, 0, 0);
        const eventEnd = new Date(eventStart);
        eventEnd.setMinutes(eventEnd.getMinutes() + 5);

        const event = cal.createEvent(
          '📝 過去 30 分鐘做了什麼？',
          eventStart,
          eventEnd,
          {
            description: appUrl
              ? '點擊開啟 App 記錄：' + appUrl
              : '打開買回時間 App 記錄你的活動',
          }
        );
        event.removeAllReminders();
        event.addPopupReminder(0);
        count++;
      }
    }

    // 隔天 00:00, 00:30, 01:00
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    for (const m of [0, 30, 60]) {
      const eventStart = new Date(nextDay);
      eventStart.setHours(0, m, 0, 0);
      const eventEnd = new Date(eventStart);
      eventEnd.setMinutes(eventEnd.getMinutes() + 5);

      const event = cal.createEvent(
        '📝 過去 30 分鐘做了什麼？',
        eventStart,
        eventEnd,
        {
          description: appUrl
            ? '點擊開啟 App 記錄：' + appUrl
            : '打開買回時間 App 記錄你的活動',
        }
      );
      event.removeAllReminders();
      event.addPopupReminder(0);
      count++;
    }
  }

  Logger.log('已建立 ' + count + ' 個提醒事件！');
}

// ===== 清除所有提醒（如果需要重來）=====

function clearCalendarReminders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName(CONFIG_SHEET);
  const configData = configSheet.getDataRange().getValues();

  let startDate = '';
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][0] === 'startDate') startDate = configData[i][1];
  }

  const cal = CalendarApp.getDefaultCalendar();
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 15);

  const events = cal.getEvents(start, end);
  let count = 0;

  events.forEach(event => {
    if (event.getTitle() === '📝 過去 30 分鐘做了什麼？') {
      event.deleteEvent();
      count++;
    }
  });

  Logger.log('已刪除 ' + count + ' 個提醒事件');
}

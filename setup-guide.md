# 買回時間 Audit — 設定指南

總共 7 個步驟，大約 10 分鐘搞定。

---

## Step 1：建立 Google Sheet

1. 開 [Google Sheets](https://sheets.google.com)
2. 按「空白試算表」建立新的
3. 把試算表命名為「買回時間 Audit」

## Step 2：加入 Apps Script

1. 在試算表上方選單，點 **Extensions** > **Apps Script**
2. 會開一個新分頁，裡面有個空的 `Code.gs`
3. **全選刪除**裡面的預設程式碼
4. 把 `apps-script/Code.gs` 的**全部內容**複製貼上
5. 按 **Ctrl+S**（或 Cmd+S）儲存
6. 專案名稱可以改成「買回時間」

## Step 3：初始化 Sheet

1. 在 Apps Script 編輯器上方，函式下拉選單選 `initSheet`
2. 按 ▶️ **執行**
3. 第一次會要求授權，按「Review permissions」 > 選你的 Google 帳號
4. 會看到「Google hasn't verified this app」，按 **Advanced** > **Go to 買回時間 (unsafe)**
5. 按 **Allow**
6. 回到你的 Google Sheet，應該會看到兩個 sheet：
   - **Entries**：有 id, date, startTime, activity, energy, delegationCost, createdAt 等欄位標題
   - **Config**：有 startDate 和 appUrl

## Step 4：部署為 Web App

1. 回到 Apps Script 編輯器
2. 右上角按 **Deploy** > **New deployment**
3. 左邊齒輪圖示選 **Web app**
4. 設定：
   - **Description**: 買回時間 API
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
5. 按 **Deploy**
6. 會顯示一個 **Web app URL**（長得像 `https://script.google.com/macros/s/xxxxxxx/exec`）
7. **複製這個 URL**，等下要用

## Step 5：設定前端環境變數

1. 在專案根目錄建立 `.env` 檔案（如果還沒有的話）
2. 加入這一行：

```
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/你的URL/exec
```

（把 URL 換成 Step 4 複製的那個）

> 如果還沒有設 Apps Script URL，app 會自動用 localStorage 儲存資料，功能一樣可以用。

## Step 6：部署到 Vercel（手機使用）

1. 先建立 Git repo 並推上 GitHub
2. 到 [vercel.com](https://vercel.com) 登入
3. Import 你的 GitHub repo
4. 在 Environment Variables 加入 `VITE_APPS_SCRIPT_URL`
5. Deploy
6. 拿到你的 Vercel URL（像 `https://buyback-audit.vercel.app`）

## Step 7：設定 Google Calendar 提醒

1. 回到 Google Sheet 的 **Config** sheet
2. 在 `appUrl` 那格填入你的 Vercel URL
3. 回到 Apps Script 編輯器
4. 函式下拉選單選 `setupCalendarReminders`
5. 按 ▶️ **執行**
6. 等它跑完（會建立大約 490 個小事件，可能要 1-2 分鐘）
7. 打開你的 Google Calendar 確認有看到提醒事件

## Step 8：手機安裝 PWA

1. 手機瀏覽器打開你的 Vercel URL
2. **iPhone**: Safari > 分享按鈕 > 「加入主畫面」
3. **Android**: Chrome > 選單 > 「安裝應用程式」或「加入主畫面」

---

## 完成！

現在你的手機每 30 分鐘會收到 Google Calendar 通知，點開就能快速記錄過去半小時做了什麼。

## 如果需要重來

- 想清除所有日曆提醒：在 Apps Script 執行 `clearCalendarReminders`
- 想清除記錄資料：直接在 Google Sheet 的 Entries 刪除資料列（保留標題列）

## 暫時不想接 Google Sheet？

不設 `.env` 的 `VITE_APPS_SCRIPT_URL`，app 會自動改用瀏覽器 localStorage 儲存。功能完全一樣，只是資料只存在該裝置的瀏覽器裡。

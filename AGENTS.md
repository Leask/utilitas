# AGENTS.md

## Code style

- All programming languages should adhere to a strict mode.
- For all code files, aim to keep line lengths under 80 characters. In some cases, lengths up to 120 characters are acceptable. Longer lines are allowed only if a clear justification is provided.
For all documentation files, line length limits are not required.
- Use spaces for indentation in all code files, tabs are not allowed.
- Use `4 spaces` per indentation level, inclouding in languages that typically use 2 spaces. For example, `.js` and `.ts` files.
- If you're working on an existing project rather than starting a new one, adhere to the project's existing code style. Please disregard the 4-space rule in such cases.
- Use UTF-8 encoding for all text files.
- User single quotes for strings unless double quotes are necessary.

### Python

- Follow PEP 8 style guidelines.

## 項目分析與開發要點 (Project Design & Development)

### 1. PostgreSQL 連接與 pgvector 初始化流控
在 `lib/dbio.mjs` 中，為了防止併發查詢時出現 `DeprecationWarning: Calling client.query() when the client is already executing a query` 警告，採取了以下關鍵設計：

- **痛點**：`pg` 庫的 `connect` 事件監聽器不支援異步等待。若直接在監聽器註冊 `pgvector`，註冊查詢會與業務查詢在同一個客戶端併發執行，產生競態條件。
- **解決依據**：
    - **手動管理連接**：在 `rawQuery` 和 `rawExecute` 中，針對 PostgreSQL 顯式通過 `conn.connect()` 獲取客戶端。
    - **狀態標記**：使用 `pgCheckedClients` (WeakSet) 標記已完成初始化註冊的物理連接，確保「每個物理連接僅註冊一次」且不造成內存洩漏。
    - **強制流控**：在執行業務 SQL 前 `await pgvector.registerType(client)`，從而保證：`獲取連接` -> `註冊完成` -> `執行查詢` 的嚴格異步順序。
- **AI 注意**：不要使用 `pool.query` 繞過此邏輯。

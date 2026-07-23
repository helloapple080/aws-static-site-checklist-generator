# Cloud-ready Hardening Implementation Plan

> **For Hermes:** Follow test-driven-development task by task; do not commit without user request.

**Goal:** 將現有 AWS 靜態網站檢查清單 CLI 補強為有清楚模組邊界、輸入與路徑防護、結構化日誌、整合／E2E 測試、CI 與完整上雲等級文件的小型工具。

**Architecture:** 保持單一 Node.js CLI，不導入不必要框架。拆分 domain validation/render、application use case、filesystem adapter、structured logger 與 CLI interface，核心不依賴檔案系統。這是 cloud-ready design，不宣稱已部署 AWS。

**Tech Stack:** Node.js 22 built-ins、`node:test`、ES modules、GitHub Actions、Markdown/Mermaid。

---

## Task 1：安全輸入與路徑邊界

- 修改 `test/generate-checklist.test.js`：先加入 environment allowlist、domain 格式、控制字元、未替換 placeholder、輸出不得覆寫模板與 symlink/path escape 的失敗測試。
- 執行特定測試確認 RED。
- 建立 `src/domain/checklist.js` 與 `src/infrastructure/filesystem.js` 的最小實作。
- 執行測試確認 GREEN。

## Task 2：application use case 與結構化 logger

- 先測 `generateChecklist` 透過注入 filesystem 執行原子寫入，並驗證成功／失敗 JSON log 不含輸入值與 secret。
- 建立 `src/application/generate-checklist.js`、`src/observability/logger.js`。
- 只對可重試且冪等的原子 rename 暫時錯誤採有限 retry；本地同步檔案操作預設不盲目 retry。

## Task 3：CLI 與 E2E

- 先加入真實 child process 測試：成功 exit 0、錯誤 exit 非 0、stdout/stderr 為可解析 JSON。
- 將 `src/generate-checklist.js` 限縮成 CLI adapter，保留既有參數相容性。

## Task 4：品質與供應鏈閘門

- 產生 lockfile（專案無第三方 runtime 依賴）。
- 新增 `check` script：tests、Node syntax check、generated output smoke test。
- 建立 `.github/workflows/ci.yml`，使用受支援 Node LTS、最小 permissions、`npm ci`、test、audit。

## Task 5：文件

- 更新 `README.md`。
- 新增 `docs/architecture.md`（Mermaid 元件、資料流、信任邊界與 cloud deployment reference）。
- 新增 `docs/security.md`、`docs/operations.md`、`docs/verification.md`。
- 新增 `docs/adr/0001-modular-monolith-cli.md`。
- 明確標示未實際部署 AWS。

## Task 6：驗證與獨立審查

- 執行 `npm run check`、`npm audit --audit-level=high`、secret pattern scan、Markdown link/path 檢查。
- 由獨立 reviewer 只讀 diff，檢查資安與邏輯。
- 最多兩輪針對證據修正後重新跑完整閘門。
- 將最終真實結果同步到 Obsidian 專案摘要。

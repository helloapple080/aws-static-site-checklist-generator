# Security and Threat Model

## Assets

- 使用者提供的專案資訊。
- Markdown template 與產生的 checklist。
- 本機檔案系統完整性。
- CI／開發環境中的 logs。

## Trust boundaries

CLI arguments、template 內容、目前工作目錄中的 symlink 都視為不可信。程式不讀 `.env`、不存取 AWS credentials，也不呼叫 AWS API。

## Threats and non-adversarial guardrails

下列檔案路徑控制是針對單一使用者 CLI 的誤用防護，不構成 sandbox 或對抗同機並行攻擊者的安全邊界；TOCTOU 限制見 Residual risks。

| Threat | Guardrail | Verification |
|---|---|---|
| Path traversal | custom output/template 必須 resolve 在 `cwd` 下；bundled template 是 module-owned trust exception | automated test |
| Symlink overwrite（無並行置換時） | 拒絕檢查當下已存在的 symlink 與路徑中的 symlink | automated test |
| Markdown/HTML content injection | control-character rejection + contextual escaping of inserted values | automated test |
| Malformed domain/environment | hostname regex + environment allowlist | automated test |
| Partial/corrupt output | mode 0600 temp file + atomic rename + cleanup | integration test |
| Template abuse | regular-file check、1 MiB 上限、未知 placeholder 拒絕 | unit/integration test |
| Secret leakage／log forgery | logger-owned schema + explicit scalar field allowlist；不記錄 raw options | automated test |
| Dependency compromise | 零 runtime dependency、lockfile、`npm audit` | CI/local gate |
| CI token over-permission | workflow `contents: read` | config review |

## Residual risks

- 本機 process 具有使用者本身權限；此工具不是 sandbox。
- 本機 path adapter 仍存在 check/use 間的 TOCTOU residual risk。這是單一使用者 CLI 的明確接受風險，不是多租戶安全邊界；**禁止把目前 adapter 原樣重用於 hosted/multi-user 服務**。服務化時需改成預先開啟的受信任 directory/file-descriptor 策略或受控 object-storage adapter。
- 使用者插入值會做 Markdown/HTML text escaping；repo 管理的 template 本身仍是受信任程式碼／內容。若允許不可信使用者提供 template 或輸出要公開渲染，仍需 renderer-level HTML sanitizer、停用 raw HTML 與 CSP。
- Node 版本與 pinned GitHub Actions SHAs 由 Dependabot及定期技術檢視維護。

## Secret handling

- 不建立 `.env`，也不需要 secrets。
- `.gitignore` 忽略 `.env`、`*.log` 與 `node_modules`。
- 發現 credential 時應撤銷／輪替，不只從 Git history 刪字串。

## Vulnerability response

1. 重現並建立失敗測試。
2. 評估 CWE、影響範圍與可利用條件。
3. 最小修正後執行完整品質閘門。
4. 若已發布，提供修補版本與 upgrade note；必要時輪替 secrets。

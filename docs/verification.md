# Verification

## Test matrix

| Layer | Coverage |
|---|---|
| Unit | argument parsing、domain/environment/control-character validation、Markdown/HTML escaping、placeholder rendering |
| Security | path traversal、intermediate/output symlink、case-insensitive file alias、unknown/malformed placeholder、logger schema forgery |
| Integration | regular/oversized template、real template read、directory creation、atomic output、0600 mode、structured logs |
| E2E | real Node child process、repo 外預設執行、stdout/stderr contract、single failure event、success/failure exit codes |
| Supply chain | lockfile、zero runtime dependency、lifecycle scripts disabled、pinned Actions SHAs、npm audit |
| Static | Node syntax checks for every source module |
| Documentation | local Markdown links、JSON parse、generated placeholder scan |

## Canonical commands

```bash
npm ci --ignore-scripts
npm run check
npm audit --omit=dev --audit-level=high
```

`npm run check` 是 deterministic，只執行 syntax、tests 與 coverage；真實 CLI smoke test 在 E2E 中使用 temporary directory，不會改寫 repo。`npm run generate` 是人工更新範例的命令。

## Evidence policy

- 每次程式或設定變更後重新執行，不沿用舊結果。
- 此文件只記錄實際觀察結果，不杜撰 AWS deployment、traffic、cost 或 availability。
- Coverage 用來找測試缺口，不把 100% 當作品質本身，也不為湊數測 implementation details。

## Latest verified evidence

**執行日期：** 2026-07-23

**環境：** Node.js v22.22.2、npm 10.9.7、macOS case-insensitive filesystem；專案位於外接硬碟。

**狀態：** cloud-ready local design，未實際部署 AWS。

| Check | Result |
|---|---|
| `npm ci --ignore-scripts` | pass；1 package audited |
| Node syntax checks | pass；5 個 source modules |
| `node --test` | **14 tests、14 pass、0 fail、0 skipped** |
| Coverage（該次 `npm run check`） | lines **97.92%**、branches **92.80%**、functions **96.97%** |
| E2E generator | success/failure contract、repo 外 default invocation、single failure logging 全部通過 |
| `npm audit --omit=dev --audit-level=high` | **0 vulnerabilities** |
| Deterministic quality gate | `example-output.md` check 前後 SHA-256 都是 `90e9577200f582fa818a23a5bf01c3b1f9cff2ab6a1471804474f6f6d76dae7f` |
| Official Git refs | checkout v4 → `34e114876b0b11c390a56381ad16ebd13914f8d5`；setup-node v4 → `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| Secret/dangerous pattern scans | 未發現 hardcoded AWS/GitHub key pattern、`eval`、`exec` 或 `shell: true` |

## Review-driven fixes verified

- 使用者值轉義成 Markdown/HTML-safe text。
- renderer 直接呼叫仍執行內容欄位驗證。
- 任何殘留 `{{` 或 `}}` 都視為 malformed/unsupported placeholder。
- Logger schema 由 logger 擁有，只接受 `bytes`、`duration_ms`、`error_code`、`error_type` 等明確 scalar fields。
- 預設 bundled template 可從 repo 外使用；自訂路徑仍受 cwd boundary 保護。
- template/output 使用 filesystem identity 防 case-insensitive alias。
- failure logging 只有責任層記錄一次。
- GitHub Actions 使用 immutable SHA。

## Known limits

- GitHub Actions workflow 已建立，採 Node.js 22、24 matrix；遠端 CI run 以 GitHub Actions 頁面為準，不能用本機結果代替。
- Node.js 的 `--experimental-test-coverage` 會合併 child-process E2E coverage；重複執行時分支／行數可能因 subprocess 覆蓋收集時序小幅變動，因此表格記錄指定 `npm run check` 的實際輸出，不宣稱固定門檻。
- 未執行真實 AWS deployment、IAM policy simulation、CloudFront/S3 integration 或負載測試。
- POSIX file mode (`0600`) 在 Windows/non-POSIX filesystem 的語義可能不同。
- 本機 path adapter 的 TOCTOU residual risk 僅接受於 single-user CLI；禁止原樣重用於 hosted/multi-user 服務。

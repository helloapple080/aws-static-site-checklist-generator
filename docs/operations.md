# Operations and Observability

## Runtime behavior

- stdout：**成功時**一行 JSON 結果，供 CI 或其他程式解析；失敗時 stdout 為空。
- stderr：newline-delimited JSON structured logs；成功與失敗都由事件表示。
- exit code `0`：成功；非 `0`：參數、驗證或 I/O 失敗。

## Log schema

| Field | Description |
|---|---|
| `timestamp` | UTC ISO-8601 |
| `level` | debug/info/warn/error |
| `event` | stable event name |
| `correlation_id` | single CLI invocation ID |
| `component` | `checklist-generator` |
| `duration_ms` | operation latency |
| `bytes` | generated output size on success |
| `error_code` / `error_type` | categorized failure metadata, no raw input |

Events：

- `checklist.arguments.failed`
- `checklist.generate.started`
- `checklist.generate.succeeded`
- `checklist.generate.failed`

## Local runbook

```bash
LOG_LEVEL=info npm run generate 1>result.json 2>operation.log
node -e 'JSON.parse(require("fs").readFileSync("result.json", "utf8"))'
```

排查順序：

1. 檢查 exit code。
2. 解析 stderr 最後一筆 `error_code`／`error_type`。
3. 檢查 output/template 是否位於目前目錄、是否 symlink、template 是否超過 1 MiB。
4. 執行 `npm run check` 重現。
5. 不要把完整路徑、template 或使用者輸入貼到公開 issue；先遮罩。

## Monitoring if hosted in AWS (not deployed)

- CloudWatch Logs：JSON log，retention 30–90 天依資料政策設定。
- Metrics：invocations、errors、duration p50/p95/p99、output bytes、throttles。
- Alarms：error rate、Lambda errors/throttles、API Gateway 5xx、latency budget。
- Tracing：API Gateway/Lambda active tracing，correlation ID 貫穿 request。
- Health：Lambda 無長存 health endpoint；以 canary smoke test 驗證 end-to-end。

## Retry policy

本地同步檔案產生不做盲目 retry：驗證錯誤與權限錯誤不可重試，atomic rename 的失敗需先由使用者修正。若未來加入網路 adapter，只對明確 transient 且冪等操作採 bounded exponential backoff + jitter，並記錄 attempt。

## Rollback and recovery

- 程式 rollback：以版本控制切回已驗證版本，重新跑 `npm ci && npm run check`。
- 產出 rollback：atomic rename 可避免半檔；若要保留歷史版本，應由呼叫端或未來 S3 versioning 處理。
- Backup：source code 由 Git 管理；generated checklist 可重建，除非含人工勾選紀錄才需另行備份。

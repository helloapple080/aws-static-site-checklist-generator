# ADR 0001: Use a modular monolith CLI

- **Status:** Accepted
- **Date:** 2026-07-20

## Context

工具目前只需在本機或 CI 由單一命令產生 Markdown。沒有多人遠端 API、共享資料庫、非同步工作或獨立擴展需求。

## Decision

採用單一 Node.js process，內部分離 CLI interface、application use case、domain、filesystem adapter 與 logger。只使用 Node built-ins，不加入 web framework、DI container 或 AWS SDK。

## Consequences

### Positive

- 邊界可測試，未來可替換 Lambda/API/S3 adapters。
- 零 runtime dependency，啟動快且供應鏈面積小。
- 部署與維運成本最低。

### Negative

- 目前只適合本機可信單一使用者情境。
- filesystem adapter 有平台差異與 TOCTOU residual risk。
- 若需遠端服務，必須新增 auth、rate limit、schema、observability 與 IaC。

## Alternatives rejected

- **Microservices:** 無獨立擴展或團隊邊界，增加網路與維運故障面。
- **Lambda immediately:** 尚無遠端呼叫需求，會引入 IAM、API、部署與成本但沒有實際收益。
- **Large CLI framework:** 參數數量小，Node built-ins 足夠；待介面複雜度有證據時再評估。

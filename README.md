# AWS Static Site Checklist Generator

[![CI](https://github.com/helloapple080/aws-static-site-checklist-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/helloapple080/aws-static-site-checklist-generator/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22%20%7C%2024-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **靜態網站最常見的事故，不是 S3 或 CloudFront 壞掉，而是大家以為「檔案上去了」就算上線完成。**

這個 CLI 是我用來把上線前容易被遺漏的事攤開：DNS、TLS、IAM、logging、rollback、監控、災難復原，以及「這次誰負責確認」。它不會替你部署 AWS；它產生一份能被人審閱、修改與簽核的 checklist。

## 直接產生一份 checklist

需要 Node.js 22+ 與 npm 10+。

```bash
npm ci --ignore-scripts
node src/generate-checklist.js \
  --project "Client Landing Page" \
  --domain "client.example.com" \
  --owner "Platform Team" \
  --environment "production" \
  --output examples/client-checklist.md
```

成功時 stdout 只輸出機器可讀的 JSON；structured log 則寫到 stderr，方便 CI 或 shell 把結果和日誌分開。

## 我刻意不把它做成 deploy tool

「產出一份 checklist」和「變更雲端資源」是不同責任。這個工具不登入 AWS、不讀 `.env`、不建立或修改任何雲端資源。它比較適合在真正按下 deploy 前，讓人確認自己是不是還漏了 rollback 或觀測性。

為了讓產物可信，它也會：

- 驗證 project、owner、domain、environment 與控制字元；輸入會做 Markdown/HTML-safe escaping。
- 限制自訂 template/output 只能在目前工作目錄，並處理 symlink/path traversal。
- 用同目錄暫存檔與 atomic rename，避免留下半寫的 checklist。
- 保持零第三方 runtime dependency，降低這個小工具本身的供應鏈負擔。

## 驗證

```bash
npm run check
npm audit --audit-level=high
```

`npm run check` 不會改寫 repo，會跑 lint、tests 和 coverage；測試涵蓋 unit、真實檔案 I/O、symlink/path traversal 與 child-process E2E。完整結果見 [驗證紀錄](docs/verification.md)。

目前的證據是本機與 CI 測試；這個專案**尚未部署 AWS**，也不表示任何資源已自動符合 checklist。

## 延伸閱讀

- [架構與資料流](docs/architecture.md)
- [資安與威脅模型](docs/security.md)
- [維運考量](docs/operations.md)
- [這個工具解決的情境](docs/case-studies/aws-static-site-checklist-generator.md)

未來如果真的有多人、遠端呼叫和維運責任的需求，才考慮新增 API Gateway/Lambda、S3 output adapter、CloudWatch metrics 和最小權限 IaC；不會因為能做就先服務化。

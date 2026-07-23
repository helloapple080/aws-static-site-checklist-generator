# Serverless AWS Cleanup Monitor — Case Study Template

## One-line value proposition

自動偵測 AWS 帳號中的閒置資源，降低不必要雲端成本與人工巡檢時間。

## Problem

Small teams often create temporary AWS resources during testing and forget to clean them up. Elastic IPs, old snapshots, unused EBS volumes, and forgotten test infrastructure can quietly increase monthly cost. Manual checks are easy to forget and hard to standardize.

## Solution architecture

```text
EventBridge Schedule
    ↓
Lambda Function
    ↓
AWS SDK resource query
    ↓
Filter risky or unused resources
    ↓
SNS / Slack / Email notification
    ↓
CloudWatch Logs
```

## First automation candidates

1. Unattached Elastic IP monitor
2. Old EBS snapshot report
3. Missing required tag checker
4. S3 bucket public access review summary
5. Daily AWS billing CSV anomaly reporter

## Skills demonstrated

- AWS Lambda serverless automation
- EventBridge scheduled jobs
- AWS SDK usage
- IAM least privilege thinking
- CloudWatch logging
- Cost hygiene and operational reporting
- Turning ops knowledge into reusable templates

## Next implementation idea

Build a deployable version using AWS SAM or Terraform. Keep it free/local at first by using mock data and generated Markdown reports before touching any real AWS account.

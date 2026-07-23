# Project Engineering Rules

- Follow the `enterprise-cloud-ready-project-standards` skill.
- Preserve the modular dependency direction documented in `docs/architecture.md`.
- Use RED → GREEN → REFACTOR for behavior changes.
- Do not declare completion until `npm run check` and `npm audit --audit-level=high` pass with fresh output.
- Never read or commit `.env`, credentials, tokens, customer data, or raw private logs.
- Keep logs structured and free of raw user input or secrets.
- Update architecture, security, operations and verification docs when behavior changes.
- This repository is cloud-ready design only; do not claim an AWS deployment without real evidence.
- Do not deploy, purchase, delete cloud resources, or commit/push without explicit user approval.

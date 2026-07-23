import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs, renderChecklist } from "../src/generate-checklist.js";

test("parseArgs reads checklist generation options", () => {
  const args = parseArgs([
    "--project", "Client Landing Page",
    "--domain", "client.example.com",
    "--owner", "阿豬",
    "--environment", "staging",
    "--output", "examples/client.md",
  ]);

  assert.equal(args.project, "Client Landing Page");
  assert.equal(args.domain, "client.example.com");
  assert.equal(args.owner, "阿豬");
  assert.equal(args.environment, "staging");
  assert.equal(args.output, "examples/client.md");
});

test("renderChecklist replaces all supported placeholders", () => {
  const rendered = renderChecklist(
    "Project={{PROJECT_NAME}} Domain={{DOMAIN}} Owner={{OWNER}} Env={{ENVIRONMENT}} At={{GENERATED_AT}}",
    {
      project: "Docs Site",
      domain: "docs.example.com",
      owner: "Ops",
      environment: "production",
    },
    "2026-07-19T00:00:00.000Z",
  );

  assert.equal(rendered, "Project=Docs Site Domain=docs.example.com Owner=Ops Env=production At=2026-07-19T00:00:00.000Z");
});

test("parseArgs rejects unknown options", () => {
  assert.throws(() => parseArgs(["--bad", "value"]), /Unknown option/);
});

test("parseArgs rejects missing option value", () => {
  assert.throws(() => parseArgs(["--project"]), /Missing value/);
});

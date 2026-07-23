import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { validateOptions, renderChecklist } from "../src/domain/checklist.js";
import { readUtf8File, resolveWithin, writeFileAtomic } from "../src/infrastructure/filesystem.js";
import { generateChecklist } from "../src/application/generate-checklist.js";
import { createLogger } from "../src/observability/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const cliPath = path.join(projectRoot, "src/generate-checklist.js");

function validOptions(overrides = {}) {
  return {
    project: "Docs Site",
    domain: "docs.example.com",
    owner: "Platform Team",
    environment: "production",
    output: "output.md",
    template: "template.md",
    ...overrides,
  };
}

test("validateOptions rejects malformed domains, unsupported environments, and control characters", () => {
  assert.throws(() => validateOptions(validOptions({ domain: "not a domain" })), /domain/i);
  assert.throws(() => validateOptions(validOptions({ environment: "prod-ish" })), /environment/i);
  assert.throws(() => validateOptions(validOptions({ project: "safe\nInjected" })), /control/i);
});

test("renderChecklist rejects unresolved placeholders", () => {
  assert.throws(
    () => renderChecklist("Project={{PROJECT_NAME}} {{UNKNOWN}}", validOptions(), "2026-07-20T00:00:00.000Z"),
    /placeholder/i,
  );
});

test("renderChecklist validates direct callers, escapes Markdown/HTML, and rejects malformed placeholders", () => {
  const hostile = validOptions({ project: '<script>alert(1)</script> [click](javascript:alert(1))' });
  const rendered = renderChecklist("# {{PROJECT_NAME}}", hostile, "2026-07-20T00:00:00.000Z");
  assert.doesNotMatch(rendered, /<script>|\[click\]\(/);
  assert.match(rendered, /&lt;script&gt;/);
  assert.throws(() => renderChecklist("{{BROKEN", validOptions()), /placeholder/i);
  assert.throws(() => renderChecklist("{{PROJECT_NAME}}", { ...validOptions(), owner: undefined }), /owner/i);
});

test("resolveWithin rejects path traversal and intermediate symbolic links", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-path-"));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-outside-"));
  try {
    assert.throws(() => resolveWithin(base, "../outside.md"), /outside/i);
    fs.symlinkSync(outside, path.join(base, "linked-dir"));
    assert.throws(() => resolveWithin(base, "linked-dir/output.md"), /symbolic link/i);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});

test("readUtf8File rejects directories and oversized templates", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-template-"));
  const oversized = path.join(base, "large.md");
  fs.writeFileSync(oversized, "x".repeat(17));
  try {
    assert.throws(() => readUtf8File(base), /regular file/i);
    assert.throws(() => readUtf8File(oversized, 16), /exceeds/i);
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test("writeFileAtomic refuses to overwrite a symbolic link", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-symlink-"));
  const outside = path.join(os.tmpdir(), `outside-${process.pid}.md`);
  const link = path.join(base, "output.md");
  fs.writeFileSync(outside, "do not overwrite");
  fs.symlinkSync(outside, link);
  try {
    assert.throws(() => writeFileAtomic(link, "unsafe"), /symbolic link/i);
    assert.equal(fs.readFileSync(outside, "utf8"), "do not overwrite");
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
    fs.rmSync(outside, { force: true });
  }
});

test("logger owns its schema and accepts only allowlisted scalar fields", () => {
  const events = [];
  const logger = createLogger({ sink: (line) => events.push(JSON.parse(line)), correlationId: "owned-correlation" });
  logger.info("owned.event", {
    event: "forged.event",
    correlation_id: "forged-correlation",
    component: "forged-component",
    timestamp: "forged-time",
    level: "error",
    nested: { token: "secret-value" },
    bytes: 42,
  });
  assert.deepEqual(events[0], {
    timestamp: events[0].timestamp,
    level: "info",
    event: "owned.event",
    correlation_id: "owned-correlation",
    component: "checklist-generator",
    bytes: 42,
  });
  assert.doesNotMatch(JSON.stringify(events[0]), /secret-value|forged/);
});

test("generateChecklist rejects case-insensitive aliases of the template", (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-case-alias-"));
  const template = path.join(base, "Template.md");
  const alias = path.join(base, "template.md");
  fs.writeFileSync(template, "{{PROJECT_NAME}}");
  try {
    if (!fs.existsSync(alias)) {
      t.skip("filesystem is case-sensitive");
      return;
    }
    assert.throws(
      () => generateChecklist(validOptions({ template, output: alias }), { baseDir: base }),
      /overwrite|collision/i,
    );
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
  }
});

test("generateChecklist performs real file I/O and emits structured events", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-integration-"));
  const template = path.join(base, "template.md");
  const output = path.join(base, "out", "checklist.md");
  fs.writeFileSync(template, "# {{PROJECT_NAME}}\nDomain={{DOMAIN}}\nEnv={{ENVIRONMENT}}\nOwner={{OWNER}}\nAt={{GENERATED_AT}}\n");
  const events = [];
  const logger = createLogger({ sink: (line) => events.push(JSON.parse(line)), correlationId: "test-correlation" });

  const result = generateChecklist(validOptions({ template, output }), { baseDir: base, logger, now: () => new Date("2026-07-20T00:00:00.000Z") });

  assert.equal(result.outputPath, output);
  assert.match(fs.readFileSync(output, "utf8"), /# Docs Site/);
  assert.deepEqual(events.map((event) => event.event), ["checklist.generate.started", "checklist.generate.succeeded"]);
  assert.ok(events.every((event) => event.correlation_id === "test-correlation"));
  assert.ok(events.every((event) => !JSON.stringify(event).includes("docs.example.com")));
  assert.equal(fs.statSync(output).mode & 0o777, 0o600);
  fs.rmSync(base, { recursive: true, force: true });
});

test("CLI returns machine-readable success and single failure events", () => {
  const base = fs.mkdtempSync(path.join(projectRoot, ".tmp-e2e-"));
  const output = path.relative(projectRoot, path.join(base, "result.md"));
  let externalCwd;
  try {
    const success = spawnSync(process.execPath, [cliPath, "--project", "E2E Site", "--domain", "e2e.example.com", "--owner", "Ops", "--environment", "staging", "--output", output], {
      cwd: projectRoot,
      encoding: "utf8",
      env: { ...process.env, LOG_LEVEL: "info" },
    });
    assert.equal(success.status, 0, success.stderr);
    assert.equal(JSON.parse(success.stdout).status, "ok");
    const successEvents = success.stderr.trim().split("\n").map(JSON.parse);
    assert.equal(successEvents.at(-1).event, "checklist.generate.succeeded");

    const failure = spawnSync(process.execPath, [cliPath, "--domain", "invalid domain"], { cwd: projectRoot, encoding: "utf8" });
    assert.notEqual(failure.status, 0);
    assert.equal(JSON.parse(failure.stderr.trim().split("\n").at(-1)).event, "checklist.generate.failed");

    const argumentFailure = spawnSync(process.execPath, [cliPath, "--unknown", "value"], { cwd: projectRoot, encoding: "utf8" });
    assert.notEqual(argumentFailure.status, 0);
    assert.equal(argumentFailure.stdout, "");
    const argumentEvents = argumentFailure.stderr.trim().split("\n").map(JSON.parse);
    assert.deepEqual(argumentEvents.map((event) => event.event), ["checklist.arguments.failed"]);

    const samePath = "templates/aws-static-site-deploy-checklist.md";
    const duplicateLogGuard = spawnSync(process.execPath, [cliPath, "--template", samePath, "--output", samePath], { cwd: projectRoot, encoding: "utf8" });
    assert.notEqual(duplicateLogGuard.status, 0);
    const duplicateLogEvents = duplicateLogGuard.stderr.trim().split("\n").map(JSON.parse);
    assert.deepEqual(duplicateLogEvents.map((event) => event.event), ["checklist.generate.started", "checklist.generate.failed"]);

    externalCwd = fs.mkdtempSync(path.join(os.tmpdir(), "checklist-external-cwd-"));
    const externalRun = spawnSync(process.execPath, [cliPath], { cwd: externalCwd, encoding: "utf8" });
    assert.equal(externalRun.status, 0, externalRun.stderr);
    assert.ok(fs.existsSync(path.join(externalCwd, "example-output.md")));
  } finally {
    fs.rmSync(base, { recursive: true, force: true });
    if (externalCwd) fs.rmSync(externalCwd, { recursive: true, force: true });
  }
});

import { randomUUID } from "node:crypto";

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const FIELD_VALIDATORS = {
  bytes: (value) => Number.isSafeInteger(value) && value >= 0,
  duration_ms: (value) => typeof value === "number" && Number.isFinite(value) && value >= 0,
  error_code: (value) => typeof value === "string" && value.length <= 128,
  error_type: (value) => typeof value === "string" && value.length <= 128,
};

function selectFields(fields) {
  const selected = {};
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return selected;
  for (const [key, validator] of Object.entries(FIELD_VALIDATORS)) {
    if (validator(fields[key])) selected[key] = fields[key];
  }
  return selected;
}

export function createLogger({ sink = (line) => process.stderr.write(`${line}\n`), correlationId = randomUUID(), level = process.env.LOG_LEVEL ?? "info", now = () => new Date() } = {}) {
  const threshold = LEVELS[level] ?? LEVELS.info;

  function log(logLevel, event, fields = {}) {
    if (LEVELS[logLevel] < threshold) return;
    sink(JSON.stringify({
      timestamp: now().toISOString(),
      level: logLevel,
      event,
      correlation_id: correlationId,
      component: "checklist-generator",
      ...selectFields(fields),
    }));
  }

  return {
    correlationId,
    debug: (event, fields) => log("debug", event, fields),
    info: (event, fields) => log("info", event, fields),
    warn: (event, fields) => log("warn", event, fields),
    error: (event, fields) => log("error", event, fields),
  };
}

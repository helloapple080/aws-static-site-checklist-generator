const ALLOWED_ENVIRONMENTS = new Set(["development", "staging", "production"]);
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const MAX_VALUE_LENGTH = 256;

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
  }
}

function validateText(name, value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${name} must be a non-empty string`);
  }
  if (value.length > MAX_VALUE_LENGTH) {
    throw new ValidationError(`${name} exceeds ${MAX_VALUE_LENGTH} characters`);
  }
  if (CONTROL_CHARACTER_PATTERN.test(value)) {
    throw new ValidationError(`${name} contains control characters`);
  }
}

function validateRenderValues(options) {
  if (!options || typeof options !== "object") {
    throw new ValidationError("options must be an object");
  }
  for (const field of ["project", "domain", "owner", "environment"]) {
    validateText(field, options[field]);
  }
  if (!DOMAIN_PATTERN.test(options.domain)) {
    throw new ValidationError("domain must be a valid DNS hostname");
  }
  if (!ALLOWED_ENVIRONMENTS.has(options.environment)) {
    throw new ValidationError(`environment must be one of: ${[...ALLOWED_ENVIRONMENTS].join(", ")}`);
  }
  return { ...options };
}

export function validateOptions(options) {
  const validated = validateRenderValues(options);
  for (const field of ["output", "template"]) {
    validateText(field, validated[field]);
  }
  return validated;
}

export function escapeMarkdownText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/([\\`*_{}\[\]()#+!|])/g, "\\$1");
}

export function renderChecklist(template, values, generatedAt = new Date().toISOString()) {
  if (typeof template !== "string" || template.length === 0) {
    throw new ValidationError("template must be a non-empty string");
  }
  const validated = validateRenderValues(values);
  const replacements = {
    PROJECT_NAME: escapeMarkdownText(validated.project),
    DOMAIN: escapeMarkdownText(validated.domain),
    OWNER: escapeMarkdownText(validated.owner),
    ENVIRONMENT: escapeMarkdownText(validated.environment),
    GENERATED_AT: escapeMarkdownText(generatedAt),
  };
  const output = template.replace(
    /{{(PROJECT_NAME|DOMAIN|OWNER|ENVIRONMENT|GENERATED_AT)}}/g,
    (_, key) => replacements[key],
  );
  if (output.includes("{{") || output.includes("}}")) {
    throw new ValidationError("template contains an unsupported or malformed placeholder");
  }
  return output;
}

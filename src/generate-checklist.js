import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateChecklist } from "./application/generate-checklist.js";
import { renderChecklist } from "./domain/checklist.js";
import { createLogger } from "./observability/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_TEMPLATE_PATH = path.resolve(__dirname, "../templates/aws-static-site-deploy-checklist.md");

export function parseArgs(argv) {
  const values = {
    project: "Example Static Site",
    domain: "example.com",
    owner: "Engineering Team",
    environment: "production",
    output: "example-output.md",
    template: DEFAULT_TEMPLATE_PATH,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (!key.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${key}`);
    }
    if (!next || next.startsWith("--")) {
      throw new Error(`Missing value for ${key}`);
    }
    const name = key.slice(2);
    if (!(name in values)) {
      throw new Error(`Unknown option: ${key}`);
    }
    values[name] = next;
    i += 1;
  }
  return values;
}

export { renderChecklist, generateChecklist };

export function runCli(argv = process.argv.slice(2)) {
  const logger = createLogger();
  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    logger.error("checklist.arguments.failed", { error_code: "CLI_ARGUMENT_ERROR", error_type: error.name ?? "Error" });
    return 1;
  }

  try {
    const result = generateChecklist(options, {
      baseDir: process.cwd(),
      logger,
      trustedTemplatePath: DEFAULT_TEMPLATE_PATH,
    });
    process.stdout.write(`${JSON.stringify({ status: "ok", ...result })}\n`);
    return 0;
  } catch {
    // The application layer already emitted one structured failure event.
    return 1;
  }
}

if (process.argv[1] === __filename) {
  process.exitCode = runCli();
}

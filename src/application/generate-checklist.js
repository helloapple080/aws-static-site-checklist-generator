import path from "node:path";
import { renderChecklist, validateOptions } from "../domain/checklist.js";
import { pathsReferToSameFile, readUtf8File, resolveWithin, writeFileAtomic } from "../infrastructure/filesystem.js";

export function generateChecklist(options, { baseDir = process.cwd(), logger, now = () => new Date(), trustedTemplatePath } = {}) {
  const startedAt = process.hrtime.bigint();
  logger?.info("checklist.generate.started");
  try {
    const validated = validateOptions(options);
    const requestedTemplate = path.resolve(baseDir, validated.template);
    const trustedTemplate = trustedTemplatePath ? path.resolve(trustedTemplatePath) : undefined;
    const templatePath = trustedTemplate && requestedTemplate === trustedTemplate
      ? trustedTemplate
      : resolveWithin(baseDir, validated.template);
    const outputPath = resolveWithin(baseDir, validated.output);
    if (pathsReferToSameFile(templatePath, outputPath)) {
      const error = new Error("output path must not overwrite the template");
      error.name = "FileCollisionError";
      error.code = "FILE_COLLISION_ERROR";
      throw error;
    }
    const template = readUtf8File(templatePath);
    const output = renderChecklist(template, validated, now().toISOString());
    writeFileAtomic(outputPath, output);
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const result = { outputPath, bytes: Buffer.byteLength(output), durationMs: Math.round(durationMs * 1000) / 1000 };
    logger?.info("checklist.generate.succeeded", { bytes: result.bytes, duration_ms: result.durationMs });
    return result;
  } catch (error) {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    logger?.error("checklist.generate.failed", {
      error_code: error.code ?? "GENERATION_ERROR",
      error_type: error.name ?? "Error",
      duration_ms: Math.round(durationMs * 1000) / 1000,
    });
    throw error;
  }
}

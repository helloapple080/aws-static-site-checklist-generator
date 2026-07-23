import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export class FileBoundaryError extends Error {
  constructor(message) {
    super(message);
    this.name = "FileBoundaryError";
    this.code = "FILE_BOUNDARY_ERROR";
  }
}

export function resolveWithin(baseDir, candidate) {
  const base = path.resolve(baseDir);
  const resolved = path.resolve(base, candidate);
  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new FileBoundaryError("path resolves outside the allowed project boundary");
  }

  const relativeParts = path.relative(base, resolved).split(path.sep).filter(Boolean);
  let current = base;
  for (const part of relativeParts) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) {
      throw new FileBoundaryError("path contains a symbolic link");
    }
  }
  return resolved;
}

export function pathsReferToSameFile(firstPath, secondPath) {
  if (path.normalize(firstPath) === path.normalize(secondPath)) return true;
  try {
    const first = fs.statSync(firstPath);
    const second = fs.statSync(secondPath);
    return first.dev === second.dev && first.ino === second.ino;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function readUtf8File(filePath, maxBytes = 1_048_576) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    throw new FileBoundaryError("template path must reference a regular file");
  }
  if (stat.size > maxBytes) {
    throw new FileBoundaryError(`template exceeds ${maxBytes} bytes`);
  }
  return fs.readFileSync(filePath, "utf8");
}

export function writeFileAtomic(filePath, content) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isSymbolicLink()) {
    throw new FileBoundaryError("refusing to overwrite a symbolic link");
  }

  const temporaryPath = path.join(directory, `.${path.basename(filePath)}.${randomUUID()}.tmp`);
  try {
    fs.writeFileSync(temporaryPath, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
    fs.renameSync(temporaryPath, filePath);
    fs.chmodSync(filePath, 0o600);
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
}

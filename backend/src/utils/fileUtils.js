// src/utils/fileUtils.js
import { promises as fs } from "fs";
import path from "path";
import os from "os";

import { exec } from "child_process";

/* ---------- Config ---------- */
const BASE = process.env.FILE_OP_BASE || os.homedir();
const READ_MAX_BYTES = parseInt(process.env.READ_MAX_BYTES || "5000000", 10);
const AUTO_RESOLVE_BARE_NAMES =
  (process.env.AUTO_RESOLVE_BARE_NAMES ?? "true") === "true";

/* ---------- Helpers ---------- */

function looksLikeFile(p) {
  if (!p) return false;
  const last = path.basename(p);
  if (last.startsWith(".") && last.indexOf(".", 1) === -1) return true;
  return last.includes(".");
}

function expandTilde(p) {
  if (!p || typeof p !== "string") return p;
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return p;
}

function resolveAgainstBase(targetPath, base = BASE) {
  if (!targetPath) return null;
  const expanded = expandTilde(targetPath);
  // If it's a single bare name and AUTO_RESOLVE_BARE_NAMES enabled, prefer Desktop/cwd/home
  if (
    AUTO_RESOLVE_BARE_NAMES &&
    !path.isAbsolute(expanded) &&
    !expanded.includes("/")
  ) {
    // prefer last-used: Desktop -> cwd -> base
    const desktop = path.join(os.homedir(), "Desktop");
    if (existsSync(desktop)) return path.resolve(desktop, expanded);
    return path.resolve(process.cwd(), expanded);
  }
  const resolved = path.isAbsolute(expanded)
    ? path.resolve(expanded)
    : path.resolve(base, expanded);
  return path.normalize(resolved);
}

function isInsideBase(resolvedPath, base = BASE) {
  if (!resolvedPath) return false;
  const baseResolved = path.resolve(base);
  if (baseResolved === path.resolve("/")) return true; // full access allowed
  const rel = path.relative(baseResolved, resolvedPath);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}

async function ensureParentDir(fullPath) {
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
}

/* Light-weight sync exists for heuristics */
import fsSync from "fs";
function existsSync(p) {
  try {
    return fsSync.existsSync(p);
  } catch {
    return false;
  }
}

/* ---------- normalizeAction (improved) ---------- */
export function normalizeAction(actionObj) {
  if (!actionObj || typeof actionObj !== "object") return actionObj;
  let { action, path: targetPath, content, dest, command } = actionObj;

  // trim and lower action
  if (typeof action === "string") action = action.trim().toLowerCase();

  // synonyms -> canonical
  const touchSynonyms = new Set(["touch", "create_file", "createfile"]);
  const mkdirSyn = new Set(["mkdir", "create_folder", "create_dir", "makedir"]);
  const deleteSyn = new Set([
    "rm",
    "rm -rf",
    "rmdir",
    "remove",
    "delete",
    "delete_folder",
    "delete_dir",
    "del",
  ]);

  if (!action) {
    // guess from path
    if (targetPath && looksLikeFile(targetPath)) action = "write";
    else action = "none";
  }

  if (touchSynonyms.has(action)) action = "write";
  if (mkdirSyn.has(action)) action = "mkdir";
  if (deleteSyn.has(action)) action = "delete";

  // mkdir on filename -> convert to write
  if (action === "mkdir" && looksLikeFile(targetPath)) {
    action = "write";
    content = content ?? "";
  }

  // write on folder-like path with no content -> mkdir
  if (
    action === "write" &&
    targetPath &&
    !looksLikeFile(targetPath) &&
    (content === undefined || content === null)
  ) {
    action = "mkdir";
  }

  // normalize dest tilde
  if (typeof dest === "string") dest = expandTilde(dest);

  return { action, path: targetPath, content, dest, command };
}

async function execShellCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/* ---------- execAction (improved delete behavior & consistent returns) ---------- */
export async function execAction({ action, path: targetPath, content, dest, command }) {
  if (!action) return { error: "No action specified", code: "NO_ACTION" };

  // Resolve paths
  let fullPath = targetPath ? resolveAgainstBase(targetPath) : null;
  let fullDest = dest ? resolveAgainstBase(dest) : null;

  // Safety checks
  try {
    if (fullPath && !isInsideBase(fullPath)) {
      return {
        error: "Path outside allowed base",
        code: "OUTSIDE_BASE",
        path: fullPath,
        base: path.resolve(BASE),
      };
    }
    if (fullDest && !isInsideBase(fullDest)) {
      return {
        error: "Destination outside allowed base",
        code: "DEST_OUTSIDE_BASE",
        dest: fullDest,
        base: path.resolve(BASE),
      };
    }
  } catch (e) {
    return {
      error: "Path validation failed",
      code: "PATH_VALIDATION_FAILED",
      message: String(e),
    };
  }

  try {
    switch (action) {
      case "shell": {
        if (!command)
          return { error: "command required for shell", code: "MISSING_COMMAND" };
        return await execShellCommand(command);
      }
      case "list": {
        if (!fullPath)
          return { error: "path required for list", code: "MISSING_PATH" };
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        return {
          ok: true,
          path: fullPath,
          entries: items.map((d) => ({
            name: d.name,
            type: d.isDirectory() ? "dir" : "file",
          })),
        };
      }

      case "read": {
        if (!fullPath)
          return { error: "path required for read", code: "MISSING_PATH" };
        const stat = await fs.stat(fullPath).catch(() => null);
        if (!stat)
          return { error: "File not found", code: "NOT_FOUND", path: fullPath };
        if (stat.isDirectory())
          return {
            error: "Path is a directory",
            code: "IS_DIR",
            path: fullPath,
          };
        if (stat.size > READ_MAX_BYTES)
          return {
            error: "File too large",
            code: "TOO_LARGE",
            size: stat.size,
          };
        const contentStr = await fs.readFile(fullPath, "utf8");
        return { ok: true, path: fullPath, content: contentStr };
      }

      case "write": {
        if (!fullPath)
          return { error: "path required for write", code: "MISSING_PATH" };
        await ensureParentDir(fullPath);
        const tmp = `${fullPath}.tmp-${process.pid}-${Date.now()}`;
        await fs.writeFile(tmp, content ?? "", "utf8");
        await fs.rename(tmp, fullPath);
        return { ok: true, path: fullPath };
      }

      case "append": {
        if (!fullPath)
          return { error: "path required for append", code: "MISSING_PATH" };
        await ensureParentDir(fullPath);
        await fs.appendFile(fullPath, content ?? "", "utf8");
        return { ok: true, path: fullPath };
      }

      case "touch": {
        if (!fullPath)
          return { error: "path required for touch", code: "MISSING_PATH" };
        await ensureParentDir(fullPath);
        const exists = await fs
          .stat(fullPath)
          .then(() => true)
          .catch(() => false);
        if (!exists) await fs.writeFile(fullPath, "", "utf8");
        else {
          const now = new Date();
          await fs.utimes(fullPath, now, now).catch(() => {});
        }
        return { ok: true, path: fullPath };
      }

      case "delete": {
        if (!fullPath)
          return { error: "path required for delete", code: "MISSING_PATH" };
        // better: check existence: if not found -> return not found
        const exists = await fs
          .stat(fullPath)
          .then(() => true)
          .catch(() => false);
        if (!exists)
          return { error: "Path not found", code: "NOT_FOUND", path: fullPath };
        // If directory and not empty, remove recursively (consistent with 'rm -rf')
        await fs.rm(fullPath, { recursive: true, force: true });
        return { ok: true, path: fullPath };
      }

      case "mkdir": {
        if (!fullPath)
          return { error: "path required for mkdir", code: "MISSING_PATH" };
        await fs.mkdir(fullPath, { recursive: true });
        return { ok: true, path: fullPath };
      }

      case "rename":
      case "move": {
        if (!fullPath || !fullDest)
          return {
            error: "path and dest required for rename/move",
            code: "MISSING_ARGS",
          };
        await ensureParentDir(fullDest);
        await fs.rename(fullPath, fullDest);
        return { ok: true, path: fullDest };
      }

      case "none":
        return { ok: false, reason: "no-op" };

      default:
        return { error: `Unknown action: ${action}`, code: "UNKNOWN_ACTION" };
    }
  } catch (err) {
    const code = err?.code || "ERR";
    const message = err?.message || String(err);
    return {
      error: message,
      code,
      path: fullPath ?? null,
      dest: fullDest ?? null,
    };
  }
}

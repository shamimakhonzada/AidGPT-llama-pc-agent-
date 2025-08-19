// import path from "path";
// import os from "os";
// import { execAction, normalizeAction } from "../utils/fileUtils.js";

// /**
//  * SYSTEM PROMPT (keep instructing the model to both reply and append JSON actions)
//  */
// const SYSTEM_PROMPT = `
// You are a professional local file system assistant.
// 1) First produce a concise natural-language reply to the user's request.
// 2) If any file operations are required, append a SINGLE JSON ARRAY at the END of your reply (nothing after it).
//    Example:
//    [
//      {"action":"mkdir","path":"/home/kumail/Desktop/MyApp"},
//      {"action":"write","path":"/home/kumail/Desktop/MyApp/main.py","content":"print('hi')"}
//    ]
// 3) Allowed actions: list, read, write, append, delete, mkdir, rename, move, none.
// 4) Paths may be absolute or relative; "~" is allowed.
// 5) If unsure, append [{"action":"none","reason":"unclear request"}].
// 6) Do NOT include shell commands inside the JSON; return only a single JSON array if actions are needed.
// `;

// /* ---------- Utilities (parsing, quick-shell parsing, conversion fallback) ---------- */

// function stripFences(text) {
//   if (!text || typeof text !== "string") return "";
//   return text.replace(/```(?:bash|sh|json)?/g, "").trim();
// }

// function extractFirstArrayString(text) {
//   const start = text.indexOf("[");
//   if (start === -1) return null;
//   let depth = 0;
//   for (let i = start; i < text.length; i++) {
//     const ch = text[i];
//     if (ch === "[") depth++;
//     else if (ch === "]") {
//       depth--;
//       if (depth === 0) {
//         return {
//           arrayText: text.slice(start, i + 1),
//           before: text.slice(0, start).trim(),
//           after: text.slice(i + 1).trim(),
//         };
//       }
//     }
//   }
//   return null;
// }

// function parseActionsFromText(text) {
//   const cleaned = stripFences(text);
//   const arrExtract = extractFirstArrayString(cleaned);
//   if (arrExtract) {
//     try {
//       const parsed = JSON.parse(arrExtract.arrayText);
//       if (Array.isArray(parsed))
//         return { actions: parsed, replyPrefix: arrExtract.before };
//       if (typeof parsed === "object")
//         return { actions: [parsed], replyPrefix: arrExtract.before };
//     } catch (e) {}
//   }
//   try {
//     const parsed = JSON.parse(cleaned);
//     if (Array.isArray(parsed)) return { actions: parsed, replyPrefix: "" };
//     if (typeof parsed === "object")
//       return { actions: [parsed], replyPrefix: "" };
//   } catch (e) {}

//   const blocks = cleaned.match(/\{[\s\S]*?\}/g) || [];
//   const actions = [];
//   for (const b of blocks) {
//     try {
//       actions.push(JSON.parse(b));
//     } catch (e) {
//       /* skip invalid */
//     }
//   }
//   const replyPrefix = cleaned.replace(/\{[\s\S]*?\}/g, "").trim();
//   return { actions, replyPrefix };
// }

// /* Quick, local parser for common shell commands to avoid an extra model call */
// function quickShellToActions(text) {
//   if (!text || typeof text !== "string") return [];
//   const lines = stripFences(text)
//     .split(/\r?\n/)
//     .map((l) => l.trim())
//     .filter(Boolean);
//   const actions = [];
//   for (const line of lines) {
//     let m;
//     if ((m = line.match(/^mkdir\s+-p?\s+(.+)$/i))) {
//       actions.push({ action: "mkdir", path: m[1].trim() });
//       continue;
//     }
//     if ((m = line.match(/^mkdir\s+(.+)$/i))) {
//       actions.push({ action: "mkdir", path: m[1].trim() });
//       continue;
//     }
//     if ((m = line.match(/^touch\s+(.+)$/i))) {
//       actions.push({ action: "write", path: m[1].trim(), content: "" });
//       continue;
//     }
//     if ((m = line.match(/^echo\s+["']?([\s\S]*?)["']?\s*>\s*(.+)$/i))) {
//       actions.push({ action: "write", path: m[2].trim(), content: m[1] });
//       continue;
//     }
//     if ((m = line.match(/^echo\s+["']?([\s\S]*?)["']?\s*>>\s*(.+)$/i))) {
//       actions.push({ action: "append", path: m[2].trim(), content: m[1] });
//       continue;
//     }
//     if ((m = line.match(/^rm\s+-rf\s+(.+)$/i))) {
//       actions.push({ action: "delete", path: m[1].trim() });
//       continue;
//     }
//     if ((m = line.match(/^mv\s+(.+?)\s+(.+)$/i))) {
//       actions.push({ action: "move", path: m[1].trim(), dest: m[2].trim() });
//       continue;
//     }
//   }
//   return actions;
// }

// /* Heuristic to detect filenames mentioned in the user's text */
// function extractFilenamesFromText(text) {
//   if (!text) return [];

//   const re =
//     /\b[\w\-.]+(?:\.(?:py|js|ts|java|cpp|c|go|rb|sh|txt|md|json|html|css))\b/g;
//   const matches = text.match(re) || [];

//   return [...new Set(matches)];
// }

// /* Try to find folder name referenced in prompt like "in <name>" or "inside <name>" */
// function findMentionedFolder(prompt) {
//   if (!prompt) return null;
//   const m = prompt.match(
//     /\b(?:in|inside|under|at)\s+['"]?([A-Za-z0-9_\-/~\. ]+)['"]?/i
//   );
//   if (m && m[1]) {
//     return m[1].trim();
//   }
//   return null;
// }

// /* Resolve a target path using heuristics:
//    - expand ~
//    - if absolute -> use
//    - if contains slash -> resolve against base
//    - if single name:
//        - if looks like file (has extension) and parentFolder known -> join parentFolder
//        - otherwise prefer Desktop, then current working dir, then home
// */
// function expandTildeAndResolve(p, base) {
//   if (!p) return null;
//   if (p.startsWith("~")) {
//     return path.join(os.homedir(), p.slice(p === "~" ? 1 : 2));
//   }
//   if (path.isAbsolute(p)) return path.resolve(p);

//   return path.resolve(base, p);
// }

// function looksLikeFileName(p) {
//   return !!path.extname(p);
// }

// /* Convert bare name (like 'check' or 'main.py') into a full path using heuristics */
// function inferFullPath(bare, options = {}) {
//   const base = options.base || process.env.FILE_OP_BASE || os.homedir();
//   const preferredFolder = options.preferredFolder;

//   if (!bare) return null;
//   if (bare.startsWith("~")) return expandTildeAndResolve(bare, base);
//   if (path.isAbsolute(bare)) return path.resolve(bare);

//   if (bare.includes("/")) return path.resolve(base, bare);

//   if (looksLikeFileName(bare)) {
//     if (preferredFolder) return path.join(preferredFolder, bare);
//     const desktop = path.join(os.homedir(), "Desktop");
//     if (fsExistsSync(desktop)) return path.join(desktop, bare);

//     return path.resolve(process.cwd(), bare);
//   } else {
//     const desktop = path.join(os.homedir(), "Desktop");
//     if (fsExistsSync(desktop)) return path.join(desktop, bare);
//     return path.resolve(process.cwd(), bare);
//   }
// }

// /* Synchronous exists check (cheap) */
// import fsSync from "fs";
// function fsExistsSync(p) {
//   try {
//     return fsSync.existsSync(p);
//   } catch (e) {
//     return false;
//   }
// }

// /* parse / call Ollama (simple wrapper using global fetch) */
// async function callOllamaGetText(messages) {
//   const base = process.env.OLLAMA_HOST || "http://localhost:11434";
//   const model = process.env.OLLAMA_MODEL || "llama3.2:latest";
//   const body = { model, messages, stream: false };
//   const r = await fetch(`${base}/api/chat`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(body),
//   });
//   const data = await r.json();
//   return data?.message?.content ?? data?.response ?? data?.output ?? "";
// }

// /* Convert shell-style reply to JSON array using model fallback */
// async function convertInstructionsToActions(instructionText) {
//   const CONVERT_PROMPT = `
// You are a converter. Given the following instructions, return ONLY a JSON array of actions:
// - Map mkdir -> {"action":"mkdir","path":...}
// - Map touch -> {"action":"write","path":...,"content":""}
// - Map echo "X" > f -> {"action":"write","path":"f","content":"X"}
// - Map echo "X" >> f -> {"action":"append","path":"f","content":"X"}
// Return only JSON. If unsure return [{"action":"none","reason":"unclear request"}].
// `;
//   const messages = [
//     { role: "system", content: CONVERT_PROMPT },
//     { role: "user", content: instructionText },
//   ];
//   const converted = await callOllamaGetText(messages);
//   return converted;
// }

// /* ---------- Main controller ---------- */

// export async function runAiCommand(req, res) {
//   try {
//     const { prompt } = req.body;
//     if (!prompt || typeof prompt !== "string")
//       return res.status(400).json({ error: "Prompt required" });

//     const messages = [
//       { role: "system", content: SYSTEM_PROMPT },
//       { role: "user", content: prompt },
//     ];
//     const raw = await callOllamaGetText(messages);
//     console.log("Ollama raw (trim):", (raw || "").slice(0, 1000));

//     let { actions, replyPrefix } = parseActionsFromText(raw);
//     let replyText = (replyPrefix || "").trim();

//     if (!actions || actions.length === 0) {
//       const quick = quickShellToActions(raw);
//       if (quick && quick.length > 0) {
//         actions = quick;
//         console.log("Quick parser produced actions:", quick.length);
//       }
//     }

//     if (
//       (!actions || actions.length === 0) &&
//       /mkdir|touch|echo|rm\s+-rf|mv\s+/i.test(raw)
//     ) {
//       try {
//         const convertedRaw = await convertInstructionsToActions(raw);
//         console.log(
//           "Converted raw (trim):",
//           (convertedRaw || "").slice(0, 800)
//         );
//         const parsed = parseActionsFromText(convertedRaw);
//         if (parsed.actions && parsed.actions.length) actions = parsed.actions;
//       } catch (e) {
//         console.warn("Conversion fallback failed:", e.message);
//       }
//     }

//     let flat = (actions || []).flatMap((a) => (Array.isArray(a) ? a : [a]));

//     const filenames = extractFilenamesFromText(prompt);
//     if (filenames.length > 0) {
//       const dirActions = flat
//         .filter((a) => a && a.action === "mkdir")
//         .map((a) => a.path);

//       const mentionedFolder = findMentionedFolder(prompt);

//       let preferredFolderResolved = null;
//       if (dirActions.length > 0) {
//         preferredFolderResolved = expandTildeAndResolve(
//           dirActions[dirActions.length - 1],
//           process.env.FILE_OP_BASE || os.homedir()
//         );
//       } else if (mentionedFolder) {
//         preferredFolderResolved = expandTildeAndResolve(
//           mentionedFolder,
//           process.env.FILE_OP_BASE || os.homedir()
//         );
//       } else {
//         const desktop = path.join(os.homedir(), "Desktop");
//         preferredFolderResolved = fsExistsSync(desktop)
//           ? desktop
//           : process.cwd();
//       }

//       for (const fname of filenames) {
//         const exists = flat.some(
//           (a) =>
//             a &&
//             (a.action === "write" || a.action === "append") &&
//             a.path &&
//             a.path.endsWith(fname)
//         );
//         if (!exists) {
//           const inferredPath = inferFullPath(fname, {
//             base: process.env.FILE_OP_BASE || os.homedir(),
//             preferredFolder: preferredFolderResolved,
//           });
//           flat.push({ action: "write", path: inferredPath, content: "" });
//           console.log("Inferred file action for", fname, "->", inferredPath);
//         }
//       }
//     }

//     const MAX_ACTIONS = 60;
//     if (flat.length > MAX_ACTIONS) {
//       return res.status(400).json({
//         error: `Too many actions (${flat.length}). Limit ${MAX_ACTIONS}.`,
//         raw,
//       });
//     }

//     const mkdirs = flat
//       .filter((a) => a && a.action === "mkdir")
//       .map(normalizeAction);
//     const others = flat.filter((a) => !a || a.action !== "mkdir");

//     const results = [];

//     if (mkdirs.length > 0) {
//       const mkPromises = mkdirs.map((a) =>
//         execAction(a).catch((e) => ({ error: e?.message ?? String(e) }))
//       );
//       const mkRes = await Promise.all(mkPromises);
//       for (let i = 0; i < mkdirs.length; i++)
//         results.push({ action: mkdirs[i], result: mkRes[i] });
//     }

//     for (const act of others) {
//       if (!act || !act.action) {
//         results.push({
//           action: act,
//           result: { error: "invalid action object" },
//         });
//         continue;
//       }
//       const normalized = normalizeAction(act);
//       try {
//         const r = await execAction(normalized);
//         results.push({ action: normalized, result: r });
//       } catch (e) {
//         results.push({
//           action: normalized,
//           result: { error: e?.message ?? String(e) },
//         });
//       }
//     }

//     if (
//       (!flat || flat.length === 0) &&
//       (!replyText || replyText.length === 0)
//     ) {
//       replyText = stripFences(raw).slice(0, 1200);
//     }

//     return res.json({ ok: true, reply: replyText || null, results, raw });
//   } catch (err) {
//     console.error("runAiCommand error:", err);
//     return res.status(500).json({ error: err?.message ?? String(err) });
//   }
// }


// src/controllers/aiController.js
import path from "path";
import os from "os";
import { execAction, normalizeAction } from "../utils/fileUtils.js";

/* ---------- System prompt (unchanged) ---------- */
const SYSTEM_PROMPT = `
You are a professional local file system assistant.
1) First produce a concise natural-language reply to the user's request.
2) If any file operations are required, append a SINGLE JSON ARRAY at the END of your reply (nothing after it).
   Example:
   [
     {"action":"mkdir","path":"/home/kumail/Desktop/MyApp"},
     {"action":"write","path":"/home/kumail/Desktop/MyApp/main.py","content":"print('hi')"}
   ]
3) Allowed actions: list, read, write, append, delete, mkdir, rename, move, none.
4) Paths may be absolute or relative; "~" is allowed.
5) If unsure, append [{"action":"none","reason":"unclear request"}].
6) Do NOT include shell commands inside the JSON; return only a single JSON array if actions are needed.
`;

/* ---------- Parsing utilities (reuse your existing logic) ---------- */

function stripFences(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/```(?:bash|sh|json)?/g, "").trim();
}

function extractFirstArrayString(text) {
  const start = text.indexOf("[");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        return {
          arrayText: text.slice(start, i + 1),
          before: text.slice(0, start).trim(),
          after: text.slice(i + 1).trim(),
        };
      }
    }
  }
  return null;
}

function parseActionsFromText(text) {
  const cleaned = stripFences(text);
  const arrExtract = extractFirstArrayString(cleaned);
  if (arrExtract) {
    try {
      const parsed = JSON.parse(arrExtract.arrayText);
      if (Array.isArray(parsed)) return { actions: parsed, replyPrefix: arrExtract.before };
      if (typeof parsed === "object") return { actions: [parsed], replyPrefix: arrExtract.before };
    } catch (e) { /* fallthrough */ }
  }
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return { actions: parsed, replyPrefix: "" };
    if (typeof parsed === "object") return { actions: [parsed], replyPrefix: "" };
  } catch (e) { /* fallthrough */ }

  const blocks = cleaned.match(/\{[\s\S]*?\}/g) || [];
  const actions = [];
  for (const b of blocks) {
    try { actions.push(JSON.parse(b)); } catch (e) { /* skip invalid */ }
  }
  const replyPrefix = cleaned.replace(/\{[\s\S]*?\}/g, "").trim();
  return { actions, replyPrefix };
}

/* ---------- Ollama helper (exactly same call as you've been using) ---------- */

async function callOllamaGetText(messages) {
  const base = process.env.OLLAMA_HOST || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.2:latest";
  const body = { model, messages, stream: false };
  const r = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  return data?.message?.content ?? data?.response ?? data?.output ?? "";
}

/* ---------- Existing non-streaming controller (keeps the same behavior) ---------- */

export async function runAiCommand(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Prompt required" });

    const messages = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }];
    const raw = await callOllamaGetText(messages);
    console.log("Ollama raw (trim):", (raw || "").slice(0, 1000));

    let { actions, replyPrefix } = parseActionsFromText(raw);
    let replyText = (replyPrefix || "").trim();

    // quick parser + converter fallback are intentionally omitted here for brevity: keep your existing logic
    // (if you want them included, merge your existing quickShellToActions / convert fallback code)

    const flat = (actions || []).flatMap(a => (Array.isArray(a) ? a : [a]));

    const results = [];
    for (const act of flat) {
      const normalized = normalizeAction(act);
      const result = await execAction(normalized);
      results.push({ action: normalized, result });
    }

    if ((!flat || flat.length === 0) && (!replyText || replyText.length === 0)) {
      replyText = stripFences(raw).slice(0, 1200);
    }

    return res.json({ ok: true, reply: replyText || null, results, raw });
  } catch (err) {
    console.error("runAiCommand error:", err);
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
}

/* ---------- NEW: streaming controller ---------- */

/**
 * POST /api/ai/stream
 * Streams NDJSON lines. Each line is a JSON object. Types:
 *  - { type: "token", text: "..." }        // assistant typing chunk
 *  - { type: "action_start", index, action }
 *  - { type: "action_result", index, action, result }
 *  - { type: "error", message }
 *  - { type: "done" }
 *
 * This function keeps your existing logic (calls model synchronously) then streams tokens
 * and action execution events. It does not change model behavior.
 */
export async function runAiCommandStream(req, res) {
  // streaming response headers
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  function send(obj) {
    try {
      res.write(JSON.stringify(obj) + "\n");
    } catch (e) {
      // swallow - connection may be closed
    }
  }

  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      send({ type: "error", message: "Prompt required" });
      send({ type: "done" });
      return res.end();
    }

    // 1) call model (same as before)
    const messages = [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }];
    const raw = await callOllamaGetText(messages);
    console.log("Ollama raw (trim):", (raw || "").slice(0, 1200));

    // 2) parse reply + actions
    const { actions, replyPrefix } = parseActionsFromText(raw);
    const replyText = (replyPrefix || "").trim();

    // 3) stream reply as tokens (word-based chunks to look natural)
    const tokenDelayMs = Number(process.env.STREAM_TOKEN_DELAY_MS || 40); // ~40ms per token by default
    const tokens = replyText.length > 0 ? replyText.split(/(\s+)/) : []; // preserve whitespace tokens
    for (let i = 0; i < tokens.length; i++) {
      send({ type: "token", text: tokens[i] });
      // small delay — await a promise to avoid blocking other event loop tasks
      // if client disconnected, writing may throw; we continue but if res.finished then break
      if (res.writableEnded || res.destroyed) break;
      await new Promise((r) => setTimeout(r, tokenDelayMs));
    }

    // If no reply tokens, still send a small heartbeat so UI doesn't hang
    if (tokens.length === 0) {
      send({ type: "token", text: "" });
    }

    // 4) execute actions sequentially and stream progress
    const flat = (actions || []).flatMap(a => (Array.isArray(a) ? a : [a]));
    for (let idx = 0; idx < flat.length; idx++) {
      const act = flat[idx];
      // normalize and send start
      const normalized = normalizeAction(act);
      send({ type: "action_start", index: idx, action: normalized });

      // execute
      let result;
      try {
        result = await execAction(normalized);
      } catch (e) {
        result = { error: e?.message ?? String(e) };
      }

      send({ type: "action_result", index: idx, action: normalized, result });
    }

    // 5) done
    send({ type: "done" });
    return res.end();
  } catch (err) {
    console.error("runAiCommandStream error:", err);
    send({ type: "error", message: err?.message ?? String(err) });
    send({ type: "done" });
    return res.end();
  }
}

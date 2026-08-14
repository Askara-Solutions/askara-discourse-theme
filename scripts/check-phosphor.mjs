#!/usr/bin/env node
// Phosphor governance guard.
//
// Brand rule (brand.css `--green-hover`): phosphor green #8dff35 is for hover / focus
// states, primary CTA fills, and the logo mark ONLY — never a broad palette value,
// background, body text, or decorative fill.
//
// This enforces two things:
//   (a) about.json  — phosphor must NOT appear in any color_scheme (Discourse applies
//       palette values site-wide as accent/link/border, which violates the rule).
//   (b) *.scss      — phosphor may only be used inside a hover/focus/CTA/logo selector
//       context. Detects the hex (#8dff35), the rgb triple (141, 255, 53), and the
//       $phosphor variable; the top-level `$phosphor:` declaration is exempt.
//
// Run: node scripts/check-phosphor.mjs

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const HEX = /#?8dff35\b/i;
const RGB = /\b141\s*,\s*255\s*,\s*53\b/;
const VAR = /\$phosphor\b/;

// Selector contexts where phosphor is allowed (any level of the nesting stack matching is enough).
const ALLOWED =
  /(:hover|:focus|:focus-visible|:focus-within|:active|\.btn-primary|\.btn-cta|\bcta\b|\[type=["']?submit|\blogo\b)/i;

const failures = [];

// (a) about.json — no phosphor in the palettes.
try {
  if (HEX.test(readFileSync("about.json", "utf8"))) {
    failures.push(
      "about.json: phosphor #8dff35 must not appear in color_schemes — it propagates site-wide. Keep it in SCSS hover/CTA/logo rules.",
    );
  }
} catch {
  /* no about.json — nothing to check */
}

// (b) SCSS — phosphor only inside an allowed selector context.
function scssFiles(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".git") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out = out.concat(scssFiles(p));
    else if (name.endsWith(".scss")) out.push(p);
  }
  return out;
}

const isPhosphorValue = (stmt) =>
  !/^\s*\$phosphor\s*:/.test(stmt) &&
  (HEX.test(stmt) || RGB.test(stmt) || VAR.test(stmt));

for (const file of scssFiles(".")) {
  const css = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .replace(/\/\/.*$/gm, ""); // line comments
  const stack = [];
  let buf = "";
  for (const ch of css) {
    if (ch === "{") {
      stack.push(buf.trim().replace(/\s+/g, " "));
      buf = "";
    } else if (ch === "}") {
      stack.pop();
      buf = "";
    } else if (ch === ";") {
      const stmt = buf.trim();
      buf = "";
      if (
        stack.length &&
        isPhosphorValue(stmt) &&
        !stack.some((sel) => ALLOWED.test(sel))
      ) {
        failures.push(
          `${file}: phosphor on non-governed selector "${stack[stack.length - 1]}" (\`${stmt}\`) — allowed only on hover/focus/CTA/logo.`,
        );
      }
    } else {
      buf += ch;
    }
  }
}

if (failures.length) {
  console.error("Phosphor governance FAILED:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(
  "Phosphor governance OK: #8dff35 confined to hover/focus/CTA/logo, and absent from palettes.",
);

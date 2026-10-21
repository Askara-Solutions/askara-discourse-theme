// Parsing for the project panel (BDEV-516). Pure functions with no Discourse or DOM imports, so
// they run under `node --test` (scripts/project-status.test.mjs) as well as in the theme bundle.
//
// The panel reads labelled lines from the first post of a status topic, one per line:
//
//   Phase: ...        Now: ...        Next handover: ...      Next sync: ...
//   Drive: <url>      Calendar: <url> Updated: YYYY-MM-DD
//
// Whoever maintains the post edits it in the normal composer, so the parser tolerates the markup a
// composer produces: `**Label:**` or `**Label**:` bold, a leading list marker, CRLF line ends and
// trailing spaces. A missing or malformed line is left out of the result, which hides that row; it
// never throws. This module carries no project names, links or ids — all of that stays in Discourse.

// A Map, not object literals: a line labelled `Constructor:` must not resolve to an inherited
// Object member. label (lowercase) -> [result key, kind of value]
const FIELDS = new Map([
  ["phase", ["phase", "text"]],
  ["now", ["now", "text"]],
  ["next handover", ["nextHandover", "text"]],
  ["next sync", ["nextSync", "text"]],
  ["drive", ["drive", "link"]],
  ["calendar", ["calendar", "link"]],
  ["updated", ["updated", "date"]],
]);

// optional list marker, optional bold, label, optional bold, colon, optional bold, value
const LINE =
  /^\s*(?:[-*+]\s+)?(?:\*\*|__)?([A-Za-z][A-Za-z ]*?)\s*(?:\*\*|__)?\s*:\s*(?:\*\*|__)?\s*(.*?)\s*$/;

// Accepts a bare URL, `<url>` or `[text](url)`. Returns the normalised href for an https URL and
// null for anything else, which also keeps `javascript:`, `data:` and relative values out of an href.
function httpsHref(value) {
  const candidate = (
    value.match(/^\[[^\]]*\]\(\s*<?([^)\s>]+)>?\s*\)$/)?.[1] ??
    value.match(/^<([^>\s]+)>$/)?.[1] ??
    value
  ).trim();
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// Strict YYYY-MM-DD that is also a real calendar date (rejects 2026-02-31).
function isoDate(value) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
  return real ? value : null;
}

// Returns an object holding only the rows that are present and well formed:
// { phase, now, nextHandover, nextSync, drive, calendar, updated }. The first line carrying a label
// wins, so a stray duplicate further down the post can't override the real one.
export function parseStatusPost(raw) {
  const result = {};
  if (typeof raw !== "string") {
    return result;
  }

  const seen = new Set();
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(LINE);
    if (!match) {
      continue;
    }
    const label = match[1].toLowerCase().replace(/\s+/g, " ");
    const value = match[2];

    const field = FIELDS.get(label);
    if (!field || seen.has(label)) {
      continue;
    }
    seen.add(label);

    const [key, kind] = field;
    let parsed = null;
    if (kind === "text") {
      parsed = value || null;
    } else if (kind === "link") {
      parsed = httpsHref(value);
    } else {
      parsed = isoDate(value);
    }
    if (parsed) {
      result[key] = parsed;
    }
  }
  return result;
}

function positiveInteger(value) {
  const number = typeof value === "string" ? Number(value.trim()) : value;
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

// Parses the `project_panel_topics` theme setting: a JSON object of category id -> status topic id.
// Returns a Map<number, number>. Empty, unparseable or wrongly shaped input gives an empty map, and
// an entry with a non-numeric id on either side is dropped, so one bad entry can't hide the others.
export function parsePanelMap(settingRaw) {
  const map = new Map();
  let parsed;
  try {
    parsed = JSON.parse(settingRaw);
  } catch {
    return map;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return map;
  }
  for (const [categoryId, topicId] of Object.entries(parsed)) {
    const category = positiveInteger(categoryId);
    const topic = positiveInteger(topicId);
    if (category && topic) {
      map.set(category, topic);
    }
  }
  return map;
}

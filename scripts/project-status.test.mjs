// Tests for the project panel's parser (BDEV-516). Run with:
//   node --experimental-detect-module --test scripts/project-status.test.mjs
// The flag lets Node 20 load the theme's ESM-syntax `.js` module without a package.json; newer Node
// versions detect the syntax on their own and ignore it. Fixtures use placeholder values only.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parsePanelMap,
  parseStatusPost,
} from "../javascripts/discourse/lib/project-status.js";

const WELL_FORMED = [
  "Phase: Phase 1 · Graph modelling",
  "Now: Inputs in progress · Shaping in progress",
  "Next handover: H0 · 2 Nov",
  "Next sync: Mon 2 Nov, 12:00",
  "Drive: <https://drive.example.com/shared>",
  "Calendar: <https://calendar.example.com/sync>",
  "Updated: 2026-11-02",
].join("\n");

const FULL = {
  phase: "Phase 1 · Graph modelling",
  now: "Inputs in progress · Shaping in progress",
  nextHandover: "H0 · 2 Nov",
  nextSync: "Mon 2 Nov, 12:00",
  drive: "https://drive.example.com/shared",
  calendar: "https://calendar.example.com/sync",
  updated: "2026-11-02",
};

test("parses a well-formed post", () => {
  assert.deepEqual(parseStatusPost(WELL_FORMED), FULL);
});

test("labels are case-insensitive and tolerate extra spacing", () => {
  const raw = "PHASE :  Build \nnext   HANDOVER: H1\nupdated: 2026-11-02";
  assert.deepEqual(parseStatusPost(raw), {
    phase: "Build",
    nextHandover: "H1",
    updated: "2026-11-02",
  });
});

test("tolerates bold labels in both composer forms", () => {
  const raw = "**Phase:** Build\n**Now**: Ship\n__Next sync:__ Mon";
  assert.deepEqual(parseStatusPost(raw), {
    phase: "Build",
    now: "Ship",
    nextSync: "Mon",
  });
});

test("tolerates leading list markers", () => {
  const raw = "- Phase: Build\n* Now: Ship\n+ **Updated:** 2026-11-02";
  assert.deepEqual(parseStatusPost(raw), {
    phase: "Build",
    now: "Ship",
    updated: "2026-11-02",
  });
});

test("tolerates CRLF line ends and trailing spaces", () => {
  const raw = "Phase: Build  \r\nNow: Ship \r\nUpdated: 2026-11-02\r\n";
  assert.deepEqual(parseStatusPost(raw), {
    phase: "Build",
    now: "Ship",
    updated: "2026-11-02",
  });
});

test("accepts bare, angle-bracket and markdown link forms", () => {
  const forms = [
    "https://drive.example.com/a",
    "<https://drive.example.com/a>",
    "[Shared Drive](https://drive.example.com/a)",
    "[Shared Drive](<https://drive.example.com/a>)",
  ];
  for (const form of forms) {
    assert.equal(
      parseStatusPost(`Drive: ${form}`).drive,
      "https://drive.example.com/a",
      form,
    );
  }
});

test("a missing line is left out and the rest still parse", () => {
  const raw = WELL_FORMED.split("\n")
    .filter((line) => !line.startsWith("Next sync"))
    .join("\n");
  const { nextSync, ...rest } = FULL;
  assert.equal(nextSync, "Mon 2 Nov, 12:00");
  assert.deepEqual(parseStatusPost(raw), rest);
});

test("an empty value hides that row", () => {
  assert.deepEqual(parseStatusPost("Phase:\nNow: Ship\nNext sync:   "), {
    now: "Ship",
  });
});

test("rejects links that are not https", () => {
  const bad = [
    "javascript:alert(1)",
    "<javascript:alert(1)>",
    "[x](javascript:alert(1))",
    "data:text/html,hi",
    "http://drive.example.com/a",
    "ftp://drive.example.com/a",
    "//drive.example.com/a",
    "/relative/path",
    "<Shared Drive URL>",
    "drive.example.com/a",
  ];
  for (const value of bad) {
    assert.deepEqual(parseStatusPost(`Drive: ${value}`), {}, value);
    assert.deepEqual(parseStatusPost(`Calendar: ${value}`), {}, value);
  }
});

test("rejects an Updated value that is not a real YYYY-MM-DD date", () => {
  const bad = [
    "2nd November",
    "02-11-2026",
    "2026-1-2",
    "2026-13-01",
    "2026-02-31",
    "2026-11-02T10:00",
    "",
  ];
  for (const value of bad) {
    assert.deepEqual(parseStatusPost(`Updated: ${value}`), {}, value);
  }
  assert.equal(parseStatusPost("Updated: 2028-02-29").updated, "2028-02-29");
});

test("the first line carrying a label wins", () => {
  const raw = "Phase: Real\nNow: Ship\nPhase: Stray";
  assert.deepEqual(parseStatusPost(raw), { phase: "Real", now: "Ship" });
});

test("a label seen first with a bad value is not replaced by a later line", () => {
  assert.deepEqual(parseStatusPost("Updated: soon\nUpdated: 2026-11-02"), {});
});

test("ignores unknown labels and prose", () => {
  const raw =
    "Owner: Someone\n\nSome prose: with a colon\n# Heading\nPhase: Build";
  assert.deepEqual(parseStatusPost(raw), { phase: "Build" });
});

test("labels named like inherited Object members are ignored", () => {
  const raw = [
    "Constructor: x",
    "toString: y",
    "valueOf: z",
    "__proto__: w",
    "hasOwnProperty: v",
  ].join("\n");
  assert.deepEqual(parseStatusPost(raw), {});
  assert.deepEqual(parseStatusPost(`Constructor: x\nPhase: Build`), {
    phase: "Build",
  });
});

test("values keep colons after the first one", () => {
  assert.deepEqual(parseStatusPost("Next sync: Mon 2 Nov, 12:00"), {
    nextSync: "Mon 2 Nov, 12:00",
  });
});

test("non-string input gives an empty result", () => {
  for (const value of [undefined, null, 42, {}, []]) {
    assert.deepEqual(parseStatusPost(value), {});
  }
  assert.deepEqual(parseStatusPost(""), {});
});

test("parsePanelMap maps category id to topic id", () => {
  const map = parsePanelMap('{"12": 345, "7": "89"}');
  assert.equal(map.get(12), 345);
  assert.equal(map.get(7), 89);
  assert.equal(map.size, 2);
});

test("parsePanelMap falls back to an empty map", () => {
  const bad = ["", "{}", "not json", "null", "[]", "[1, 2]", "42", '"text"'];
  for (const value of bad) {
    assert.equal(parsePanelMap(value).size, 0, value);
  }
  assert.equal(parsePanelMap(undefined).size, 0);
});

test("parsePanelMap drops bad entries and keeps the good ones", () => {
  const map = parsePanelMap(
    '{"12": 345, "abc": 1, "5": "x", "0": 9, "6": -2, "8": 1.5, "9": null}',
  );
  assert.deepEqual([...map], [[12, 345]]);
});

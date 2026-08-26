// Askara-team identity marks (BDEV-362).
//
// Show the Askara logo beside a team member's name — ALONGSIDE the native staff shield,
// never replacing it — and pill their username and any @mention of them. Full design
// (Path B) and rationale live in askara-community `configuration/askara-team-identity.yaml`.
// It's client-side because Communiteq Starter runs no server plugin, and the post payload
// carries only the single flair group (so "is this poster on the team" has no server signal).
//
// The native flair is preserved structurally: we never set the group's flair or make it a
// primary/flair group. We only ADD our own class-driven marks.

import { apiInitializer } from "discourse/lib/api";
import {
  isAskaraTeamMember,
  refreshAskaraTeamMembers,
} from "../lib/askara-team-members";

export default apiInitializer((api) => {
  // TEMP diagnostic (BDEV-362) — remove before merge
  // eslint-disable-next-line no-console
  console.log(
    "[askara-team] init; settings?",
    typeof settings,
    "enabled?",
    typeof settings !== "undefined" ? settings.askara_team_marks_enabled : "N/A"
  );
  if (!settings.askara_team_marks_enabled) {
    return;
  }

  // Warm the roster cache for subsequent renders. Fire-and-forget: the render hooks read
  // the synchronously-hydrated Set, so a cold first load simply lags by one navigation.
  refreshAskaraTeamMembers(settings.askara_team_group_name);

  // Surfaces 1 + 2 — add classes to the poster-name <span> for team members. One transformer
  // drives both the logo badge (::before image) and the username pill, gated independently in
  // SCSS. `context` carries the poster's `user`, so membership is decided per post.
  if (
    settings.askara_team_show_flair ||
    settings.askara_team_show_username_pill
  ) {
    api.registerValueTransformer("poster-name-class", ({ value, context }) => {
      const username = context?.user?.username;
      if (isAskaraTeamMember(username)) {
        value.push("askara-team");
        if (settings.askara_team_show_flair) {
          value.push("askara-team--flair");
        }
        if (settings.askara_team_show_username_pill) {
          value.push("askara-team--pill");
        }
      }
      return value;
    });
  }

  // Surface 3 — pill @mentions of team members. Mentions render as a.mention[href="/u/<name>"];
  // the username isn't in any group data, so match the href against the same Set.
  if (settings.askara_team_show_mention_pill) {
    api.decorateCookedElement((element) => {
      element.querySelectorAll("a.mention[href*='/u/']").forEach((anchor) => {
        const href = anchor.getAttribute("href") || "";
        const raw = href.split("/u/")[1];
        if (!raw) {
          return;
        }
        const username = decodeURIComponent(raw.split(/[/?#]/)[0]);
        if (isAskaraTeamMember(username)) {
          anchor.classList.add("askara-team-mention");
        }
      });
    });
  }
});

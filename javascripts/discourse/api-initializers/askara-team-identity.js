// Askara-team identity marks (BDEV-362; staff-color panel added BDEV-363).
//
// Show the Askara logo beside a team member's name — ALONGSIDE the native staff shield,
// never replacing it — and pill their username and any @mention of them. Full design
// (Path B) and rationale live in askara-community `configuration/askara-team-identity.yaml`.
// It's client-side because Communiteq Starter runs no server plugin, and the post payload
// carries only the single flair group (so "is this poster on the team" has no server signal).
//
// The native flair is preserved structurally: we never set the group's flair or make it a
// primary/flair group. We only ADD our own class-driven marks.
//
// Surface 4 (BDEV-363): auto-apply the "staff color" post panel to askara-team authors, so their
// posts get the same brand highlight as core's manual Add-Staff-Color toggle without anyone having
// to click it per post. Same roster source; the panel treatment lives in common.scss.

import { apiInitializer } from "discourse/lib/api";
import {
  isAskaraTeamMember,
  refreshAskaraTeamMembers,
} from "../lib/askara-team-members";

export default apiInitializer((api) => {
  if (!settings.askara_team_marks_enabled) {
    return;
  }

  // Warm the roster cache for subsequent renders. Fire-and-forget: the render hooks read
  // the synchronously-hydrated Set, so a cold first load simply lags by one navigation.
  refreshAskaraTeamMembers(settings.askara_team_group_name);

  // Surfaces 1 + 2 — add classes to the poster-name <span> for team members. One transformer
  // drives both the Askara mark (a ::after image) and the username pill, gated independently in
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
    api.decorateCookedElement(
      (element) => {
        element.querySelectorAll("a.mention[href*='/u/']").forEach((anchor) => {
          const href = anchor.getAttribute("href") || "";
          const raw = href.split("/u/")[1];
          if (!raw) {
            return;
          }
          // decodeURIComponent throws on a malformed % sequence — never let that break the
          // cooked render (a real username never needs decoding, but the href is untrusted).
          let username;
          try {
            username = decodeURIComponent(raw.split(/[/?#]/)[0]);
          } catch {
            return;
          }
          if (isAskaraTeamMember(username)) {
            anchor.classList.add("askara-team-mention");
          }
        });
      },
      { id: "askara-team-mentions" },
    );
  }

  // Surface 4 (BDEV-363) — auto-apply the staff-color panel to team-authored posts. The decorated
  // element is the post's `.cooked`; the helper exposes the post model (absent when decorating
  // non-post cooked content, e.g. previews or user bios — guarded). Tag it so common.scss paints
  // the same panel as core's manual `.moderator .regular > .cooked` toggle.
  if (settings.askara_team_auto_staff_color) {
    api.decorateCookedElement(
      (element, helper) => {
        const username = helper?.getModel?.()?.username;
        if (isAskaraTeamMember(username)) {
          element.classList.add("askara-team-post");
        }
      },
      { id: "askara-team-staff-color" },
    );
  }
});

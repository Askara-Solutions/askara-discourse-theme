// Client-side membership source for the Askara-team identity marks (BDEV-362).
//
// The post payload carries a user's SINGLE flair group only, never the full group list,
// so the marks can't learn "is this poster on the team" from server data. We fetch the
// askara-team roster once (the group is public — BDEV-361) and expose a synchronous
// membership test the render hooks can call.
//
// Staleness is accepted by design (BDEV-360): a membership change isn't reflected until
// the cache refreshes. Fine for a small, slow-changing internal team.

const CACHE_KEY = "askara_team_members_v1";
const TTL_MS = 60 * 60 * 1000; // 1 hour

// In-memory Set, hydrated synchronously from localStorage at module load so a warm cache
// is available BEFORE the first post renders. A cold first load lags by one navigation.
let members = new Set();
let cachedAt = 0;

function hydrateFromCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.usernames)) {
      members = new Set(parsed.usernames);
      cachedAt = parsed.at || 0;
    }
  } catch {
    // localStorage blocked or corrupt JSON — start empty; a refresh repopulates it.
  }
}
hydrateFromCache();

export function isAskaraTeamMember(username) {
  return !!username && members.has(username.toLowerCase());
}

// Fetch the roster and update the cache. Fail-soft: on any error keep whatever Set we
// have (possibly empty) and never throw into the render path — the native flair still
// shows and the page never breaks.
export async function refreshAskaraTeamMembers(groupName) {
  const name = (groupName || "askara-team").trim();

  // Skip the network if the cache is still fresh.
  if (cachedAt && members.size && Date.now() - cachedAt < TTL_MS) {
    return;
  }

  // TEMP diagnostic (BDEV-362) — remove before merge
  // eslint-disable-next-line no-console
  console.log("[askara-team] refresh start; group=", name);
  try {
    const usernames = [];
    const limit = 100;
    let offset = 0;

    // Paginate defensively. A five-person team is one page, but don't cap silently:
    // stop only when a page returns fewer than `limit` members.
    for (;;) {
      const res = await fetch(
        `/groups/${encodeURIComponent(name)}/members.json?limit=${limit}&offset=${offset}`,
        { headers: { Accept: "application/json" } }
      );
      if (!res.ok) {
        return; // e.g. 403 if the roster isn't public — no-op; marks just don't show.
      }
      const data = await res.json();
      const page = (data && data.members) || [];
      page.forEach((m) => {
        if (m && m.username) {
          usernames.push(m.username.toLowerCase());
        }
      });
      if (page.length < limit) {
        break;
      }
      offset += limit;
    }

    members = new Set(usernames);
    cachedAt = Date.now();
    // TEMP diagnostic (BDEV-362) — remove before merge
    // eslint-disable-next-line no-console
    console.log("[askara-team] fetched members:", usernames.length, usernames);
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ usernames, at: cachedAt })
      );
    } catch {
      // Best-effort cache write; membership still works from the in-memory Set.
    }
  } catch {
    // Network error — keep the current Set and try again on the next load.
  }
}

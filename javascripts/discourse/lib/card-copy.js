// Shared card copy (title + subtitle + icon) keyed by tag. Used by both the curated homepage's
// Frameworks cards (components/solution-cards.gjs) and the per-category discovery cards
// (components/category-cards.gjs), so a copy edit for a tag lands in exactly one place.
// `icon` is a FontAwesome name rendered via the {{icon}} (d-icon) helper. Names outside
// Discourse's default SVG sprite (graduation-cap, book-open, lightbulb, bug,
// wand-magic-sparkles, arrow-up-right-dots) are registered in about.json `modifiers.svg_icons`
// so they ship with the theme — keep the two in sync when adding a tag with a non-default icon.
const CARD_COPY = {
  nis2: {
    title: "NIS2",
    subtitle: "Meet NIS2 obligations",
    icon: "shield-halved",
  },
  iso27001: {
    title: "ISO 27001",
    subtitle: "Certify and maintain ISO 27001",
    icon: "certificate",
  },
  "ai-agents": {
    title: "AI Agents",
    subtitle: "Agentic security and compliance",
    icon: "robot",
  },
  tutorial: {
    title: "Tutorials",
    subtitle: "Learn the ground, step by step",
    icon: "graduation-cap",
  },
  "how-to": {
    title: "How-to guides",
    subtitle: "Get a specific task done",
    icon: "list-check",
  },
  reference: {
    title: "Reference",
    subtitle: "Look up the details",
    icon: "book-open",
  },
  explanation: {
    title: "Explanation",
    subtitle: "Understand how and why",
    icon: "lightbulb",
  },
  bug: { title: "Bugs", subtitle: "Report something broken", icon: "bug" },
  "feature-request": {
    title: "Feature requests",
    subtitle: "Ask for something new",
    icon: "wand-magic-sparkles",
  },
  enhancement: {
    title: "Enhancements",
    subtitle: "Improve what's already there",
    icon: "arrow-up-right-dots",
  },
};

// Fallback icon for a tag without curated copy — `tag` is in Discourse's default sprite.
const FALLBACK_ICON = "tag";

function prettify(tag) {
  return tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Title + subtitle + icon for a tag card. Tags without curated copy fall back to a prettified tag
// name, no subtitle, and the default `tag` icon, so a newly added tag always renders something
// sensible rather than a blank card. `Object.hasOwn` (not plain indexing) so a tag literally named
// `constructor`/`toString`/etc. resolves to the fallback rather than an inherited prototype member.
export function cardCopyFor(tag) {
  return Object.hasOwn(CARD_COPY, tag)
    ? CARD_COPY[tag]
    : { title: prettify(tag), subtitle: null, icon: FALLBACK_ICON };
}

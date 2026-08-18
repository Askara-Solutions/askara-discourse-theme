// Shared card copy (title + subtitle) keyed by tag. Used by both the curated homepage's
// Frameworks cards (components/solution-cards.gjs) and the per-category discovery cards
// (components/category-cards.gjs), so a copy edit for a tag lands in exactly one place.
const CARD_COPY = {
  nis2: { title: "NIS2", subtitle: "Meet NIS2 obligations" },
  iso27001: { title: "ISO 27001", subtitle: "Certify and maintain ISO 27001" },
  "ai-agents": { title: "AI Agents", subtitle: "Agentic security and compliance" },
  tutorial: { title: "Tutorials", subtitle: "Learn the ground, step by step" },
  "how-to": { title: "How-to guides", subtitle: "Get a specific task done" },
  reference: { title: "Reference", subtitle: "Look up the details" },
  explanation: { title: "Explanation", subtitle: "Understand how and why" },
  bug: { title: "Bugs", subtitle: "Report something broken" },
  "feature-request": { title: "Feature requests", subtitle: "Ask for something new" },
  enhancement: { title: "Enhancements", subtitle: "Improve what's already there" },
};

function prettify(tag) {
  return tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Title + subtitle for a tag card. Tags without curated copy fall back to a prettified tag name
// and no subtitle, so a newly added tag always renders something sensible rather than a blank card.
export function cardCopyFor(tag) {
  return CARD_COPY[tag] ?? { title: prettify(tag), subtitle: null };
}

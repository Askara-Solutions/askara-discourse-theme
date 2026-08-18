import Component from "@glimmer/component";

// Per-category solution cards (BDEV-250, option ii-b). Renders above a category's topic list —
// one card per tag configured for that category's slug in the `category_cards` theme setting
// (seeded from askara-community structure/taxonomy.yaml's `category_card_mapping`). It is a theme
// SETTING, not `allowed_tags`, so it never restricts tagging — it only decides which cards show.
// Reuses the BDEV-247 `.solution-card` treatment verbatim (brand styling is fixed — never restyle
// here). No category, no mapping, an empty list, or an unparseable setting => nothing renders. The
// curated homepage keeps its own direct <SolutionCards /> embed (the Frameworks set); this
// component only occupies the shared discovery-list outlet, where it must be category-aware.

// Curated copy per tag; unknown tags fall back to a prettified tag name and no subtitle.
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

export default class CategoryCards extends Component {
  get cards() {
    // renderInOutlet has exposed outlet args as `@outletArgs` (current) and as direct args
    // (older) across Discourse versions — read both so a version shift can't silently blank
    // the cards. This component is verified live (deploy + eyeball), not in an offline build.
    const category = this.args.outletArgs?.category ?? this.args.category;
    if (!category?.slug) {
      return [];
    }

    let map;
    try {
      map = JSON.parse(settings.category_cards);
    } catch {
      // A hand-edited setting can be invalid JSON — fail soft to no cards rather than error.
      return [];
    }

    const tags = map?.[category.slug];
    if (!Array.isArray(tags) || tags.length === 0) {
      return [];
    }

    return tags.map((tag) => ({
      tag,
      href: `/tag/${tag}`,
      ...(CARD_COPY[tag] ?? { title: prettify(tag), subtitle: null }),
    }));
  }

  <template>
    {{#if this.cards.length}}
      <section class="solution-cards">
        {{#each this.cards as |card|}}
          <a class="solution-card" href={{card.href}}>
            <h3 class="solution-card__title">{{card.title}}</h3>
            {{#if card.subtitle}}
              <p class="solution-card__subtitle">{{card.subtitle}}</p>
            {{/if}}
          </a>
        {{/each}}
      </section>
    {{/if}}
  </template>
}

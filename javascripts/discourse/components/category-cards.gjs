import Component from "@glimmer/component";
import { cardCopyFor } from "../lib/card-copy";

// Per-category solution cards (BDEV-250, option ii-b). Renders above a category's topic list —
// one card per tag configured for that category's slug in the `category_cards` theme setting
// (seeded from askara-community structure/taxonomy.yaml's `category_card_mapping`). It is a theme
// SETTING, not `allowed_tags`, so it never restricts tagging — it only decides which cards show.
// Reuses the BDEV-247 `.solution-card` treatment verbatim (brand styling is fixed — never restyle
// here) and shares its display copy with the homepage Frameworks cards via lib/card-copy.js. No
// category, no mapping, an empty list, or an unparseable/malformed setting => nothing renders. The
// curated homepage keeps its own direct <SolutionCards /> embed; this component only occupies the
// shared discovery-list outlet, where it must be category-aware.

// The theme setting is static per page load, so parse it once per distinct raw value rather than on
// every getter evaluation. This is also the single place the fail-soft JSON handling lives: an
// invalid or hand-broken setting yields an empty map, never an exception.
let cachedRaw;
let cachedMap;
function categoryCardMap() {
  const raw = settings.category_cards;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedMap = JSON.parse(raw);
    } catch {
      cachedMap = {};
    }
  }
  return cachedMap;
}

export default class CategoryCards extends Component {
  get cards() {
    // renderInOutlet has exposed outlet args as `@outletArgs` (current) and as direct args
    // (older) across Discourse versions — read both so a version shift can't silently blank
    // the cards. This component is verified live (deploy + eyeball), not in an offline build.
    const outletArgs = this.args.outletArgs;
    const category = outletArgs?.category ?? this.args.category;
    if (!category?.slug) {
      return [];
    }

    // This outlet also fires on category-scoped tag routes (`/tags/c/<slug>/<id>/<tag>`) — the very
    // pages these cards link to, with a tag filter active. Don't render the card row there, so a
    // card never points at the page the reader is already on.
    if (outletArgs?.tag ?? this.args.tag) {
      return [];
    }

    // Only treat an actual list of non-empty tag strings as cards. A plain value (a single tag
    // written without brackets), non-strings, or empties would otherwise throw and blank the whole
    // category page instead of failing soft to no cards.
    const configured = categoryCardMap()?.[category.slug];
    const tags = (Array.isArray(configured) ? configured : []).filter(
      (tag) => typeof tag === "string" && tag.length > 0
    );
    if (tags.length === 0) {
      return [];
    }

    return tags.map((tag) => ({
      tag,
      // Scope the link to this category (`/tags/c/<slug>/<id>/<tag>`) so a card keeps the reader in
      // context; encode the operator-controlled tag segment so an odd tag name can't break the URL.
      href: `/tags/c/${category.slug}/${category.id}/${encodeURIComponent(tag)}`,
      ...cardCopyFor(tag),
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

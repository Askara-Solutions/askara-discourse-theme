import Component from "@glimmer/component";
import { CARD_COPY } from "../lib/card-copy";

// Per-category solution cards (BDEV-250, option ii-b). Renders above a category's topic list —
// one card per tag configured for that category's slug in the `category_cards` theme setting
// (seeded from askara-community structure/taxonomy.yaml's `category_card_mapping`). It is a theme
// SETTING, not `allowed_tags`, so it never restricts tagging — it only decides which cards show.
// Reuses the BDEV-247 `.solution-card` treatment verbatim (brand styling is fixed — never restyle
// here) and shares its display copy with the homepage Frameworks cards via lib/card-copy.js. No
// category, no mapping, an empty list, or an unparseable/malformed setting => nothing renders. The
// curated homepage keeps its own direct <SolutionCards /> embed; this component only occupies the
// shared discovery-list outlet, where it must be category-aware.

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

    // Keep only usable tag names: a structurally valid setting can still carry non-strings or
    // empties (e.g. {"general":[1,null]}), which would throw in prettify/href and blank the route
    // instead of failing soft. Filter them out to honour the fail-soft contract above.
    const tags = (map?.[category.slug] ?? []).filter(
      (tag) => typeof tag === "string" && tag.length > 0
    );
    if (tags.length === 0) {
      return [];
    }

    return tags.map((tag) => ({
      tag,
      // Scope the link to this category (`/tags/c/<slug>/<id>/<tag>`) so a card keeps the reader
      // in context rather than jumping to the site-wide tag list.
      href: `/tags/c/${category.slug}/${category.id}/${tag}`,
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

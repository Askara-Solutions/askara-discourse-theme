import Component from "@glimmer/component";
import icon from "discourse/helpers/d-icon";
import { cardCopyFor } from "../lib/card-copy";

// Per-category solution cards (BDEV-250, option ii-b). Above the category nav it renders the
// category title + description, then one card per tag configured for that category's slug in the
// `category_cards` theme setting
// (seeded from askara-community structure/taxonomy.yaml's `category_card_mapping`). It is a theme
// SETTING, not `allowed_tags`, so it never restricts tagging — it only decides which cards show.
// Reuses the BDEV-247 `.solution-card` treatment verbatim (brand styling is fixed — never restyle
// here) and shares its display copy with the homepage Frameworks cards via lib/card-copy.js. A
// mapped category renders the title + description intro even when its tag list is empty (a card-less
// category like General still gets its themed description, BDEV-355); cards render only for the tags
// listed. No category, no mapping, a tag route, or an unparseable/malformed setting => nothing
// renders. The curated homepage keeps its own direct <SolutionCards /> embed; this component only
// occupies the shared discovery-list outlet, where it must be category-aware.

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
  // renderInOutlet has exposed outlet args as `@outletArgs` (current) and as direct args (older)
  // across Discourse versions — read both so a version shift can't silently blank the intro/cards.
  // This component is verified live (deploy + eyeball), not in an offline build.
  get category() {
    return this.args.outletArgs?.category ?? this.args.category ?? null;
  }

  get tag() {
    return this.args.outletArgs?.tag ?? this.args.tag ?? null;
  }

  get cards() {
    const category = this.category;
    if (!category?.slug) {
      return [];
    }

    // This outlet also fires on category-scoped tag routes (`/tags/c/<slug>/<id>/<tag>`) — the very
    // pages these cards link to, with a tag filter active. Don't render the card row there, so a
    // card never points at the page the reader is already on.
    if (this.tag) {
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

  // The intro (title + description) shows for any category that has a mapping ENTRY — including an
  // empty list, so a card-less category (e.g. General) still gets its themed description (BDEV-355).
  // Cards then render only when that entry actually lists tags (`this.cards`). Never on tag routes
  // or for unmapped categories, so an unrelated category page stays untouched.
  get showIntro() {
    const category = this.category;
    if (!category?.slug || this.tag) {
      return false;
    }
    const map = categoryCardMap();
    return !!map && Object.prototype.hasOwnProperty.call(map, category.slug);
  }

  <template>
    {{#if this.showIntro}}
      <div class="category-intro">
        <h2 class="category-intro__title">{{this.category.name}}</h2>
        {{#if this.category.description_text}}
          <p class="category-intro__description">{{this.category.description_text}}</p>
        {{/if}}
      </div>
      {{#if this.cards.length}}
        <section class="solution-cards">
          {{#each this.cards as |card|}}
            <a class="solution-card" href={{card.href}}>
              <span class="solution-card__icon" aria-hidden="true">
                {{icon card.icon}}
              </span>
              <div class="solution-card__text">
                <h3 class="solution-card__title">{{card.title}}</h3>
                {{#if card.subtitle}}
                  <p class="solution-card__subtitle">{{card.subtitle}}</p>
                {{/if}}
              </div>
            </a>
          {{/each}}
        </section>
      {{/if}}
    {{/if}}
  </template>
}

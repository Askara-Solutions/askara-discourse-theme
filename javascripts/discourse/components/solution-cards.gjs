import Component from "@glimmer/component";
import { CARD_COPY } from "../lib/card-copy";

// Frameworks solution cards — tag-sourced entry points into the three founding solution areas.
// Sources the taxonomy tags (nis2 / iso27001 / ai-agents), never the deleted Solutions categories
// 12–15 (BDEV-237). Embedded on the curated homepage (BDEV-236) via askara-homepage.gjs; links are
// site-wide (`/tag/<tag>`) because the homepage has no category context. The per-category
// discovery-list cards are a separate, category-aware component (components/category-cards.gjs,
// BDEV-250); both pull their display copy from lib/card-copy.js so a copy edit lands once.
const FRAMEWORKS = ["nis2", "iso27001", "ai-agents"];

export default class SolutionCards extends Component {
  get cards() {
    return FRAMEWORKS.map((tag) => ({
      tag,
      href: `/tag/${tag}`,
      ...CARD_COPY[tag],
    }));
  }

  <template>
    <section class="solution-cards">
      {{#each this.cards as |card|}}
        <a class="solution-card" href={{card.href}}>
          <h3 class="solution-card__title">{{card.title}}</h3>
          <p class="solution-card__subtitle">{{card.subtitle}}</p>
        </a>
      {{/each}}
    </section>
  </template>
}

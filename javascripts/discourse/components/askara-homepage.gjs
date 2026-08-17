import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { service } from "@ember/service";
import icon from "discourse/helpers/d-icon";
import List from "discourse/components/topic-list/list";
import SolutionCards from "./solution-cards";

// Curated, meta-style landing view for community.askara.solutions (BDEV-236). Rendered into
// the core `custom-homepage` wrapper outlet, which the `custom_homepage` theme modifier
// (about.json) activates in place of the raw /latest list. /latest stays reachable directly.
//
// Every section is gated behind a theme setting so a live operator can disable any one of them
// without a code change. The two topic-list sections fetch via the store and fail soft: on any
// error (or an empty list) they render a "browse" link instead of blanking, so a data hiccup
// can never leave the homepage empty (an empty outlet would show Discourse's admin-only alert).
export default class AskaraHomepage extends Component {
  @service store;
  @service site;

  @tracked recentTopics = null;
  @tracked recentReady = false;
  @tracked featuredTopics = null;
  @tracked featuredReady = false;

  constructor() {
    super(...arguments);
    if (this.showRecentActivity) {
      this.loadRecent();
    }
    if (this.showFeatured) {
      this.loadFeatured();
    }
  }

  // ---- settings (theme-injected `settings` free variable) ----
  get heroHeading() {
    return settings.homepage_hero_heading;
  }
  get heroSubheading() {
    return settings.homepage_hero_subheading;
  }
  get heroCtaLabel() {
    return settings.homepage_hero_cta_label;
  }
  get heroCtaUrl() {
    return settings.homepage_hero_cta_url;
  }
  get showSolutionCards() {
    return settings.homepage_show_solution_cards;
  }
  get showRecentActivity() {
    return settings.homepage_show_recent_activity;
  }
  get showFeatured() {
    return settings.homepage_show_featured;
  }
  get showCategoryBrowse() {
    return settings.homepage_show_category_browse;
  }
  get featuredTag() {
    return settings.homepage_featured_tag;
  }
  get featuredTagUrl() {
    return `/tag/${this.featuredTag}`;
  }

  // Top-level categories only, already loaded on the client (no fetch) — order by the admin's
  // configured position, cap the grid so it stays a browse affordance, not a full directory.
  get browseCategories() {
    return (this.site.categories || [])
      .filter((c) => !c.parent_category_id && !c.isUncategorizedCategory)
      .slice(0, 6);
  }

  async loadRecent() {
    try {
      const list = await this.store.findFiltered("topicList", {
        filter: "latest",
      });
      const count = settings.homepage_recent_activity_count;
      this.recentTopics = (list?.topics || []).slice(0, count);
    } catch {
      this.recentTopics = null;
    } finally {
      this.recentReady = true;
    }
  }

  async loadFeatured() {
    try {
      // Tag-filtered latest via params.tags (the shape Discourse's own homepage-feature
      // component uses) — robust to the tag being empty; never references categories 12–15.
      const list = await this.store.findFiltered("topicList", {
        filter: "latest",
        params: { tags: [this.featuredTag] },
      });
      this.featuredTopics = (list?.topics || []).slice(0, 4);
    } catch {
      this.featuredTopics = null;
    } finally {
      this.featuredReady = true;
    }
  }

  // Core <List> wants a @changeSort handler for its sortable column headers; the homepage list
  // is a fixed snapshot, so sorting is a no-op here (headers stay inert rather than erroring).
  noop = () => {};

  <template>
    <div class="askara-homepage">
      <section class="askara-homepage__hero">
        <h1 class="askara-homepage__hero-heading">{{this.heroHeading}}</h1>
        <p class="askara-homepage__hero-subheading">{{this.heroSubheading}}</p>
        {{#if this.heroCtaLabel}}
          <a
            class="btn btn-primary askara-homepage__hero-cta"
            href={{this.heroCtaUrl}}
          >{{this.heroCtaLabel}}</a>
        {{/if}}
      </section>

      {{#if this.showSolutionCards}}
        <section class="askara-homepage__section">
          <h2 class="askara-homepage__section-title">Explore by solution</h2>
          <SolutionCards />
        </section>
      {{/if}}

      {{#if this.showFeatured}}
        <section class="askara-homepage__section">
          <h2 class="askara-homepage__section-title">Featured</h2>
          {{#if this.featuredTopics.length}}
            <List
              @topics={{this.featuredTopics}}
              @showPosters={{true}}
              @showTopicPostBadges={{true}}
              @highlightLastVisited={{false}}
              @changeSort={{this.noop}}
              @discoveryList={{false}}
              @listContext="homepage"
            />
          {{else if this.featuredReady}}
            <a class="askara-homepage__more" href={{this.featuredTagUrl}}>
              Browse featured topics
              {{icon "arrow-right"}}
            </a>
          {{/if}}
        </section>
      {{/if}}

      {{#if this.showRecentActivity}}
        <section class="askara-homepage__section">
          <h2 class="askara-homepage__section-title">Recent activity</h2>
          {{#if this.recentTopics.length}}
            <List
              @topics={{this.recentTopics}}
              @showPosters={{true}}
              @showTopicPostBadges={{true}}
              @highlightLastVisited={{false}}
              @changeSort={{this.noop}}
              @discoveryList={{false}}
              @listContext="homepage"
            />
          {{/if}}
          <a class="askara-homepage__more" href="/latest">
            View all latest
            {{icon "arrow-right"}}
          </a>
        </section>
      {{/if}}

      {{#if this.showCategoryBrowse}}
        <section class="askara-homepage__section">
          <h2 class="askara-homepage__section-title">Browse categories</h2>
          <div class="askara-homepage__categories">
            {{#each this.browseCategories as |category|}}
              <a class="askara-homepage__category" href={{category.url}}>
                <span
                  class="askara-homepage__category-name"
                >{{category.name}}</span>
                <span class="askara-homepage__category-count">
                  {{category.topic_count}}
                  topics
                </span>
              </a>
            {{/each}}
          </div>
          <a class="askara-homepage__more" href="/categories">
            All categories
            {{icon "arrow-right"}}
          </a>
        </section>
      {{/if}}
    </div>
  </template>
}

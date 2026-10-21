import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import didInsert from "@ember/render-modifiers/modifiers/did-insert";
import didUpdate from "@ember/render-modifiers/modifiers/did-update";
import icon from "discourse/helpers/d-icon";
import { parsePanelMap, parseStatusPost } from "../lib/project-status";

// Project status panel (BDEV-516). On a category mapped in the `project_panel_topics` setting it
// fetches that status topic's first post as the CURRENT user, parses the labelled lines
// (lib/project-status.js) and renders a status strip plus Drive and Calendar buttons.
//
// Access is the topic's own permissions, not a theme check: a member who can't read the topic gets a
// 403/404 from the fetch and sees nothing. The same goes for every other failure (network error,
// deleted topic, no line parses), and for an unmapped category, a tag route or a bad setting. A
// missing or malformed line hides only its own row. This component carries no project names, links
// or ids; all of that lives in the setting and in the post, behind Discourse's permissions.

// The setting is static per page load, so parse it once per distinct raw value.
let cachedRaw;
let cachedMap;
function panelMap() {
  const raw = settings.project_panel_topics;
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedMap = parsePanelMap(raw);
  }
  return cachedMap;
}

const ROWS = [
  ["phase", "Phase"],
  ["now", "Now"],
  ["nextHandover", "Next handover"],
  ["nextSync", "Next sync"],
  ["updated", "Updated"],
];

export default class ProjectPanel extends Component {
  // The outlet component outlives a category change within the list route, so the fetch is driven by
  // the render modifiers below (insert + update on topicId), not by the constructor.
  @tracked fields = null;

  // renderInOutlet has exposed outlet args as `@outletArgs` (current) and as direct args (older)
  // across Discourse versions, so read both. Verified live (deploy + eyeball), not offline.
  get category() {
    return this.args.outletArgs?.category ?? this.args.category ?? null;
  }

  get tag() {
    return this.args.outletArgs?.tag ?? this.args.tag ?? null;
  }

  get topicId() {
    // This outlet also fires on category-scoped tag routes, which are not the project's own page.
    if (this.tag || !this.category?.id) {
      return null;
    }
    return panelMap().get(Number(this.category.id)) ?? null;
  }

  get statusHref() {
    return this.topicId ? `/t/${this.topicId}` : null;
  }

  get rows() {
    const fields = this.fields;
    if (!fields) {
      return [];
    }
    return ROWS.filter(([key]) => fields[key]).map(([key, label]) => ({
      label,
      value: fields[key],
    }));
  }

  get hasContent() {
    return this.rows.length > 0 || !!this.fields?.drive || !!this.fields?.calendar;
  }

  // Fetch the status post. A response for a topic the reader has since navigated away from is
  // dropped, so a slow request can't paint the wrong category's values.
  load = async () => {
    const topicId = this.topicId;
    this.fields = null;
    if (!topicId) {
      return;
    }
    let fields = null;
    try {
      const response = await fetch(`/raw/${topicId}/1`, {
        credentials: "same-origin",
        headers: { Accept: "text/plain" },
      });
      if (response.ok) {
        fields = parseStatusPost(await response.text());
      }
    } catch {
      fields = null;
    }
    if (topicId === this.topicId && !this.isDestroying && !this.isDestroyed) {
      this.fields = fields;
    }
  };

  <template>
    {{#if this.topicId}}
      <span hidden {{didInsert this.load}} {{didUpdate this.load this.topicId}}></span>
    {{/if}}
    {{#if this.hasContent}}
      <section class="project-panel" aria-label={{this.category.name}}>
        <h2 class="project-panel__title">{{this.category.name}}</h2>
        {{#if this.rows.length}}
          <dl class="project-panel__strip">
            {{#each this.rows as |row|}}
              <div class="project-panel__row">
                <dt class="project-panel__label">{{row.label}}</dt>
                <dd class="project-panel__value">{{row.value}}</dd>
              </div>
            {{/each}}
          </dl>
        {{/if}}
        <div class="project-panel__links">
          {{#if this.fields.drive}}
            <a
              class="btn btn-default project-panel__link"
              href={{this.fields.drive}}
              target="_blank"
              rel="noopener noreferrer"
            >
              {{icon "folder-open"}}
              <span class="d-button-label">Drive</span>
            </a>
          {{/if}}
          {{#if this.fields.calendar}}
            <a
              class="btn btn-default project-panel__link"
              href={{this.fields.calendar}}
              target="_blank"
              rel="noopener noreferrer"
            >
              {{icon "calendar-days"}}
              <span class="d-button-label">Calendar</span>
            </a>
          {{/if}}
          <a class="btn btn-default project-panel__link" href={{this.statusHref}}>
            {{icon "list-check"}}
            <span class="d-button-label">Status</span>
          </a>
        </div>
      </section>
    {{/if}}
  </template>
}

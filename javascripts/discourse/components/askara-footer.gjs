import Component from "@glimmer/component";
import { service } from "@ember/service";
import icon from "discourse/helpers/d-icon";

// Community footer (BDEV-320). Ported from the askara-web marketing footer
// (packages/ui/src/components/layout/Footer.tsx) and trimmed to a community-appropriate set:
// brand block + community nav + legal — no marketing product columns, no cookie/analytics bits.
//
// Rendered into the core `main-outlet-bottom` outlet (see api-initializers/footer.gjs), which sits
// INSIDE #main-outlet — the content column, a sibling of the sidebar. So the footer is content-width
// and never spans under the sidebar, structurally avoiding the sidebar-height issue that the
// full-width below-footer/above-footer outlets cause.
//
// Visibility is decided HERE because renderInOutlet is unconditional: homepage-only by default (the
// custom-homepage route, discovery.custom), flipped site-wide by the `footer_site_wide` setting — so
// the Path A -> site-wide promotion is a live setting toggle, not a code change.

// Fixed for the page load (the year only changes at midnight on Dec 31 — a reload covers it), so it
// need not be reactive. Mirrors the askara-web footer's `new Date().getFullYear()`.
const CURRENT_YEAR = new Date().getFullYear();

// Same destinations as the askara-web footer's DEFAULT_SOCIAL_LINKS. Icons are FontAwesome brand
// glyphs, registered in about.json `modifiers.svg_icons` so they ship in the SVG sprite.
const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/askara-solutions",
    icon: "fab-linkedin",
  },
  {
    label: "GitHub",
    href: "https://github.com/Askara-Solutions",
    icon: "fab-github",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@askara.solutions",
    icon: "fab-youtube",
  },
];

export default class AskaraFooter extends Component {
  @service router;
  @service siteSettings;

  socialLinks = SOCIAL_LINKS;
  year = CURRENT_YEAR;

  get visible() {
    if (settings.footer_site_wide) {
      return true;
    }
    return (
      settings.homepage_show_footer &&
      this.router.currentRouteName === "discovery.custom"
    );
  }

  // The brand wordmark is the site logo (a SITE setting, white-on-navy for the header) — reused here
  // rather than bundled as a theme upload, which a git theme update would wipe. Falls back to text.
  get logoUrl() {
    return this.siteSettings.site_logo_url;
  }

  get tagline() {
    return settings.footer_tagline;
  }

  <template>
    {{#if this.visible}}
      <footer class="askara-footer">
        <div class="askara-footer__inner">
          <div class="askara-footer__brand">
            {{#if this.logoUrl}}
              <img
                class="askara-footer__logo"
                src={{this.logoUrl}}
                alt="Askara Solutions"
              />
            {{else}}
              <span class="askara-footer__logo-text">Askara Solutions</span>
            {{/if}}

            {{#if this.tagline}}
              <p class="askara-footer__tagline">{{this.tagline}}</p>
            {{/if}}

            <address class="askara-footer__address">
              Askara Solutions OÜ<br />
              Ahtri 12, Tallinn 15551<br />
              Estonia (Reg. 17233369)<br />
              <a href="mailto:hello@askara.solutions">hello@askara.solutions</a>
            </address>

            <div class="askara-footer__social">
              {{#each this.socialLinks as |social|}}
                <a
                  class="askara-footer__social-link"
                  href={{social.href}}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={{social.label}}
                >
                  {{icon social.icon}}
                </a>
              {{/each}}
            </div>
          </div>

          <nav class="askara-footer__col" aria-label="Community">
            <h2 class="askara-footer__col-title">Community</h2>
            <ul class="askara-footer__links">
              <li><a href="/">Home</a></li>
              <li><a href="/categories">Categories</a></li>
              <li><a href="/guidelines">Guidelines</a></li>
            </ul>
          </nav>

          <nav class="askara-footer__col" aria-label="Legal">
            <h2 class="askara-footer__col-title">Legal</h2>
            <ul class="askara-footer__links">
              <li><a href="/tos">Terms of Use</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
            </ul>
          </nav>
        </div>

        <div class="askara-footer__bar">
          <p class="askara-footer__copyright">
            &copy;
            {{this.year}}
            Askara Solutions OÜ
          </p>
          {{! Reinstates Discourse's "Powered by Discourse" (its native full-width strip is hidden in
              common.scss) inside the copyright bar — same link + logo, right-aligned. }}
          <a
            class="askara-footer__powered"
            href="https://discourse.org/powered-by"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{icon "fab-discourse"}}
            <span>Powered by Discourse</span>
          </a>
        </div>
      </footer>
    {{/if}}
  </template>
}

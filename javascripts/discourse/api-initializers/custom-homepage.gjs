import { apiInitializer } from "discourse/lib/api";
import AskaraHomepage from "../components/askara-homepage";

// Wire the curated landing view into the core `custom-homepage` wrapper outlet (BDEV-236).
// Activation itself is the `custom_homepage` theme modifier in about.json, which enables the
// discovery.custom route so `/` renders this instead of the raw /latest list.
export default apiInitializer((api) => {
  api.renderInOutlet("custom-homepage", AskaraHomepage);

  // A literal "Home" affordance pinned to the TOP of the sidebar. top_menu can't provide a
  // labelled Home item, and the site logo is the only stock route to `/`. Registered as its own
  // header-less custom section (not a Community link, which sits mid-list) and forced above the
  // default sections via `order: -1` in common.scss — there is no sidebar ordering API. Wrapped
  // defensively so an API shift in the sidebar helper can never take the homepage render down.
  try {
    api.addSidebarSection(
      (BaseCustomSidebarSection, BaseCustomSidebarSectionLink) =>
        class AskaraHomeSection extends BaseCustomSidebarSection {
          get name() {
            return "askara-home";
          }
          get text() {
            return "Home";
          }
          get hideSectionHeader() {
            return true;
          }
          get links() {
            return [
              new (class extends BaseCustomSidebarSectionLink {
                get name() {
                  return "askara-home-link";
                }
                get title() {
                  return "Community home";
                }
                get text() {
                  return "Home";
                }
                get href() {
                  return "/";
                }
                get prefixType() {
                  return "icon";
                }
                get prefixValue() {
                  return "house";
                }
              })(),
            ];
          }
        },
    );
  } catch {
    // Sidebar link is a nice-to-have; the curated homepage is the deliverable.
  }
});

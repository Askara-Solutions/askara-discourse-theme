import { apiInitializer } from "discourse/lib/api";
import AskaraHomepage from "../components/askara-homepage";

// Wire the curated landing view into the core `custom-homepage` wrapper outlet (BDEV-236).
// Activation itself is the `custom_homepage` theme modifier in about.json, which enables the
// discovery.custom route so `/` renders this instead of the raw /latest list.
export default apiInitializer((api) => {
  api.renderInOutlet("custom-homepage", AskaraHomepage);

  // A literal "Home" affordance in the sidebar — top_menu can't provide a labelled Home item,
  // and the site logo is the only stock route to `/`. Wrapped defensively so an API shift in the
  // sidebar helper can never take the homepage render down with it.
  try {
    api.addCommunitySectionLink({
      name: "askara-home",
      text: "Home",
      title: "Community home",
      icon: "house",
      href: "/",
    });
  } catch {
    // Sidebar link is a nice-to-have; the curated homepage is the deliverable.
  }
});

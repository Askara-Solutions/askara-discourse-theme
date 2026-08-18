import { apiInitializer } from "discourse/lib/api";
import CategoryCards from "../components/category-cards";

// Render per-category solution cards above the category navigation bar (BDEV-250, option ii-b),
// so a category page reads title -> description -> cards -> nav -> topic list. `discovery-list-
// controls-above` sits above the `.list-controls` block (the Latest/New/Top nav) in Discourse core
// `discovery/layout.gjs` and exposes {category, tag} — the same outletArgs the component reads.
// It fires on every stock list route, so the component is category-aware: it shows only the current
// category's configured cards, nothing elsewhere. The curated homepage (BDEV-236) is a separate
// route that embeds the Frameworks <SolutionCards /> set directly, so it is unaffected.
export default apiInitializer((api) => {
  api.renderInOutlet("discovery-list-controls-above", CategoryCards);
});

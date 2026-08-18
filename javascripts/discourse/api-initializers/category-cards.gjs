import { apiInitializer } from "discourse/lib/api";
import CategoryCards from "../components/category-cards";

// Render per-category solution cards above the discovery topic list (BDEV-250, option ii-b).
// This outlet fires on every stock list route (Latest, /categories, each category page), so the
// component is category-aware: it reads @outletArgs.category and shows only that category's
// configured cards, nothing elsewhere. The curated homepage (BDEV-236) is a separate route and
// embeds the Frameworks <SolutionCards /> set directly, so it is unaffected by this swap.
export default apiInitializer((api) => {
  api.renderInOutlet("discovery-list-container-top", CategoryCards);
});

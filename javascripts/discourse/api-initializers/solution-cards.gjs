import { apiInitializer } from "discourse/lib/api";
import SolutionCards from "../components/solution-cards";

// Render the shared solution cards above the discovery topic list (BDEV-237). The same
// component is embedded on the curated homepage (BDEV-236); the discovery-list-container-top
// outlet only exists on the stock list routes, so the homepage embeds it directly.
export default apiInitializer((api) => {
  api.renderInOutlet("discovery-list-container-top", SolutionCards);
});

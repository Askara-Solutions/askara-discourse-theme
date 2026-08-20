import { apiInitializer } from "discourse/lib/api";
import AskaraFooter from "../components/askara-footer";

// Render the community footer (BDEV-320) into `main-outlet-bottom`. That outlet lives INSIDE
// #main-outlet (the content column, a sibling of the sidebar), so the footer is content-width and
// never spans under the sidebar — the reason we use it over the full-width below-footer/above-footer
// outlets. renderInOutlet is unconditional; the component gates its own visibility (homepage-only by
// default, site-wide via the `footer_site_wide` setting).
export default apiInitializer((api) => {
  api.renderInOutlet("main-outlet-bottom", AskaraFooter);
});

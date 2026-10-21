import { apiInitializer } from "discourse/lib/api";
import ProjectPanel from "../components/project-panel";

// Render the project status panel above the category navigation bar (BDEV-516), in the same
// `discovery-list-controls-above` outlet the per-category cards use. The outlet fires on every stock
// list route, so the component decides for itself whether to show anything: only on a category in
// the `project_panel_topics` setting, never on a tag route.
export default apiInitializer((api) => {
  api.renderInOutlet("discovery-list-controls-above", ProjectPanel);
});

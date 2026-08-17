import { apiInitializer } from "discourse/lib/api";

// Solution cards — tag-sourced entry points shown above the discovery topic list.
// Sources the taxonomy tags (nis2 / iso27001 / ai-agents), never the deleted Solutions
// categories 12–15 (BDEV-237). v1 content is hardcoded; making it settings-driven is a
// fast follow. Rendered via the current api.renderInOutlet API (renderInOutlet supersedes
// the deprecated registerConnectorClass).
const SolutionCards = <template>
  <section class="solution-cards">
    <a class="solution-card" href="/tag/nis2">
      <h3 class="solution-card__title">NIS2</h3>
      <p class="solution-card__subtitle">Meet NIS2 obligations</p>
    </a>
    <a class="solution-card" href="/tag/iso27001">
      <h3 class="solution-card__title">ISO 27001</h3>
      <p class="solution-card__subtitle">Certify and maintain ISO 27001</p>
    </a>
    <a class="solution-card" href="/tag/ai-agents">
      <h3 class="solution-card__title">AI Agents</h3>
      <p class="solution-card__subtitle">Agentic security and compliance</p>
    </a>
  </section>
</template>;

export default apiInitializer((api) => {
  api.renderInOutlet("discovery-list-container-top", SolutionCards);
});

| Metadata | |
|---|---|
| KU ID | K028 |
| Subdomain | hybrid-search |
| Topic | Meilisearch Hybrid Search |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-MHS-01 | External Embeddings from Day One | Architecture |
| AP-MHS-02 | One-Size-Fits-All SemanticRatio | Performance |
| AP-MHS-03 | Deploying Hybrid Without Keyword Baseline | Testing |
| AP-MHS-04 | Ignoring Indexing Time Impact of Auto-Embeddings | Performance |
| AP-MHS-05 | Using Meilisearch Hybrid for Fine-Grained Fusion Control | Design |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-01: Deploying vector search without establishing a keyword baseline (`hybrid-search-concept/04-standardized-knowledge.md:37`)
- RAP-SEARCH-05: Tuning fusion parameters without per-content-type analysis (`meilisearch-hybrid-search/04-standardized-knowledge.md:39`)

---

### AP-MHS-01: External Embeddings from Day One

**Category:** Architecture

**Description:** Configuring external embedding providers (OpenAI, Cohere) for Meilisearch hybrid search before evaluating built-in auto-embedding models.

**Why It Happens:** Assumption that external embeddings are always higher quality. Lack of awareness that Meilisearch's built-in models work well for most use cases.

**Warning Signs:**
- `embedder: 'openai'` or `'cohere'` configured without testing `'default'`
- External API key required for search to function
- Indexing fails when external embedding API is unavailable

**Why Harmful:** External embeddings add API costs, latency during indexing, and external dependency. Built-in models eliminate these concerns with comparable quality for general content.

**Consequences:**
- Unnecessary API costs ($0.01-0.10 per 1K embeddings)
- Indexing failures when external API rate-limits or errors
- Higher latency for initial index population

**Alternative:** Start with Meilisearch's built-in auto-embedding (`embedder: 'default'`). Switch to external embeddings only if benchmarking demonstrates quality improvement.

**Refactoring Strategy:**
1. Configure Meilisearch with `embedder: 'default'` built-in model
2. Re-index and benchmark search quality
3. If quality acceptable, keep default; remove external embedding config
4. If quality insufficient, configure external embedding only for specific indexes
5. Add index-time monitoring for external embedding API failures

**Detection Checklist:**
- [ ] Built-in auto-embedding model tested first
- [ ] External embedding cost justified by quality metrics
- [ ] Graceful handling if external embedding API unavailable

**Related Rules/Skills/Trees:**
- Rule: Start with Auto-Embeddings (`meilisearch-hybrid-search/05-rules.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`meilisearch-hybrid-search/07-decision-trees.md:129`)

---

### AP-MHS-02: One-Size-Fits-All SemanticRatio

**Category:** Performance

**Description:** Using a single `semanticRatio` value for all search queries regardless of content type or query nature.

**Why It Happens:** Hybrid search configured once with a middle-ground ratio and never revisited. No awareness that different content types need different splits.

**Warning Signs:**
- `semanticRatio: 0.5` hard-coded in all hybrid queries
- No content-type-aware ratio selection
- Product searches return overly semantic results (missing exact SKU matches)

**Why Harmful:** Product catalogs (exact names, SKUs) need low semanticRatio (keyword-heavy). Documentation or blog content needs high semanticRatio (vector-heavy). A single ratio suboptimizes both.

**Consequences:**
- Product search misses exact name matches
- Content search misses conceptually related articles
- Lower user satisfaction for both content types

**Alternative:** Tune `semanticRatio` per content type or query classification. Use low ratio (0.2-0.4) for products, high ratio (0.6-0.8) for conceptual content.

**Refactoring Strategy:**
1. Identify content types in the application (product, article, documentation)
2. Test semanticRatio 0.3, 0.5, 0.7 for each content type
3. Store optimal ratio per content type in configuration
4. Pass content-type-aware semanticRatio in search calls
5. Monitor user engagement metrics to validate ratio choices

**Detection Checklist:**
- [ ] semanticRatio tested per content type
- [ ] Configuration supports per-content-type ratio
- [ ] A/B test results validate ratio choices

**Related Rules/Skills/Trees:**
- Rule: Tune semanticRatio for Content Type (`meilisearch-hybrid-search/05-rules.md:33`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`meilisearch-hybrid-search/07-decision-trees.md:74`)

---

### AP-MHS-03: Deploying Hybrid Without Keyword Baseline

**Category:** Testing

**Description:** Enabling Meilisearch hybrid search without benchmarking against a keyword-only baseline to verify improvement.

**Why It Happens:** Hybrid features are exciting; teams enable them assuming they always improve results. No measurement framework exists to validate the assumption.

**Warning Signs:**
- Hybrid search enabled without before/after recall metrics
- No A/B testing comparing hybrid to keyword-only
- Team cannot quantify improvement from hybrid

**Why Harmful:** Hybrid search adds latency and indexing complexity. If keyword-only achieves comparable recall, the hybrid overhead is unjustified. Resources are wasted.

**Consequences:**
- Higher query latency for no quality improvement
- Longer indexing times due to embedding generation
- No data to justify continued hybrid investment

**Alternative:** Benchmark keyword-only recall first. Enable hybrid only if it shows measurable improvement (NDCG/MRR increase above threshold).

**Refactoring Strategy:**
1. Instrument keyword-only search with NDCG/MRR measurements
2. Enable hybrid search with same measurement
3. Compare metrics across representative query set
4. If hybrid improvement < 2% NDCG, disable hybrid or return to keyword-only
5. Document benchmark results for ongoing reference

**Detection Checklist:**
- [ ] Keyword-only baseline metrics documented
- [ ] Hybrid improvement metrics documented
- [ ] Decision to keep/drop hybrid based on data
- [ ] Benchmark runs periodically to detect regression

**Related Rules/Skills/Trees:**
- Rule: Benchmark Hybrid Against Keyword-Only (`meilisearch-hybrid-search/05-rules.md:63`)
- Skill: Optimize and Monitor Meilisearch Hybrid Search Production Search (`meilisearch-hybrid-search/06-skills.md:81`)

---

### AP-MHS-04: Ignoring Indexing Time Impact of Auto-Embeddings

**Category:** Performance

**Description:** Enabling auto-embeddings without accounting for the significant increase in indexing time, causing index update delays and queue backlogs.

**Why It Happens:** Focus on search-time benefits. Developers underestimate the compute cost of generating embeddings for every document during indexing.

**Warning Signs:**
- Indexing time increased 10-100x after enabling hybrid
- Scout import commands timing out
- Queue backlog for model updates grows continuously
- Meilisearch server CPU pegged during indexing

**Why Harmful:** Auto-embedding during indexing adds significant processing time per document. This can cause import failures, delayed index updates, and stale search results.

**Consequences:**
- Stale search results (index updates delayed hours)
- Queue jobs failing due to timeouts
- Higher Meilisearch server resource requirements

**Alternative:** Use external pre-computed embeddings (embedding generation as separate job) or batch embeddings and index in background. Evaluate indexing time in staging before production.

**Refactoring Strategy:**
1. Benchmark indexing speed with auto-embeddings disabled
2. Benchmark with auto-embeddings enabled
3. If indexing time is unacceptable, switch to external pre-computed embeddings
4. Generate embeddings in separate queue job before Scout import
5. Monitor indexing time and queue depth after change

**Detection Checklist:**
- [ ] Auto-embedding indexing time benchmarked
- [ ] Index update latency meets SLA
- [ ] Queue depth for model updates stable
- [ ] Meilisearch server CPU usage acceptable during indexing

**Related Rules/Skills/Trees:**
- Rule: Start with Auto-Embeddings (`meilisearch-hybrid-search/05-rules.md:1`)
- Skill: Configure and Implement Meilisearch Hybrid Search (`meilisearch-hybrid-search/06-skills.md:1`)

---

### AP-MHS-05: Using Meilisearch Hybrid for Fine-Grained Fusion Control

**Category:** Design

**Description:** Selecting Meilisearch hybrid search for use cases requiring fine-grained fusion control (per-field weights, custom cross-encoder re-ranking, adaptive query-class weighting).

**Why It Happens:** Desire for hybrid search in Laravel with minimal setup. Meilisearch's simplicity attracts teams whose requirements exceed its fusion capabilities.

**Warning Signs:**
- Requirements call for per-field BM25 boost or custom ranking
- Cross-encoder re-ranking is a known requirement
- Team needs to adjust fusion per query type dynamically
- Meilisearch hybrid cannot meet relevance targets

**Why Harmful:** Meilisearch abstracts fusion parameters (no α, no per-field weights, no custom re-ranking). Applications needing fine-grained control will hit limitations requiring workarounds or engine swaps.

**Consequences:**
- Hit Meilisearch fusion limits mid-project
- Need to migrate to more configurable engine (Qdrant, Elasticsearch, custom)
- Workarounds that increase complexity and latency

**Alternative:** Choose Qdrant (more configurable hybrid) or application-level fusion with Elasticsearch for use cases needing fine-grained control.

**Refactoring Strategy:**
1. Document specific fusion control requirements
2. Compare Meilisearch hybrid API against requirements
3. If requirements exceed Meilisearch capabilities, plan migration to Qdrant or application-level fusion
4. For remaining use cases, simplify to Meilisearch's supported parameter set
5. Remove custom workarounds that fight Meilisearch's abstraction

**Detection Checklist:**
- [ ] Fusion control requirements documented
- [ ] Meilisearch capabilities compared to requirements
- [ ] Engine choice matches fusion flexibility needs
- [ ] No workarounds fighting Meilisearch's API

**Related Rules/Skills/Trees:**
- Rule: Use Engine-Level Hybrid When Available (`laravel-hybrid-implementation/05-rules.md:1`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`meilisearch-hybrid-search/07-decision-trees.md:129`)

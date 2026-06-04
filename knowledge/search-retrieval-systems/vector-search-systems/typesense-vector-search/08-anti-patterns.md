# Anti-Patterns: Typesense Vector Search

## Metadata

| | |
|---|---|
| **KU ID** | K036 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Typesense Vector Search |
| **Source** | Typesense Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Mismatched Distance Metric for Embedding Model | Design | High |
| 2 | No vector_query Weight Configuration | Performance | Medium |
| 3 | Expecting Auto-Embeddings from Typesense | Architecture | High |
| 4 | No num_vectors Configuration | Performance | Medium |

## Repository-Wide Anti-Patterns

- **Auto-Embedding Assumption**: Expecting Typesense to generate embeddings internally like Meilisearch
- **Default Weight Blindness**: Using default text-vs-vector balance without tuning for specific content
- **Copy-Paste Metric**: Using the same distance metric from a tutorial without matching the embedding model

---

## 1. Mismatched Distance Metric for Embedding Model

**Category:** Design

**Description:** Configuring Typesense vector search with a distance metric (L2, dot product) that does not match the embedding model's training metric.

**Why It Happens:** The metric is set at collection schema creation. Developers choose a familiar metric without checking the model documentation.

**Warning Signs:**
- Vector search returns semantically poor results
- Metric choice was not documented or justified
- Embedding model documentation specifies cosine but Typesense uses L2

**Why Harmful:** Typesense uses the configured metric for ANN search. A mismatched metric produces incorrect rankings.

**Consequences:**
- 10-30% reduction in retrieval accuracy
- Collection must be dropped and recreated to fix metric

**Alternative:** Match the metric to your embedding model. Default to cosine for text embeddings.

**Refactoring Strategy:**
1. Create new collection with correct metric
2. Re-index all documents
3. Delete old collection

**Detection Checklist:**
- [ ] Does metric match embedding model?
- [ ] Is metric choice documented?

**Related Rules/Skills/Trees:**
- Rule: Match Distance Metric to Embedding Model (`05-rules.md:1-30`)

---

## 2. No vector_query Weight Configuration

**Category:** Performance

**Description:** Using Typesense hybrid search without configuring the `weight` parameter in `vector_query`, accepting default balance that may not suit the application.

**Why It Happens:** The default weight may work adequately. Developers don't explore tuning because the search "seems fine."

**Warning Signs:**
- `vector_query` without `weight` parameter
- Keyword results consistently rank above or below vector results
- No A/B test of different weight values

**Why Harmful:** Default weight may over-emphasize text or vector results. The hybrid fusion is unbalanced, so one retrieval path dominates without providing optimal quality.

**Consequences:**
- One retrieval path effectively unused
- Suboptimal hybrid quality

**Alternative:** Configure weight parameter (0.0 to 1.0) to balance text vs vector contribution.

**Refactoring Strategy:**
1. Test weight values 0.3, 0.5, 0.7
2. Choose weight that maximizes recall
3. Document choice

**Detection Checklist:**
- [ ] Is weight parameter configured?
- [ ] Was weight tuned based on results?

**Related Rules/Skills/Trees:**
- Rule: Weight Text vs Vector Relevance (`05-rules.md:32-63`)

---

## 3. Expecting Auto-Embeddings from Typesense

**Category:** Architecture

**Description:** Assuming Typesense generates embeddings automatically (like Meilisearch), resulting in vector search queries that return no results because embeddings were never generated.

**Why It Happens:** Teams familiar with Meilisearch's auto-embedding feature expect the same from Typesense. Typesense documentation mentions "vector search" but the embedding generation pipeline must be built separately.

**Warning Signs:**
- Vector search returns empty or incorrect results
- No embedding generation code in the application
- Expectation that Typesense handles embeddings internally

**Why Harmful:** Typesense stores and searches vectors but does not generate them. Without an external embedding pipeline, the vector field is always empty.

**Consequences:**
- Vector search completely non-functional
- Wasted debugging time

**Alternative:** Implement external embedding generation (OpenAI, Cohere, FastEmbed) and pass pre-computed embeddings to Typesense.

**Refactoring Strategy:**
1. Implement embedding generation pipeline
2. Include embeddings in document upsert
3. Cache embeddings to avoid regeneration

**Detection Checklist:**
- [ ] Is there an external embedding pipeline?
- [ ] Are embeddings pre-computed before Typesense upsert?

**Related Rules/Skills/Trees:**
- Rule: Generate Embeddings Externally for Typesense (`05-rules.md:65-96`)

---

## 4. No num_vectors Configuration

**Category:** Performance

**Description:** Not providing `num_vectors` in the Typesense vector schema, leaving HNSW parameters at defaults that may be suboptimal for the dataset size.

**Why It Happens:** `num_vectors` is an optional schema parameter. Developers omit it because the field schema works without it.

**Warning Signs:**
- No `num_vectors` in vector field configuration
- HNSW default parameters assumed optimal

**Why Harmful:** Typesense automatically tunes HNSW parameters based on `num_vectors`. Without it, defaults are used which may not match the dataset size.

**Consequences:**
- Suboptimal ANN performance for large datasets

**Alternative:** Set `num_vectors` to the expected dataset size at collection creation.

**Refactoring Strategy:**
1. Update collection schema to include `num_vectors`
2. Verify query latency improvement

**Detection Checklist:**
- [ ] Is `num_vectors` configured?
- [ ] Does it reflect the expected dataset size?

**Related Rules/Skills/Trees:**
- Rule: Configure HNSW Parameters via num_vectors (`05-rules.md:98-124`)

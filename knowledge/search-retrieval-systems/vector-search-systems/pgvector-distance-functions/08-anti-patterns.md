# Anti-Patterns: pgvector Distance Functions

## Metadata

| | |
|---|---|
| **KU ID** | K043 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector Distance Functions |
| **Source** | pgvector Docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Mismatched Distance Function for Embedding Model | Design | High |
| 2 | Mismatched Index Operator Class and Query Operator | Performance | High |
| 3 | L2 Default for Text Embeddings | Design | Medium |
| 4 | L2 on Normalized Vectors Without Performance Awareness | Performance | Low |
| 5 | No Benchmarking of Alternative Distance Functions | Testing | Medium |

## Repository-Wide Anti-Patterns

- **Copy-Paste Operator Choice**: Using the same distance operator (`<->`, `<=>`, `<#>`) from a tutorial without verifying it matches the embedding model
- **Index-Query Operator Mismatch**: Creating an ANN index with `vector_cosine_ops` but querying with `<->` (L2), causing the index to be ignored
- **Default Fallacy**: Assuming the first distance function mentioned in documentation is always the best choice

---

## 1. Mismatched Distance Function for Embedding Model

**Category:** Design

**Description:** Using a distance function (L2, inner product) that does not match the embedding model's training objective, producing suboptimal rankings.

**Why It Happens:** Developers default to L2 distance because it is conceptually simple (straight-line distance) or to inner product because it is computationally cheaper. The embedding model's documentation for recommended metric is not consulted. The impact is not visible on small datasets where any reasonable metric returns plausible results.

**Warning Signs:**
- Search results rank semantically unrelated items above related ones
- Recall metrics are significantly lower than the model's published benchmarks
- Changing the distance function dramatically changes result rankings
- Team cannot state which distance function the embedding model was trained with
- Different team members use different operators for the same model

**Why Harmful:** The embedding model's vector space geometry is determined by its training loss function, which uses a specific distance metric. Cosine-trained models produce vectors where cosine similarity reflects semantic similarity. L2-trained models produce vectors where Euclidean distance reflects semantic similarity. Using the wrong metric measures distances in a geometry the model was never optimized for, systematically producing worse rankings.

**Consequences:**
- 10-40% reduction in retrieval accuracy depending on model
- Inconsistent search quality across different query types
- Wasted effort tuning other parameters while root cause is the distance function
- False conclusion that the embedding model itself is poor quality
- Hard to debug because results are "plausible but suboptimal"

**Alternative:** Always check the embedding model's documentation for the recommended distance metric. Default to cosine distance (`<=>`) for text embedding models unless documentation specifies otherwise.

**Refactoring Strategy:**
1. Identify the embedding model and check its recommended distance metric
2. Audit all queries to ensure they use the correct operator
3. If changing operators, update the ANN index to use matching operator class
4. Re-index if necessary (index is operator-class-specific)
5. Benchmark recall improvement after operator change
6. Document the chosen operator and rationale

**Detection Checklist:**
- [ ] Is the distance function documented alongside the embedding model choice?
- [ ] Does the chosen operator match the model's training objective?
- [ ] Are all queries using the same operator for the same model?
- [ ] Was recall benchmarked against alternative distance functions?

**Related Rules/Skills/Trees:**
- Rule: Match Distance Function to Embedding Model's Training Metric (`05-rules.md:1-31`)
- Rule: Use Cosine Distance as Default for Text Embeddings (`05-rules.md:33-62`)
- Skill: Configure and Implement Pgvector Distance Functions (`06-skills.md:1-78`)

---

## 2. Mismatched Index Operator Class and Query Operator

**Category:** Performance

**Description:** Creating an ANN index with one operator class (e.g., `vector_cosine_ops`) but querying with a different operator (e.g., `<->`), causing the ANN index to be ignored in favor of full sequential scan.

**Why It Happens:** The index creation and query code are often written at different times or by different developers. The index uses one operator class, while the query uses another because the developer assumed "any distance operator works." pgvector does not error on this mismatch — it silently falls back to exact search.

**Warning Signs:**
- EXPLAIN ANALYZE shows Sequential Scan despite ANN index existing
- Queries are much slower than expected given the index
- Index was created for `<=>` but queries use `<->` or `<#>`
- Multiple index creation statements with different operator classes exist
- Query latency equals full sequential scan time

**Why Harmful:** pgvector ANN indexes are tightly coupled to specific operator classes. A `vector_cosine_ops` index only accelerates `<=>` queries. Using `<->` (L2) against a cosine index forces PostgreSQL to ignore the index entirely and perform a full table scan with exact distance computation. The developer believes the index is working (no error) but receives none of its performance benefit.

**Consequences:**
- Full table scan on every query despite index existing
- 10-1000× slower queries than expected
- Index wastes storage and build time with zero benefit
- Hard to detect because no error is raised
- Production performance issues that seem inexplicable

**Alternative:** Ensure the query operator matches the index operator class exactly. Use `<=>` with `vector_cosine_ops` indexes, `<->` with `vector_l2_ops` indexes, and `<#>` with `vector_ip_ops` indexes.

**Refactoring Strategy:**
1. Identify ANN indexes and their operator classes: `\di+` in psql
2. Audit all vector queries to check which operators they use
3. Fix operator mismatches by changing query operators to match indexes
4. If multiple operators are needed, create multiple indexes
5. Verify with EXPLAIN ANALYZE that indexes are being used

**Detection Checklist:**
- [ ] Does every vector ANN index have a matching operator in queries?
- [ ] Does EXPLAIN ANALYZE show Index Scan (not Seq Scan) for vector queries?
- [ ] Are queries tested with the same operator class as the index?
- [ ] If multiple operators are needed, do multiple indexes exist?

**Related Rules/Skills/Trees:**
- Rule: Create Index with Matching Operator Class (`05-rules.md:64-97`)
- Skill: Configure and Implement Pgvector Distance Functions (`06-skills.md:1-78`)

---

## 3. L2 Default for Text Embeddings

**Category:** Design

**Description:** Using L2 distance (`<->`) as the default for all text embedding queries without considering that most text embedding models are trained with cosine similarity.

**Why It Happens:** L2 distance is geometrically intuitive (straight-line distance). Many developers' first exposure to distance metrics is L2 from linear algebra. Tutorials and examples often default to L2. The difference in ranking quality is not immediately noticeable on small datasets or when the embedding space happens to have properties where L2 and cosine correlate.

**Warning Signs:**
- All text embedding queries use `<->` regardless of model
- Embedding model documentation recommends cosine but the code uses L2
- Results for short queries (where magnitude varies) are less relevant
- Embedding vectors have widely varying magnitudes
- No justification exists for L2 choice over cosine

**Why Harmful:** Most text embedding models (OpenAI, BGE, E5, Cohere, sentence-transformers) are trained with cosine similarity. Their vector space is optimized such that cosine distance reflects semantic distance. L2 distance incorporates vector magnitude, which may encode information like confidence or frequency but is not part of the semantic signal. For models with varying vector magnitudes, L2 rankings may be dominated by magnitude rather than semantic direction.

**Consequences:**
- 5-15% lower retrieval recall compared to cosine for text embeddings
- Results biased toward vectors with specific magnitude characteristics
- Inconsistent behavior when query length varies (magnitude changes)
- Hard to diagnose: results are "mostly right" but systematically worse
- Team attributes poor search to the embedding model rather than the metric

**Alternative:** Default to cosine distance (`<=>`) for text embedding queries. Reserve L2 for models documented to use L2 or for image/sensor embeddings where magnitude carries meaning.

**Refactoring Strategy:**
1. Identify all text embedding queries using `<->` (L2)
2. Change to `<=>` (cosine)
3. Update ANN indexes from `vector_l2_ops` to `vector_cosine_ops`
4. Re-index with matching operator class
5. Benchmark recall improvement
6. Document the rationale

**Detection Checklist:**
- [ ] Is the distance function appropriate for text embeddings (cosine preferred)?
- [ ] Are there queries using L2 for text embeddings without documented justification?
- [ ] Does the ANN index match the query operator?
- [ ] Were alternative distance functions benchmarked?

**Related Rules/Skills/Trees:**
- Rule: Use Cosine Distance as Default for Text Embeddings (`05-rules.md:33-62`)
- Rule: Match Distance Function to Embedding Model's Training Metric (`05-rules.md:1-31`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 4. L2 on Normalized Vectors Without Performance Awareness

**Category:** Performance

**Description:** Using cosine distance on normalized vectors when L2 would produce identical ordering with slightly faster computation, missing an easy performance optimization.

**Why It Happens:** Developers always use the same operator for clarity and consistency. They may not know that L2 and cosine produce identical orderings for normalized vectors. The performance difference is small per query and often overlooked.

**Warning Signs:**
- Vectors are verified normalized (unit length)
- All queries use `<=>` (cosine) exclusively
- Query throughput is a concern but operator choice is not evaluated
- Team is unaware of the L2-vs-cosine equivalence for normalized vectors
- No benchmark comparing query latency between L2 and cosine exists

**Why Harmful:** For normalized vectors, `GROUP BY distance` yields identical results for L2 and cosine ordering. However, L2 computation requires fewer operations (no dot product normalization). At high query volumes (1000+ QPS), the difference can reduce database CPU usage by 10-20% for the distance computation portion of the query.

**Consequences:**
- 10-20% higher CPU cost per query than necessary
- At scale, measurable increase in database server costs
- Unnecessary latency for the distance computation step
- Missed optimization opportunity with zero accuracy tradeoff
- Contributes to database resource contention for transactional queries

**Alternative:** For normalized vectors (verified unit length), use L2 distance (`<->`) for faster computation with identical ranking. Document that L2 is used because vectors are normalized.

**Refactoring Strategy:**
1. Verify that vectors are indeed normalized (measure sample)
2. For tables with normalized vectors, change `<=>` to `<->`
3. Update index operator class from `vector_cosine_ops` to `vector_l2_ops`
4. Re-index with matching operator class
5. Benchmark latency improvement
6. Document: "Using L2 because vectors are normalized — yields same ordering as cosine"

**Detection Checklist:**
- [ ] Are vectors verified as normalized (unit length)?
- [ ] If normalized, is L2 used instead of cosine?
- [ ] Is the index operator class appropriate for the chosen metric?
- [ ] Was the latency impact of operator choice benchmarked?

**Related Rules/Skills/Trees:**
- Rule: Use L2 for Normalized Embeddings (`05-rules.md:99-128`)
- Skill: Configure and Implement Pgvector Distance Functions (`06-skills.md:1-78`)

---

## 5. No Benchmarking of Alternative Distance Functions

**Category:** Testing

**Description:** Choosing a distance function based on default recommendation without benchmarking alternative functions on the specific dataset to verify optimal recall.

**Why It Happens:** General guidance ("use cosine for text embeddings") is treated as an absolute rule. The effort to benchmark alternatives seems unnecessary when the default works adequately. Development datasets are too small to reveal the subtle differences between distance functions.

**Warning Signs:**
- No benchmark records comparing recall of different distance functions
- Distance function choice rationale is "best practice" without supporting data
- Team cannot provide recall metrics for the chosen function
- Different distance functions were never tested with the application's specific data
- Production recall issues are discovered after deploy, not before

**Why Harmful:** While cosine is the right default for text embeddings, your specific data distribution, embedding model version, and query patterns may perform better with L2 or inner product. Without benchmarking, this potential improvement is left on the table. Additionally, if the embedding model is changed later, the distance function decision may become suboptimal without a re-evaluation.

**Consequences:**
- Potentially suboptimal recall from using a non-ideal distance function
- No data to justify the distance function choice
- Unknown whether the current choice is optimal
- Difficulty evaluating model upgrades (new model may prefer different metric)
- Benchmark must be done under emergency rather than proactively

**Alternative:** Before committing to a distance function, benchmark cosine, L2, and inner product with your specific data and queries. Select the function that maximizes recall at acceptable latency.

**Refactoring Strategy:**
1. Create a benchmark script that evaluates recall for cosine, L2, and inner product
2. Run benchmark on production-proportional data
3. Document recall and latency for each option
4. Choose the function that best meets requirements
5. Store benchmark results for future reference (model upgrades)

**Detection Checklist:**
- [ ] Were multiple distance functions benchmarked before choosing?
- [ ] Does the benchmark use production-representative data and queries?
- [ ] Are benchmark results documented for future reference?
- [ ] Is the distance function choice re-evaluated when the embedding model changes?

**Related Rules/Skills/Trees:**
- Rule: Benchmark Alternative Distance Functions (`05-rules.md:130-159`)
- Skill: Optimize and Monitor Pgvector Distance Functions (`06-skills.md:82-158`)

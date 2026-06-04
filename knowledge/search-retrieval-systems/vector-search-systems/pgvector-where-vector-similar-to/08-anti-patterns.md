# Anti-Patterns: pgvector WHERE Vector Similar To

## Metadata

| | |
|---|---|
| **KU ID** | ku-04 |
| **Subdomain** | vector-similarity-search |
| **Topic** | pgvector WHERE Vector Similar To |
| **Source** | pgvector docs |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Wrong Distance Operator for Embedding Model | Design | High |
| 2 | No LIMIT on ANN Queries | Performance | Critical |
| 3 | Post-Filtering Metadata After Vector Search | Performance | High |
| 4 | Using Unnormalized Vectors with Cosine Distance | Maintainability | Medium |
| 5 | Ignoring ef_search Tuning for HNSW | Performance | Medium |

## Repository-Wide Anti-Patterns

- **LIMIT-Averse Queries**: Running `ORDER BY distance` without LIMIT, forcing full exhaustive search even with ANN index
- **Application-Level Filtering**: Fetching all vector results then filtering in PHP instead of using SQL WHERE pre-filters
- **One-Operator Mentality**: Using the same distance operator (`<=>`, `<->`, `<#>`) for all queries without verifying it matches the embedding model

---

## 1. Wrong Distance Operator for Embedding Model

**Category:** Design

**Description:** Using L2 distance (`<->`) or inner product (`<#>`) when the embedding model was trained for cosine similarity (`<=>`), or vice versa, producing suboptimal rankings.

**Why It Happens:** Developers default to the "first operator they see" without understanding the mathematical differences. L2 is conceptually simpler (straight-line distance) so it is often chosen. The impact is not immediately visible on small datasets where any operator returns plausible-looking results.

**Warning Signs:**
- Search results rank semantically unrelated items higher than related ones
- Changing the operator changes results significantly
- Embedding model documentation specifies a recommended metric but the code uses a different one
- Vector norms vary widely (indicating dot product and cosine will differ)
- Team members disagree on which operator to use (no documented convention)

**Why Harmful:** Embedding models are trained using specific distance functions. The model's vector space geometry only produces meaningful rankings under the expected distance metric. Using a different metric measures similarity in a way the model was never optimized for, producing systematically worse rankings than achievable with the correct metric.

**Consequences:**
- 10-30% reduction in search relevance metrics
- Users finding irrelevant results ranked above relevant ones
- Inconsistent ranking behavior across different query types
- Wasted tuning effort on other parameters while the root cause is the distance operator
- Difficult to debug because results are "not obviously wrong" — just worse

**Alternative:** Default to cosine distance (`<=>`) for all text embedding models unless the model documentation explicitly recommends a different metric. Verify the model's training objective before choosing the operator.

**Refactoring Strategy:**
1. Identify the embedding model and check its documentation for recommended distance metric
2. Audit all distance queries to ensure they use the correct operator
3. Change operator in query code (`<->` → `<=>` or vice versa)
4. If changing the operator changes ranking semantics, update cache/expectations
5. A/B test relevance metrics before and after operator change
6. Document the chosen operator and rationale per model

**Detection Checklist:**
- [ ] Is the distance operator documented alongside the embedding model choice?
- [ ] Does the chosen operator match the model's training objective?
- [ ] Are all queries using the same operator for the same model?
- [ ] Has the operator choice been benchmarked against alternatives?

**Related Rules/Skills/Trees:**
- Rule: Use Cosine Distance as Default Operator (`05-rules.md:1-29`)
- Skill: Configure and Implement Pgvector Where Vector Similar To (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 2. No LIMIT on ANN Queries

**Category:** Performance

**Description:** Running vector similarity queries with `ORDER BY embedding <=> '[vec]'` but omitting `LIMIT`, causing the ANN index to return all documents and perform a full exhaustive search.

**Why It Happens:** Developers familiar with traditional SQL may not understand that ANN indexes require LIMIT to function efficiently. The index will work for queries with LIMIT but will fall back to exhaustive search without it. Pagination patterns (`LIMIT 20 OFFSET 0`) sometimes omit LIMIT for "get all results" use cases.

**Warning Signs:**
- Vector queries without LIMIT take dramatically longer than those with LIMIT
- Query plans show full index scan even though ANN index exists
- API endpoints that return "all similar items" have no LIMIT clause
- Paging through vector results without LIMIT on each page
- Application code that fetches all vectors then paginates in PHP

**Why Harmful:** Without LIMIT, pgvector cannot use the ANN index's approximation — it must compute the full distance between the query vector and every stored vector. This eliminates the entire performance benefit of the ANN index and reverts to O(n) exhaustive search, the exact problem the index was designed to solve.

**Consequences:**
- 10-1000× slower queries than necessary
- ANN index provides no benefit for queries without LIMIT
- High database CPU usage for every search
- Connection pool exhaustion as each query takes seconds
- Users experience timeouts for open-ended queries

**Alternative:** Always specify LIMIT on every vector distance query. Use a generous LIMIT (e.g., 100-1000) for "get many results" use cases. Implement cursor-based or keyset pagination for result browsing beyond the limit.

**Refactoring Strategy:**
1. Find all vector queries without LIMIT using code search
2. Add appropriate LIMIT value based on use case (recommended: 20-200 for UI, up to 1000 for exports)
3. For result browsing, implement keyset pagination instead of large LIMIT
4. Verify query plans show ANN index usage after adding LIMIT
5. Set up monitoring to detect queries without LIMIT (slow query log)

**Detection Checklist:**
- [ ] Do all vector ORDER BY queries include a LIMIT clause?
- [ ] Does EXPLAIN ANALYZE show ANN index usage (not full scan)?
- [ ] Are pagination patterns compatible with LIMIT-based ANN search?
- [ ] Are there use cases requiring "all results" that bypass LIMIT?

**Related Rules/Skills/Trees:**
- Rule: Always Include LIMIT on ANN Queries (`05-rules.md:31-58`)
- Skill: Optimize and Monitor Pgvector Where Vector Similar To (`06-skills.md:81-156`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 3. Post-Filtering Metadata After Vector Search

**Category:** Performance

**Description:** Retrieving vector search results from the database first, then filtering by metadata fields (category, status, date) in application code, instead of including WHERE clauses in the SQL query.

**Why It Happens:** Application-level filtering is easier to implement and debug. Developers add vector search first, then add metadata filtering as an afterthought by iterating results in PHP. The performance impact is hidden until dataset size grows and the number of results retrieved before filtering becomes large.

**Warning Signs:**
- Vector search queries retrieve many more results than needed (e.g., LIMIT 1000 for 10 final results)
- `Model::nearestNeighbors($vector, 1000)->get()` followed by PHP `->where()` or `->filter()`
- Search endpoint returns good results but response time includes significant post-processing
- Increasing LIMIT improves filter coverage but slows queries
- Database queries are simple but PHP memory usage is high

**Why Harmful:** Post-filtering requires fetching far more results from the database than the user needs. If only 10% of results match a status filter, you must fetch 10× more vectors than necessary. This multiplies query latency, network transfer, and PHP processing time. At scale, the LIMIT must be set high enough to ensure enough results survive filtering, compounding the inefficiency.

**Consequences:**
- 2-10× higher query latency than pre-filtered alternative
- Increased database I/O from fetching unnecessary vectors and associated data
- High PHP memory usage for result processing
- Inconsistent result counts (pagination issues) when filtered results are fewer than expected
- Poor performance as filter selectivity decreases (hit rate drops)

**Alternative:** Include metadata filters as WHERE clauses in the SQL query before the ORDER BY. PostgreSQL's filtered ANN handles the combination efficiently by using the ANN index for vector similarity and applying filters during the index scan.

**Refactoring Strategy:**
1. Identify post-filtering operations in PHP code
2. Move filters into database query as WHERE clauses
3. For cases where filters are too selective (eliminate many candidates), use iterative index scans
4. Monitor recall: filtered ANN may miss some relevant results if filters are very selective
5. Consider composite indexes on (filter_column, embedding) for common filter patterns

**Detection Checklist:**
- [ ] Are metadata filters included in the SQL WHERE clause (not applied in PHP)?
- [ ] Are vector queries tested with realistic filter selectivity?
- [ ] Is recall benchmarked for filtered vs unfiltered queries?
- [ ] Are iterative index scans considered for very selective filters?

**Related Rules/Skills/Trees:**
- Rule: Pre-Filter Before ORDER BY (`05-rules.md:61-95`)
- Skill: Configure and Implement Pgvector Where Vector Similar To (`06-skills.md:1-78`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

---

## 4. Using Unnormalized Vectors with Cosine Distance

**Category:** Maintainability

**Description:** Storing unnormalized vectors and querying with cosine distance (`<=>`), which produces incorrect rankings because `<=>` computes `1 - cos(θ)` and cos(θ) for non-unit vectors does not reflect semantic similarity.

**Why It Happens:** Not all embedding APIs return normalized vectors by default. Developers assume normalization without verification. The query code uses `<=>` (cosine distance) which implicitly expects unit vectors. Unnormalized vectors can still return "plausible" results — the degradation is subtle and often goes undetected.

**Warning Signs:**
- Cosine distance values are outside expected range [0, 2]
- Vector norms significantly differ from 1.0
- Changing from `<=>` to `<->` changes result rankings despite theoretical equivalence for normalized vectors
- Results seem less semantically relevant than expected from the embedding model's benchmarks
- Different records with identical content produce different distance values

**Why Harmful:** Cosine distance is defined as `1 - (A·B) / (||A|| ||B||)`. When vectors are not unit length, the division by norms is required for correct computation. pgvector's `<=>` operator assumes normalized vectors and does not perform the norm division. Using it with unnormalized vectors produces a "pseudo-cosine" that is actually the inner product — ranking is distorted by vector magnitude rather than purely by direction.

**Consequences:**
- Inconsistent rankings where highly similar content is ranked below less relevant content
- Search quality degradation that is hard to diagnose (results are "close but wrong")
- Difficulty comparing results across different embedding models or batches
- False conclusions that cosine distance is ineffective for your use case

**Alternative:** Normalize all vectors before storage. Verify norm = 1.0 ± 0.001 for each vector. For vectors guaranteed normalized by the provider, assert this guarantee with periodic sampling.

**Refactoring Strategy:**
1. Measure norms of existing stored vectors
2. For each non-normalized vector, normalize in place (or regenerate embedding)
3. Add normalization step to the embedding pipeline
4. Add validation that rejects unnormalized vectors at write time
5. Document which embedding models require normalization vs output normalized by default

**Detection Checklist:**
- [ ] Are all stored vectors verified to be unit length?
- [ ] Is there a normalization step in the embedding pipeline?
- [ ] Are vector norms monitored to detect normalization drift?
- [ ] Is the distance operator choice appropriate for normalized vectors?

**Related Rules/Skills/Trees:**
- Rule: Normalize Vectors for Consistent Distance (`05-rules.md:97-126`)
- Skill: Configure and Implement Pgvector Where Vector Similar To (`06-skills.md:1-78`)

---

## 5. Ignoring ef_search Tuning for HNSW

**Category:** Performance

**Description:** Using the default HNSW ef_search value (40 in pgvector) without tuning for the desired recall-vs-latency tradeoff, accepting suboptimal performance.

**Why It Happens:** ef_search defaults to a conservative value that works for most datasets. Developers deploy with the default and never revisit it. The parameter is set at the session level (not in the query) and is easy to overlook. Tuning feels like optimization work that can be deferred, but the default is rarely optimal for any specific workload.

**Warning Signs:**
- Query latency is acceptable but recall is lower than desired
- ef_search is never explicitly set in application code
- Production queries use the pgvector default (40) for all workloads
- No benchmarks exist comparing recall at different ef_search values
- Users report missing relevant results in top-k rankings

**Why Harmful:** ef_search directly controls the recall-latency tradeoff in HNSW. The default value of 40 provides approximately 90-95% recall for most datasets. Increasing to 100-200 can achieve 98-99% recall with only 2-3× more distance computations. Conversely, for high-throughput applications, decreasing ef_search below default can provide faster queries at acceptable recall. The default serves neither goal optimally.

**Consequences:**
- 3-8% lower recall than achievable with minimal latency increase
- Users miss relevant results that are just below the top-k cutoff
- High-throughput queries may be slower than necessary if a lower ef_search would suffice
- No documented recall baseline for the application
- Inability to make conscious latency-vs-recall decisions for different query types

**Alternative:** Set ef_search per query type based on recall requirements. Use `SET LOCAL hnsw.ef_search = 200` for high-recall queries, `SET LOCAL hnsw.ef_search = 40` for high-throughput queries. Benchmark recall at multiple values before choosing defaults.

**Refactoring Strategy:**
1. Benchmark recall at different ef_search values (40, 100, 200, 400) on production dataset
2. Choose ef_search per query type based on recall requirements
3. Set ef_search in each query session using `SET LOCAL hnsw.ef_search = <value>`
4. Document the chosen values and expected recall for each query type
5. Re-benchmark periodically as dataset grows (ef_search may need adjustment)

**Detection Checklist:**
- [ ] Is ef_search explicitly set for vector queries (not left at default)?
- [ ] Are different ef_search values used for different recall requirements?
- [ ] Has recall been benchmarked at the chosen ef_search value?
- [ ] Is ef_search re-evaluated when dataset size changes significantly?

**Related Rules/Skills/Trees:**
- Skill: Optimize and Monitor Pgvector Where Vector Similar To (`06-skills.md:81-156`)
- Decision: ANN Index Type Selection (`07-decision-trees.md:137-191`)

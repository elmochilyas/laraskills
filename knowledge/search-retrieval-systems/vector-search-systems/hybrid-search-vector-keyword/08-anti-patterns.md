# Anti-Patterns: Hybrid Search (Vector + Keyword)

## Metadata

| | |
|---|---|
| **KU ID** | ku-11 |
| **Subdomain** | vector-similarity-search |
| **Topic** | Hybrid Search (Vector + Keyword) |
| **Source** | Academic / Industry |
| **Maturity** | Stable |
| **Domain** | Search & Retrieval Systems |
| **Subdomain Path** | 06-vector-search-systems |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Application-Level Fusion Without Native Support Check | Architecture | Medium |
| 2 | Sequential Retrieval Paths (Not Parallel) | Performance | High |
| 3 | Excessive Candidate Pool Size | Performance | Medium |
| 4 | Unmonitored Fusion Balance | Maintainability | Medium |
| 5 | Complex Fusion Strategy Before RRF Baseline | Design | Medium |

## Repository-Wide Anti-Patterns

- **Single-Path Mentality**: Using only vector or only keyword search when hybrid would serve both semantic and exact-match queries
- **Fusion Complexity First**: Implementing cross-encoders or learned weighting before establishing RRF baseline
- **Serial Pipeline**: Running keyword then vector search sequentially, doubling latency unnecessarily

---

## 1. Application-Level Fusion Without Native Support Check

**Category:** Architecture

**Description:** Implementing custom application-level hybrid fusion (two queries + manual merge) when the search engine natively supports hybrid search.

**Why It Happens:** Most teams implement hybrid search by combining two separate searches in application code. This is the most obvious approach. Developers may not check whether their chosen search engine (Qdrant, Meilisearch, Typesense, Milvus) offers native hybrid support.

**Warning Signs:**
- Application runs two separate queries then fuses results
- Search engine has hybrid/fusion API but it's not used
- Fusion logic is custom RRF implementation
- Two separate search service calls per request
- Latency is double what engine-native hybrid would provide

**Why Harmful:** Engine-native hybrid handles fusion internally, avoiding two network roundtrips, managing score normalization, and optimizing retrieval. Application-level fusion doubles latency, requires custom score management, and adds maintenance burden for fusion logic.

**Consequences:**
- Double the query latency (two network roundtrips)
- Custom fusion code that must be maintained and tested
- Harder to tune and debug fusion parameters
- Missed engine-level optimizations (parallel internal retrieval)

**Alternative:** Check if your search engine supports native hybrid search before implementing application-level fusion. Use engine-level hybrid when available.

**Refactoring Strategy:**
1. Check if search engine supports native hybrid
2. If yes, replace dual queries with single hybrid query
3. Remove application-level fusion code
4. Benchmark latency improvement
5. Verify result quality matches or exceeds application-level fusion

**Detection Checklist:**
- [ ] Does the search engine support native hybrid search?
- [ ] If yes, is it being used (instead of application-level fusion)?
- [ ] Is fusion complexity justified by engine limitations?
- [ ] Is the fusion approach documented?

**Related Rules/Skills/Trees:**
- Rule: Use Engine-Native Hybrid When Available (`05-rules.md:1-38`)
- Rule: Start with RRF Fusion (`05-rules.md:40-70`)

---

## 2. Sequential Retrieval Paths (Not Parallel)

**Category:** Performance

**Description:** Running keyword search and vector search sequentially, doubling the total hybrid search latency.

**Why It Happens:** The simplest implementation runs one query after another: `$keywordResults = ...; $vectorResults = ...;`. Async/parallel execution requires additional infrastructure or language features that may not be immediately available.

**Warning Signs:**
- Total hybrid latency = keyword latency + vector latency
- No concurrent/async execution in hybrid search code
- Fusion waits for both queries to complete sequentially
- Latency bottleneck even though individual paths are fast
- Fusion function signature shows sequential dependencies

**Why Harmful:** Hybrid search should be as fast as the slower of the two retrieval paths, not the sum. Sequential execution doubles the user-perceived search latency. In web applications where every millisecond matters, this is a significant UX degradation.

**Consequences:**
- 2× search latency compared to parallel execution
- Worse user experience than either search method alone
- Higher server resource utilization (longer connection time)
- Performance budget consumed by suboptimal execution order

**Alternative:** Run keyword and vector retrieval concurrently using Laravel's `Http::pool()`, `parallel` (if installed), or dispatched jobs with futures.

**Refactoring Strategy:**
1. Identify sequential retrieval calls
2. Implement concurrent execution (async/await, parallel, pooling)
3. Wait for both to complete before fusion
4. Benchmark latency reduction
5. Handle error cases (one path fails)

**Detection Checklist:**
- [ ] Are retrieval paths executed in parallel?
- [ ] Is total latency ≈ max(path latency), not sum?
- [ ] Are concurrent execution primitives used?
- [ ] Is error handling in place for failed paths?

**Related Rules/Skills/Trees:**
- Rule: Parallelize Retrieval Paths (`05-rules.md:72-103`)

---

## 3. Excessive Candidate Pool Size

**Category:** Performance

**Description:** Retrieving thousands of candidates per path (e.g., top-1000 keyword + top-1000 vector) for fusion, when top-100 per path provides equivalent recall.

**Why It Happens:** Developers assume "more candidates = better recall." They set high limits to avoid missing relevant results. The performance impact is not benchmarked against the marginal recall gain.

**Warning Signs:**
- Candidate pool is 1000+ per retrieval path
- Fusion processes thousands of candidates
- RRF k constant is much larger than recommended (60)
- Latency is high but recall gain over top-100 is negligible
- No diminishing-returns analysis for candidate pool size

**Why Harmful:** Retrieving more candidates increases latency for both paths and the fusion step. The marginal recall gain beyond top-100 per path is typically <1% for most search applications. The latency cost is paid on every query.

**Consequences:**
- 2-10× higher latency than necessary
- Increased database or search engine load
- Higher memory usage for candidate processing
- Minimal recall improvement

**Alternative:** Cap candidate retrieval at top-100 per path. Use RRF with k=60 for fusion. Benchmark if larger pools are needed.

**Refactoring Strategy:**
1. Reduce candidate pool size to 100 per path
2. Benchmark recall against current pool size
3. If recall drops, incrementally increase and re-benchmark
4. Document optimal pool size
5. Monitor for recall regression

**Detection Checklist:**
- [ ] Is candidate pool size ≤ 100 per path?
- [ ] Was there a diminishing-returns benchmark?
- [ ] Is recall acceptable at current pool size?
- [ ] Is pool size configurable without code changes?

**Related Rules/Skills/Trees:**
- Rule: Limit Candidate Pool Size (`05-rules.md:105-135`)

---

## 4. Unmonitored Fusion Balance

**Category:** Maintainability

**Description:** Deploying hybrid search without monitoring each retrieval path's contribution to the final fused results, allowing silent degradation of one path to go undetected.

**Why It Happens:** Teams implement hybrid search and verify it works at launch. Over time, changes to the keyword index (stop words, stemming, scoring) or vector index (model upgrade, data distribution shift) can unbalance the fusion. Without monitoring, this shift is invisible.

**Warning Signs:**
- No monitoring of keyword vs vector contribution to fused results
- One path dominates fused results (e.g., 95% from vector)
- Search quality declined but path contribution not checked
- Infrastructure changes (model upgrade, re-indexing) had no monitoring
- Fusion balance never verified after initial launch

**Why Harmful:** If one retrieval path becomes dominant, the other path becomes dead weight — contributing latency but no value. A keyword path that never contributes means the hybrid search is effectively vector-only with doubled latency. An unbalanced fusion indicates the fusion parameters may need adjustment.

**Consequences:**
- One path becomes effectively unused
- Latency doubled without benefit from second path
- Degraded quality from unbalanced fusion
- Wasted infrastructure resources
- Missing early warning signs of path quality degradation

**Alternative:** Monitor the percentage of fused results contributed by each path. Alert if one path contributes <10% or >90%.

**Refactoring Strategy:**
1. Add monitoring that tracks origin (keyword vs vector) of fused results
2. Calculate contribution ratio per query
3. Set up alerts for imbalance (<10% or >90%)
4. Log trends over time
5. Investigate imbalance when triggered

**Detection Checklist:**
- [ ] Is keyword vs vector contribution monitored?
- [ ] Are alerts configured for fusion imbalance?
- [ ] Is fusion balance reviewed after infrastructure changes?
- [ ] Is there a process to re-tune fusion when imbalance is detected?

**Related Rules/Skills/Trees:**
- Rule: Monitor Fusion Balance (`05-rules.md:137-166`)

---

## 5. Complex Fusion Strategy Before RRF Baseline

**Category:** Design

**Description:** Implementing weighted scoring, cross-encoders, or learned fusion models as the first hybrid search approach, before establishing a simple RRF baseline.

**Why It Happens:** Advanced fusion methods promise higher quality. Teams invest in complex approaches before knowing whether simple RRF is sufficient for their use case.

**Warning Signs:**
- First hybrid implementation uses weighted scoring or cross-encoder
- No RRF baseline exists for comparison
- Implementation effort is high (training data, model serving)
- Latency is high from complex fusion
- Quality improvement over "no fusion" is unquantified

**Why Harmful:** RRF requires no training, no score normalization, and no tuning. It provides robust fusion with minimal implementation effort. Complex approaches (cross-encoders, learned fusion) add significant latency and infrastructure without proven improvement over RRF for most applications.

**Consequences:**
- Premature infrastructure investment (model serving for cross-encoder)
- Higher latency than RRF
- Maintenance burden of complex fusion pipeline
- May perform worse than RRF without proper tuning

**Alternative:** Start with RRF fusion (k=60). Benchmark quality. Only implement complex fusion if RRF is insufficient.

**Refactoring Strategy:**
1. Replace complex fusion with RRF
2. Benchmark recall against previous approach
3. If RRF is sufficient, keep it
4. If not, evaluate specific improvements needed

**Detection Checklist:**
- [ ] Is RRF the first hybrid approach tried?
- [ ] Was RRF benchmarked before complex fusion?
- [ ] Is the improvement of complex over RRF quantified?
- [ ] Is the fusion complexity justified by quality data?

**Related Rules/Skills/Trees:**
- Rule: Start with RRF Fusion (`05-rules.md:40-70`)

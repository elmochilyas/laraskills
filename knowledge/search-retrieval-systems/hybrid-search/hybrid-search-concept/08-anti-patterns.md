| Metadata | |
|---|---|
| Knowledge Unit ID | ku-01 |
| Subdomain | hybrid-search |
| Topic | Hybrid Search Concept |
| Source | Academic / Industry |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-HSC-01 | Fusion as Band-Aid for Poor Retrieval | Design |
| AP-HSC-02 | Sequential Query Execution | Performance |
| AP-HSC-03 | Unlimited Candidate Pooling | Performance |
| AP-HSC-04 | Unnormalized Score-Based Fusion | Architecture |
| AP-HSC-05 | Ignoring Individual Path Quality | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-01: Deploying vector search without establishing a keyword baseline (`hybrid-search-concept/04-standardized-knowledge.md:37`)
- RAP-SEARCH-02: Skipping parallel retrieval in multi-path search (`hybrid-search-concept/05-rules.md:41`)
- RAP-SEARCH-03: Missing graceful degradation for partial search path failures (`hybrid-search-concept/05-rules.md:108`)

---

### AP-HSC-01: Fusion as Band-Aid for Poor Retrieval

**Category:** Design

**Description:** Relying on hybrid fusion to compensate for poor individual retrieval path quality instead of fixing each path independently.

**Why It Happens:** Teams assume fusion automatically improves results without validating each path’s baseline recall. Hype around hybrid search leads to skipping fundamental optimization.

**Warning Signs:**
- Individual path recall metrics never measured
- Fusion added before single-path baselines established
- Hybrid results still poor; team adjusting fusion parameters endlessly

**Why Harmful:** Fusion cannot fix fundamentally broken retrieval. Poor keyword indexing or bad embeddings will still produce poor hybrid results, wasting infrastructure cost.

**Consequences:**
- Unnecessary dual-infrastructure cost
- Debugging fusion when the real problem is a single path
- False conclusion that hybrid "doesn't work"

**Alternative:** Benchmark each retrieval path individually before enabling fusion. Fix path-level issues first.

**Refactoring Strategy:**
1. Instrument each path separately with recall/NDCG metrics
2. Fix keyword path (stop words, stemming, indexing) until baseline is acceptable
3. Fix vector path (embedding model, chunking, index type) until baseline is acceptable
4. Only then enable fusion and measure improvement

**Detection Checklist:**
- [ ] Keyword-only recall documented
- [ ] Vector-only recall documented
- [ ] Fusion improvement measured against both baselines

**Related Rules/Skills/Trees:**
- Rule: Start with Keyword Search Before Adding Vector (`hybrid-search-concept/05-rules.md:1`)
- Rule: Benchmark Weighted Fusion Against RRF (`keyword-vector-fusion/05-rules.md:74`)
- Decision Tree: Hybrid Search Fusion Strategy (`hybrid-search-concept/07-decision-trees.md:20`)

---

### AP-HSC-02: Sequential Query Execution

**Category:** Performance

**Description:** Running keyword and vector search queries sequentially rather than concurrently, doubling the effective latency.

**Why It Happens:** Simple linear code is the natural first implementation. Developers don't consider parallelism until latency becomes a problem.

**Warning Signs:**
- Hybrid search latency = keyword_latency + vector_latency
- No async/await or concurrent execution patterns in search code
- Fusion function waits for each path result one after another

**Why Harmful:** Hybrid latency should be max(keyword, vector) + fusion, not keyword + vector + fusion. Sequential execution doubles user-facing response times.

**Consequences:**
- Poor user experience (slow search results)
- Lower conversion rates in e-commerce
- Timeout errors under load

**Alternative:** Always execute both retrieval paths concurrently using async/await, `Http::pool()`, or `\Illuminate\Support\Facades\Bus::batch()`.

**Refactoring Strategy:**
1. Identify sequential keyword and vector calls in search service
2. Wrap each in async closure or queued job
3. Use `await()` or `Promise` utility to run concurrently
4. Wait for both to complete before fusion
5. Verify new latency ≈ max(path1, path2) + fusion

**Detection Checklist:**
- [ ] Search service code inspected for sequential calls
- [ ] Latency benchmark confirms concurrent execution
- [ ] Async infrastructure (queue, swoole, etc.) available

**Related Rules/Skills/Trees:**
- Rule: Parallelize Keyword and Vector Retrieval (`hybrid-search-concept/05-rules.md:36`)
- Rule: Parallelize Application-Level Retrieval (`laravel-hybrid-implementation/05-rules.md:37`)
- Decision Tree: Hybrid Search Fusion Strategy (`hybrid-search-concept/07-decision-trees.md:20`)

---

### AP-HSC-03: Unlimited Candidate Pooling

**Category:** Performance

**Description:** Retrieving and fusing very large candidate sets (top-1000+) from each path, causing unnecessary computation and memory overhead.

**Why It Happens:** Assumption that more candidates always means better recall. Lack of awareness about diminishing returns beyond top-100.

**Warning Signs:**
- `take(1000)` or higher in search queries
- Fusion processing thousands of candidates per request
- High memory usage in fusion step

**Why Harmful:** Diminishing recall returns beyond top-100 candidates, while computation time and memory usage increase linearly. Wastes server resources.

**Consequences:**
- Increased latency (proportional to pool size)
- Higher memory usage per request
- Reduced throughput under concurrent load

**Alternative:** Cap candidate pool at top-100 per path. Only fuse top-20 for final results.

**Refactoring Strategy:**
1. Set path retrieval limit to `take(100)` or equivalent
2. Configure fusion to produce top-20 final results
3. Benchmark recall at top-100 vs top-1000; verify minimal difference
4. If recall loss is unacceptable, increase pool gradually while monitoring latency

**Detection Checklist:**
- [ ] Candidate pool size configured (not default unlimited)
- [ ] Fusion final result count specified
- [ ] Latency vs recall tradeoff documented

**Related Rules/Skills/Trees:**
- Rule: Cap Candidate Pool at Top-100 Per Path (`hybrid-search-concept/05-rules.md:71`)
- Rule: Test α in 0.3-0.7 Range (`keyword-vector-fusion/05-rules.md:108`)

---

### AP-HSC-04: Unnormalized Score-Based Fusion

**Category:** Architecture

**Description:** Using raw scores from different search engines in weighted fusion without normalization, causing one path to dominate results.

**Why It Happens:** Developers assume scores are on comparable scales. Different engines (Meilisearch, pgvector, Qdrant) produce scores on vastly different ranges.

**Warning Signs:**
- Raw scores used directly in weighted sum: `α * scoreA + (1-α) * scoreB`
- One path consistently provides all top results regardless of query
- Fusion dominance correlates with score scale, not relevance

**Why Harmful:** Weighted fusion produces meaningless results. Tuning α has no effect because one path's score range overwhelms the other. Users see results dominated by one retrieval method.

**Consequences:**
- Hybrid search effectively reduces to single-path search
- Wasted investment in second retrieval path
- False conclusions about fusion strategy effectiveness

**Alternative:** Use RRF (rank-based, no normalization) or apply min-max/softmax normalization before weighted fusion.

**Refactoring Strategy:**
1. Switch to RRF fusion (rank-based, no scores needed)
2. If weighted fusion is required, implement min-max normalization per path
3. Verify both paths contribute to top results after normalization
4. Benchmark normalized vs RRF to confirm weighted adds value

**Detection Checklist:**
- [ ] Fusion method uses ranks or normalized scores
- [ ] Both paths contribute to top-10 results
- [ ] Normalization function tested with realistic score ranges

**Related Rules/Skills/Trees:**
- Rule: Always Normalize Scores Before Weighted Fusion (`keyword-vector-fusion/05-rules.md:36`)
- Rule: Start with RRF Before Weighted Fusion (`keyword-vector-fusion/05-rules.md:1`)
- Skill: Configure and Implement Hybrid Search Concept (`hybrid-search-concept/06-skills.md:1`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`hybrid-search-concept/07-decision-trees.md:74`)

---

### AP-HSC-05: Ignoring Individual Path Quality

**Category:** Testing

**Description:** Deploying hybrid search without monitoring each retrieval path's contribution and quality over time.

**Why It Happens:** Focus on the combined result. Assumption that as long as users see results, both paths are working.

**Warning Signs:**
- No per-path latency or error rate monitoring
- Fusion balance not tracked (percentage of results from each path)
- Individual path degradation goes undetected until fusion quality visibly drops

**Why Harmful:** One path can silently degrade (embedding API timeout, index corruption, keyword engine config drift) while fusion masks the symptom. Quality erodes gradually without alerting.

**Consequences:**
- Unnoticed regression in search quality
- One path doing all the work (paying for unused infrastructure)
- Difficult root-cause analysis when quality drops

**Alternative:** Monitor per-path metrics (latency, error rate, contribution percentage to fused results) and alert on anomalies.

**Refactoring Strategy:**
1. Add instrumentation to each retrieval path (latency, error count, result count)
2. Compute per-query fusion balance (% of top-10 from keyword vs vector)
3. Set up monitoring dashboard aggregating these metrics
4. Configure alerts for path degradation (latency spike, zero results, 90% dominance)
5. Include fusion balance in search quality scorecards

**Detection Checklist:**
- [ ] Per-path latency monitoring active
- [ ] Per-path error rate monitoring active
- [ ] Fusion balance metric tracked and visible
- [ ] Alerts configured for path degradation

**Related Rules/Skills/Trees:**
- Rule: Implement Graceful Degradation for Path Failures (`hybrid-search-concept/05-rules.md:103`)
- Skill: Optimize and Monitor Hybrid Search Concept Production Search (`hybrid-search-concept/06-skills.md:81`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`hybrid-search-concept/07-decision-trees.md:129`)

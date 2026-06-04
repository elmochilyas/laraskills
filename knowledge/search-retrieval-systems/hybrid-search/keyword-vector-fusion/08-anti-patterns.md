| Metadata | |
|---|---|
| Knowledge Unit ID | ku-02 |
| Subdomain | hybrid-search |
| Topic | Keyword-Vector Fusion |
| Source | Academic / Industry |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-KVF-01 | Jumping to Weighted Fusion Without RRF Baseline | Design |
| AP-KVF-02 | Score-Based Fusion Without Normalization | Performance |
| AP-KVF-03 | Deploying Complex Fusion Without Benchmarking | Testing |
| AP-KVF-04 | One-Size-Fits-All Alpha Parameter | Performance |
| AP-KVF-05 | Ignoring Empty Path Results | Reliability |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-01: Deploying vector search without establishing a keyword baseline (`hybrid-search-concept/04-standardized-knowledge.md:37`)
- RAP-SEARCH-02: Skipping parallel retrieval in multi-path search (`hybrid-search-concept/05-rules.md:41`)
- RAP-SEARCH-04: Using raw scores without score normalization across different engines (`keyword-vector-fusion/04-standardized-knowledge.md:68`)

---

### AP-KVF-01: Jumping to Weighted Fusion Without RRF Baseline

**Category:** Design

**Description:** Implementing complex weighted score fusion (with normalization, α tuning) before trying the simpler Reciprocal Rank Fusion approach.

**Why It Happens:** Teams over-engineer fusion assuming weighted gives better control. RRF is perceived as "too simple" to be effective despite evidence it performs well across domains.

**Warning Signs:**
- Complex normalization and weighting logic in first implementation
- No RRF implementation exists in codebase
- Developer cannot articulate why RRF was rejected

**Why Harmful:** RRF requires no tuning, no score normalization, and works immediately. Weighted fusion adds brittleness (normalization edge cases, α tuning) without guaranteed improvement.

**Consequences:**
- Months spent tuning α with marginal quality gains
- Normalization bugs causing one path to dominate
- Higher maintenance burden for no measurable benefit

**Alternative:** Implement RRF first as default. Switch to weighted fusion only if benchmarks show statistically significant quality improvement.

**Refactoring Strategy:**
1. Implement RRF: `score = sum(1/(k + rank))` across result sets
2. Set k=60, fuse top-20 from top-100 per path
3. Benchmark NDCG/MRR against existing weighted implementation
4. If weighted does not significantly outperform RRF, remove weighted code
5. If weighted outperforms, document the improvement metric as justification

**Detection Checklist:**
- [ ] RRF implementation exists and is benchmarked
- [ ] Justification documented for using weighted over RRF
- [ ] No normalization code without corresponding RRF baseline

**Related Rules/Skills/Trees:**
- Rule: Start with RRF Before Weighted Fusion (`keyword-vector-fusion/05-rules.md:1`)
- Rule: Benchmark Weighted Fusion Against RRF (`keyword-vector-fusion/05-rules.md:74`)
- Decision Tree: Hybrid Search Fusion Strategy (`keyword-vector-fusion/07-decision-trees.md:20`)

---

### AP-KVF-02: Score-Based Fusion Without Normalization

**Category:** Performance

**Description:** Combining keyword and vector scores using a weighted sum without normalizing scoring scales, causing one path to dominate.

**Why It Happens:** Different search engines return scores on different scales (Meilisearch BM25 scores vs cosine similarity vs pgvector distance). Developers assume scores are comparable.

**Warning Signs:**
- `α * $scoreA + (1-α) * $scoreB` without normalization
- Top results consistently from one retrieval path
- Changing α has no visible effect on rankings

**Why Harmful:** Weighted fusion becomes meaningless. One path's score scale dominates regardless of actual relevance, effectively defeating the purpose of hybrid search.

**Consequences:**
- Hybrid search degrades to single-path search
- Investment in second retrieval path wasted
- False conclusions about fusion effectiveness

**Alternative:** Use RRF (rank-based, no normalization) or normalize scores to [0,1] before weighted fusion.

**Refactoring Strategy:**
1. Identify all weighted fusion points in codebase
2. Switch to RRF fusion (score = sum(1/(k + rank)))
3. If weighted fusion is required, add min-max normalization per score array
4. Verify both paths contribute to top-10 results after fix
5. Remove unnormalized fusion code

**Detection Checklist:**
- [ ] All fusion points use RRF or normalized scores
- [ ] Both paths contribute to top-10 across test queries
- [ ] Normalization handles edge cases (single result, equal scores)

**Related Rules/Skills/Trees:**
- Rule: Always Normalize Scores Before Weighted Fusion (`keyword-vector-fusion/05-rules.md:36`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`keyword-vector-fusion/07-decision-trees.md:74`)

---

### AP-KVF-03: Deploying Complex Fusion Without Benchmarking

**Category:** Testing

**Description:** Shipping weighted fusion or cross-encoder re-ranking without benchmarking against a simple RRF baseline.

**Why It Happens:** Pressure to deliver "advanced" search features. Teams assume more complex fusion equals better results.

**Warning Signs:**
- No benchmark results comparing current fusion to RRF
- Fusion strategy changed without documented quality metrics
- Team cannot quantify improvement from fusion complexity

**Why Harmful:** Complex fusion systems (normalization, α tuning, cross-encoder calls) add latency, cost, and maintenance burden. If they perform equally to RRF, the complexity is unjustified.

**Consequences:**
- Higher latency (cross-encoder adds 50-200ms)
- Higher infrastructure costs (cross-encoder API calls)
- Debugging complexity when fusion behaves unexpectedly

**Alternative:** Always establish an RRF baseline before deploying alternative fusion strategies. Require documented quality improvement to justify added complexity.

**Refactoring Strategy:**
1. Implement RRF baseline in test harness
2. Run benchmark suite comparing current fusion to RRF baseline
3. If current fusion does not statistically outperform RRF, replace with RRF
4. If current fusion outperforms, document improvement metrics in runbook
5. Add benchmark to CI to prevent regression

**Detection Checklist:**
- [ ] RRF baseline benchmark results documented
- [ ] Current fusion strategy justified with metrics
- [ ] CI benchmark prevents undetected regression

**Related Rules/Skills/Trees:**
- Rule: Benchmark Weighted Fusion Against RRF (`keyword-vector-fusion/05-rules.md:74`)
- Rule: Test α in 0.3-0.7 Range (`keyword-vector-fusion/05-rules.md:108`)
- Skill: Optimize and Monitor Keyword Vector Fusion Production Search (`keyword-vector-fusion/06-skills.md:81`)
- Decision Tree: Built-in vs Custom Hybrid Implementation (`keyword-vector-fusion/07-decision-trees.md:129`)

---

### AP-KVF-04: One-Size-Fits-All Alpha Parameter

**Category:** Performance

**Description:** Using a single, untuned α value for weighted fusion across all query types, ignoring that different queries need different keyword-vector balances.

**Why It Happens:** Default α=0.5 is easy to set. Teams lack query classification or A/B testing infrastructure to optimize per query type.

**Warning Signs:**
- Single α value used for all queries
- α set to 0.5 without testing other values
- No query-type-aware routing or weighting logic

**Why Harmful:** Factual queries (product SKU, exact name) need keyword-heavy weighting; conceptual queries need vector-heavy weighting. A single α underperforms for both categories.

**Consequences:**
- Suboptimal recall for both query types
- Missed revenue from product searches that don't find exact matches
- Poor user satisfaction for conceptual searches

**Alternative:** Classify queries by type and use different α values, or use RRF (which handles both well without tuning).

**Refactoring Strategy:**
1. Implement RRF first (no α needed, works for both query types)
2. If weighted fusion is still desired, classify queries via simple heuristics (word count, presence of quotes, product SKU pattern)
3. Test α in [0.3, 0.5, 0.7] per query class
4. Deploy query-class-specific α routing if measurable improvement over RRF

**Detection Checklist:**
- [ ] α tested across minimum 3 values per query class
- [ ] Query classification logic documented
- [ ] Improvement over RRF quantified

**Related Rules/Skills/Trees:**
- Rule: Test α in 0.3-0.7 Range (`keyword-vector-fusion/05-rules.md:108`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`keyword-vector-fusion/07-decision-trees.md:74`)

---

### AP-KVF-05: Ignoring Empty Path Results

**Category:** Reliability

**Description:** Fusion logic crashing or producing empty results when one retrieval path returns zero documents.

**Why It Happens:** Code assumes both paths always return results. Error handling focuses on connection failures, not empty result sets.

**Warning Signs:**
- Fusion function throws exception when one result array is empty
- Hybrid search returns zero results when only one path has results
- No fallback to single-path results on partial failure

**Why Harmful:** A single path returning no results (new index, filter mismatch, temporary outage) causes the entire search to fail or return nothing, despite the other path having valid results.

**Consequences:**
- Complete search outage when one path silently returns zero results
- Poor user experience for filtered searches where one index has no matches
- Hard-to-debug "search returned nothing" reports

**Alternative:** Handle empty result arrays in fusion: if one path empty, return the other path's results directly (with RRF score adjustment if needed).

**Refactoring Strategy:**
1. Add empty array checks before fusion logic
2. If keyword results empty, return vector results directly (and vice versa)
3. If both empty, return empty (no fallback available)
4. Log when a path returns empty for monitoring
5. Test fusion with empty keyword, empty vector, and both empty scenarios

**Detection Checklist:**
- [ ] Fusion handles one empty path gracefully
- [ ] Fusion handles both empty paths gracefully
- [ ] Monitoring alerts when a path consistently returns empty

**Related Rules/Skills/Trees:**
- Rule: Implement Graceful Degradation for Path Failures (`hybrid-search-concept/05-rules.md:103`)
- Skill: Configure and Implement Keyword Vector Fusion (`keyword-vector-fusion/06-skills.md:1`)

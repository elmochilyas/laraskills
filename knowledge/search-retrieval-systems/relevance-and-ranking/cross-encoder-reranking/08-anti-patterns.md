| Metadata | |
|---|---|
| KU ID | K062 |
| Subdomain | relevance-and-ranking |
| Topic | Cross-Encoder Re-Ranking |
| Source | Academic / ML |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-CER-01 | Re-Ranking Entire Document Collection | Performance |
| AP-CER-02 | No Fallback When Cross-Encoder Fails | Reliability |
| AP-CER-03 | Deploying Without Measuring NDCG Improvement | Testing |
| AP-CER-04 | Re-Ranking Too Few Candidates | Design |
| AP-CER-05 | Using Cross-Encoder for Latency-Sensitive Apps | Design |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-10: Adding latency and cost without measuring improvement over baseline (`cross-encoder-reranking/04-standardized-knowledge.md:39`)
- RAP-SEARCH-03: Missing graceful degradation for search path failures (`hybrid-search-concept/05-rules.md:108`)

---

### AP-CER-01: Re-Ranking Entire Document Collection

**Category:** Performance

**Description:** Passing the entire searchable document collection (or very large candidate sets) to a cross-encoder for re-ranking, causing unacceptable latency and cost.

**Why It Happens:** Not implementing a two-stage pipeline. Developers assume cross-encoder can be used as a first-pass retriever.

**Warning Signs:**
- Cross-encoder API called with thousands of documents per query
- Re-ranking latency exceeds 1 second
- API costs are unexpectedly high
- Timeout errors on search queries

**Why Harmful:** Cross-encoders are O(n) in the number of candidates (each query-doc pair is scored independently). Re-ranking 10K documents at 50ms each = 500 seconds. This is computationally prohibitive.

**Consequences:**
- Search latency unacceptably high
- API costs exceeding budgets
- Timeout errors for users

**Alternative:** Always use a two-stage pipeline: fast first-pass retrieval (ANN) returns top-50 candidates, cross-encoder re-ranks only those 50 candidates.

**Refactoring Strategy:**
1. Implement first-pass ANN retrieval with top-K limit (50 recommended)
2. Pass only the top-50 candidates to cross-encoder
3. Cross-encoder scores and re-orders the 50 candidates
4. Return top-10 from re-ranked results
5. Benchmark latency: should be 50-250ms total

**Detection Checklist:**
- [ ] Two-stage pipeline implemented (retrieval + re-ranking)
- [ ] Cross-encoder receives ≤ 100 candidates
- [ ] Latency within acceptable range (< 300ms total)
- [ ] API cost per query tracked and acceptable

**Related Rules/Skills/Trees:**
- Rule: Use Two-Stage Pipeline: Retrieve 50, Re-Rank 10 (`cross-encoder-reranking/05-rules.md:1`)
- Decision Tree: Cross-Encoder Reranking Strategy (`cross-encoder-reranking/07-decision-trees.md:135`)

---

### AP-CER-02: No Fallback When Cross-Encoder Fails

**Category:** Reliability

**Description:** Failing the entire search query when the cross-encoder is unavailable (API timeout, model OOM, network error), instead of falling back to the first-pass ANN ranking.

**Why It Happens:** Error handling focuses on the cross-encoder step. Developers don't consider that ANN results are still valid without re-ranking.

**Warning Signs:**
- Cross-encoder failure causes 500 error or empty results
- Try-catch around cross-encoder call returns error response
- No `catch` block that returns ANN results as fallback

**Why Harmful:** Cross-encoders (especially API-based like Cohere) can fail due to network issues, rate limiting, or model errors. Without fallback, the entire search pipeline fails, even though first-pass results are available.

**Consequences:**
- Complete search outage during cross-encoder incident
- Users seeing errors instead of results
- Emergency rollback required

**Alternative:** Implement fallback to first-pass ANN ranking when cross-encoder is unavailable. Log the failure for monitoring.

**Refactoring Strategy:**
1. Wrap cross-encoder call in try-catch
2. In catch block: log warning, return ANN-ranked candidates
3. Ensure ANN results are stored before cross-encoder call
4. Test by simulating cross-encoder failure
5. Add monitoring alert for cross-encoder failure rate

**Detection Checklist:**
- [ ] Fallback to ANN order implemented
- [ ] No 500 error when cross-encoder fails
- [ ] Users see ANN-ranked results during failure
- [ ] Cross-encoder failure rate monitored

**Related Rules/Skills/Trees:**
- Rule: Implement Fallback to ANN Order (`cross-encoder-reranking/05-rules.md:36`)
- Rule: Implement Graceful Degradation for Path Failures (`hybrid-search-concept/05-rules.md:103`)

---

### AP-CER-03: Deploying Without Measuring NDCG Improvement

**Category:** Testing

**Description:** Deploying cross-encoder re-ranking to production without measuring NDCG or MAP improvement over the ANN-only baseline.

**Why It Happens:** Assumption that cross-encoders always improve relevance. Team skips benchmarking due to lack of test set or evaluation infrastructure.

**Warning Signs:**
- Cross-encoder deployed without offline benchmark
- No NDCG/MAP metrics comparing ANN vs re-ranked results
- Team cannot quantify how much re-ranking improves search

**Why Harmful:** Cross-encoders add 50-250ms latency and ongoing API costs (Cohere: $0.50-1.00 per 1K queries). If improvement is marginal, the cost/latency tradeoff may not be justified.

**Consequences:**
- Higher latency without measurable quality improvement
- Unnecessary API costs
- Wrong investment decision (could spend on other improvements)

**Alternative:** Benchmark NDCG@10 improvement of cross-encoder over ANN baseline before deploying.

**Refactoring Strategy:**
1. Build test set of 100-500 queries with relevance judgments
2. Run ANN-only baseline, measure NDCG@10
3. Run cross-encoder re-ranking, measure NDCG@10
4. If improvement < 3% NDCG@10, consider not deploying
5. If improvement ≥ 3%, deploy with documented justification
6. Re-benchmark periodically to detect regression

**Detection Checklist:**
- [ ] Test set with relevance judgments exists
- [ ] ANN-only NDCG baseline documented
- [ ] Cross-encoder NDCG improvement quantified
- [ ] Deployment decision based on benchmark results
- [ ] Cost-benefit analysis documented

**Related Rules/Skills/Trees:**
- Rule: Benchmark NDCG Improvement Before Deploying (`cross-encoder-reranking/05-rules.md:71`)
- Decision Tree: Cross-Encoder Reranking Strategy (`cross-encoder-reranking/07-decision-trees.md:135`)

---

### AP-CER-04: Re-Ranking Too Few Candidates

**Category:** Design

**Description:** Retrieving only top-5 or top-10 candidates from first-pass ANN before cross-encoder re-ranking, missing relevant documents outside the initial small pool.

**Why It Happens:** Tradeoff awareness but too conservative. Teams limit candidate pool to minimize latency without evaluating recall impact.

**Warning Signs:**
- ANN retrieves only top-5 candidates
- Cross-encoder re-ranks only 5 candidates
- Relevant documents beyond top-5 are never seen by cross-encoder

**Why Harmful:** Cross-encoder quality is limited by the candidate pool. If the first-pass retrieval misses relevant documents in the top-5, the cross-encoder never gets a chance to rank them highly. Small pools waste the cross-encoder's potential.

**Consequences:**
- Missed relevant results despite cross-encoder capability
- Little improvement over ANN-only (both limited to same candidates)
- Investment in cross-encoder not fully utilized

**Alternative:** Retrieve top-50 candidates from first-pass ANN. This gives cross-encoder sufficient candidates to meaningfully re-order.

**Refactoring Strategy:**
1. Increase first-pass ANN retrieval to top-50
2. Pass top-50 to cross-encoder
3. Return top-10 from re-ranked results
4. Benchmark NDCG for pool sizes 10, 20, 50, 100
5. Choose pool size where NDCG improvement plateaus
6. Document pool size decision

**Detection Checklist:**
- [ ] Candidate pool size ≥ 50 (or validated alternative)
- [ ] NDCG improvement measured for chosen pool size
- [ ] Recall at chosen pool size documented
- [ ] Pool size not limiting cross-encoder effectiveness

**Related Rules/Skills/Trees:**
- Rule: Use Two-Stage Pipeline: Retrieve 50, Re-Rank 10 (`cross-encoder-reranking/05-rules.md:1`)
- Decision Tree: Cross-Encoder Reranking Strategy (`cross-encoder-reranking/07-decision-trees.md:135`)

---

### AP-CER-05: Using Cross-Encoder for Latency-Sensitive Apps

**Category:** Design

**Description:** Implementing cross-encoder re-ranking in applications where total search latency must stay under 100ms, ignoring the inherent 50-250ms overhead re-ranking adds.

**Why It Happens:** Prioritizing relevance over all other requirements. Not accounting for total pipeline latency including network calls.

**Warning Signs:**
- P99 search latency exceeds 500ms after adding cross-encoder
- Search feels slow to users (perceptible delay)
- Business requires <100ms search but cross-encoder takes 200ms

**Why Harmful:** Cross-encoder re-ranking adds unavoidable latency (even with GPU inference). For latency-sensitive apps (e-commerce search, autocomplete), users abandon slow searches.

**Consequences:**
- User abandonment due to slow search
- Revenue loss from slow e-commerce search
- Need to remove feature after deployment

**Alternative:** Use bi-encoder (embedding similarity) with optional late interaction (ColBERT) for faster but still improved relevance.

**Refactoring Strategy:**
1. Measure current P50/P95/P99 latency
2. Add cross-encoder latency estimate (50-250ms)
3. If total exceeds latency budget, remove cross-encoder
4. Consider alternatives: optimized bi-encoder, HNSW indexing, caching
5. If cross-encoder must be used, reduce candidate pool to 10-20 and accept lower quality
6. Document latency vs relevance tradeoff

**Detection Checklist:**
- [ ] Total search latency meets business requirements
- [ ] Cross-encoder overhead within latency budget
- [ ] Alternative relevance improvements evaluated
- [ ] Tradeoff between relevance gain and latency cost documented

**Related Rules/Skills/Trees:**
- Rule: Use Two-Stage Pipeline: Retrieve 50, Re-Rank 10 (`cross-encoder-reranking/05-rules.md:1`)
- Decision Tree: Cross-Encoder Reranking Strategy (`cross-encoder-reranking/07-decision-trees.md:135`)

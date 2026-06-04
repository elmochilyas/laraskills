| Metadata | |
|---|---|
| KU ID | K054 |
| Subdomain | relevance-and-ranking |
| Topic | Qdrant Re-Ranking with Cross-Encoders |
| Source | Qdrant Docs |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-QCR-01 | No Oversampling Before Re-Ranking | Performance |
| AP-QCR-02 | No ANN Fallback When Re-Ranker Fails | Reliability |
| AP-QCR-03 | Not Caching Frequent Re-Ranker Results | Performance |
| AP-QCR-04 | Re-Ranking Too Many Candidates | Performance |
| AP-QCR-05 | Deploying Re-Ranking Without Accuracy Benchmark | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-10: Adding latency and cost without measuring improvement over baseline (`cross-encoder-reranking/04-standardized-knowledge.md:39`)
- RAP-SEARCH-03: Missing graceful degradation for search path failures (`hybrid-search-concept/05-rules.md:108`)

---

### AP-QCR-01: No Oversampling Before Re-Ranking

**Category:** Performance

**Description:** Retrieving only the final count (e.g., 10 results) from ANN before cross-encoder re-ranking, leaving no room for re-ranking to improve rankings.

**Why It Happens:** Not understanding that re-ranking reorders a pool — a pool of exactly N results produces the same output as input.

**Warning Signs:**
- ANN `limit` equals final result count
- Re-ranking produces identical order as ANN
- Cross-encoder added but no improvement observed

**Why Harmful:** Cross-encoder re-ranking can only reorder the candidates it receives. A pool of 10 means the top-10 are already chosen by ANN — re-ranking can only reorder these 10, not find better ones outside.

**Consequences:**
- Cross-encoder investment wasted
- No quality improvement
- Latency added for no benefit

**Alternative:** Oversample 2-5x: retrieve 50 candidates, re-rank to final 10.

**Refactoring Strategy:**
1. Set ANN `limit` to 50
2. Cross-encoder re-ranks 50 candidates
3. Return top-10 from re-ranked results
4. Benchmark NDCG vs no-oversample approach

**Detection Checklist:**
- [ ] Oversampling factor ≥ 2x
- [ ] ANN retrieves more than final count
- [ ] Re-ranking has candidates to reorder
- [ ] NDCG improvement from re-ranking demonstrable

**Related Rules/Skills/Trees:**
- Rule: Oversample 2-5x for Re-Ranking Quality (`qdrant-cross-encoder-reranking/05-rules.md:1`)
- Decision Tree: Cross-Encoder Reranking Strategy (`qdrant-cross-encoder-reranking/07-decision-trees.md:135`)

---

### AP-QCR-02: No ANN Fallback When Re-Ranker Fails

**Category:** Reliability

**Description:** Failing the entire search query when the cross-encoder re-ranker is unavailable.

**Why It Happens:** No error handling for re-ranking failures. ANN results not preserved as fallback.

**Warning Signs:**
- Cross-encoder failure causes 500 error
- No try-catch around re-ranking step
- ANN results computed but not used if re-ranker fails

**Why Harmful:** Cross-encoders (Cohere API, local models) can fail due to network, rate limits, or OOM. Without fallback, search is completely broken.

**Consequences:**
- Complete search outage during re-ranker incident
- Users see error pages
- Emergency rollback needed

**Alternative:** Catch re-ranker failures and return ANN results instead.

**Refactoring Strategy:**
1. Store ANN results before re-ranking
2. Wrap re-ranking in try-catch
3. In catch: return ANN results (log warning)
4. Monitor re-ranker failure rate

**Detection Checklist:**
- [ ] ANN fallback implemented
- [ ] No 500 error on re-ranker failure
- [ ] Users see results during re-ranker outage
- [ ] Re-ranker failure rate monitored

**Related Rules/Skills/Trees:**
- Rule: Implement ANN Fallback for Re-Ranking (`qdrant-cross-encoder-reranking/05-rules.md:35`)
- Rule: Implement Fallback to ANN Order (`cross-encoder-reranking/05-rules.md:36`)

---

### AP-QCR-03: Not Caching Frequent Re-Ranker Results

**Category:** Performance

**Description:** Re-ranking the same (query, candidate) pairs repeatedly without caching, wasting API calls or compute.

**Why It Happens:** Simple implementation without caching layer. Not considering query repetition patterns.

**Warning Signs:**
- Same query re-ranked every time it's searched
- Cross-encoder API calls repeat for identical queries
- Cache hit rate near zero

**Why Harmful:** Re-ranking is the most expensive part of the pipeline (50-200ms, API cost). Identical queries produce identical re-ranking results.

**Consequences:**
- Wasted API costs (Cohere: $0.50-1.00 per 1K queries)
- Unnecessary latency for repeated queries
- Higher server load

**Alternative:** Cache re-ranking results by query hash with appropriate TTL.

**Refactoring Strategy:**
1. Compute query hash as cache key
2. Check cache before re-ranking
3. Store re-ranked results in cache (TTL: 5-60 min based on content freshness)
4. Cache invalidation on index updates

**Detection Checklist:**
- [ ] Re-ranking cache implemented
- [ ] Cache hit rate monitored
- [ ] TTL appropriate for content freshness
- [ ] Cache invalidated on index changes

**Related Rules/Skills/Trees:**
- Rule: Cache Frequent Re-Ranker Results (`qdrant-cross-encoder-reranking/05-rules.md:72`)
- Skill: Optimize and Monitor Qdrant Cross Encoder Reranking Production Search (`qdrant-cross-encoder-reranking/06-skills.md:81`)

---

### AP-QCR-04: Re-Ranking Too Many Candidates

**Category:** Performance

**Description:** Passing very large candidate sets (1000+) to the cross-encoder for re-ranking, causing unacceptable latency.

**Why It Happens:** Maximizing recall assumption. Not accounting for cross-encoder's O(n) cost per candidate.

**Warning Signs:**
- 500+ candidates sent to cross-encoder
- Re-ranking latency > 1 second
- API costs very high
- Timeout errors

**Why Harmful:** Cross-encoder latency is proportional to candidate count. 1000 candidates at 50ms each = 50 seconds (even with batching, hundreds of milliseconds).

**Consequences:**
- Unacceptable search latency
- High API costs
- Timeout errors for users

**Alternative:** Limit candidate pool to 50-100 before re-ranking.

**Refactoring Strategy:**
1. Reduce ANN retrieval to top-50 (or validated alternative)
2. Configure re-ranker to process only this pool
3. Benchmark latency: target < 200ms re-ranking time
4. If higher quality needed, increase pool gradually (50 → 100 → 200)

**Detection Checklist:**
- [ ] Candidate pool ≤ 100 for re-ranking
- [ ] Re-ranking latency acceptable (< 200ms)
- [ ] API costs tracked per query
- [ ] Recall vs latency tradeoff documented

**Related Rules/Skills/Trees:**
- Rule: Oversample 2-5x for Re-Ranking Quality (`qdrant-cross-encoder-reranking/05-rules.md:1`)
- Decision Tree: Cross-Encoder Reranking Strategy (`qdrant-cross-encoder-reranking/07-decision-trees.md:135`)

---

### AP-QCR-05: Deploying Re-Ranking Without Accuracy Benchmark

**Category:** Testing

**Description:** Deploying Qdrant cross-encoder re-ranking without measuring NDCG/MAP improvement over ANN-only baseline.

**Why It Happens:** Assumption that cross-encoders always improve quality. No benchmark infrastructure.

**Warning Signs:**
- Re-ranking deployed but improvement unquantified
- No baseline NDCG metrics
- Cannot say how much re-ranking improves search

**Why Harmful:** Re-ranking adds latency and cost. If improvement over ANN is marginal, the investment isn't justified.

**Consequences:**
- Higher latency for minimal quality gain
- Unnecessary API costs
- Wrong investment decision

**Alternative:** Benchmark NDCG improvement before deployment.

**Refactoring Strategy:**
1. Create test query set with relevance judgments
2. Measure ANN-only NDCG@10
3. Measure re-ranked NDCG@10
4. Only deploy if improvement > 3% (or validated threshold)
5. Monitor NDCG in production

**Detection Checklist:**
- [ ] ANN-only NDCG baseline documented
- [ ] Re-ranked NDCG improvement quantified
- [ ] Deploy decision data-driven
- [ ] Production NDCG monitoring in place

**Related Rules/Skills/Trees:**
- Rule: Implement ANN Fallback for Re-Ranking (`qdrant-cross-encoder-reranking/05-rules.md:35`)
- Skill: Configure and Implement Qdrant Cross Encoder Reranking (`qdrant-cross-encoder-reranking/06-skills.md:1`)

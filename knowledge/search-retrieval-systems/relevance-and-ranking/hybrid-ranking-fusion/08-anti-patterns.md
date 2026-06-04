| Metadata | |
|---|---|
| KU ID | ku-03 |
| Subdomain | relevance-and-ranking |
| Topic | Hybrid Ranking Fusion |
| Source | Academic / Industry |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-HRF-01 | Choosing Complex Fusion Before RRF | Design |
| AP-HRF-02 | Fusing Without Individual Path Benchmarks | Testing |
| AP-HRF-03 | Unlimited Fusion Candidate Pool | Performance |
| AP-HRF-04 | Sequential Retrieval in Fusion Pipeline | Performance |
| AP-HRF-05 | Deploying Fusion Without Quality Validation | Testing |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-02: Skipping parallel retrieval in multi-path search (`hybrid-search-concept/05-rules.md:41`)
- RAP-SEARCH-04: Using raw scores without score normalization across different engines (`keyword-vector-fusion/04-standardized-knowledge.md:68`)

---

### AP-HRF-01: Choosing Complex Fusion Before RRF

**Category:** Design

**Description:** Implementing weighted fusion or cross-encoder re-ranking as the first fusion approach without trying RRF.

**Why It Happens:** Assumption that complex methods produce better results. Lack of awareness of RRF's effectiveness.

**Warning Signs:**
- Weighted fusion with normalization implemented as first hybrid approach
- Cross-encoder API integrated before trying RRF
- No RRF implementation exists in codebase

**Why Harmful:** RRF requires no tuning, no score normalization, and works immediately. Complex methods add development time and maintenance burden.

**Consequences:**
- Wasted effort on normalization and α tuning
- Higher latency from cross-encoder (50-200ms) when RRF (<1ms) would work
- Brittle normalization logic for weighted fusion

**Alternative:** Implement RRF first. Only add complexity if benchmarks show weighted fusion or cross-encoder provides measurable improvement.

**Refactoring Strategy:**
1. Implement RRF: `score = sum(1/(k + rank))`
2. Benchmark RRF quality
3. If quality acceptable, use RRF in production
4. If not, implement weighted fusion and benchmark against RRF

**Detection Checklist:**
- [ ] RRF implemented and benchmarked
- [ ] Complex fusion justified by improvement over RRF
- [ ] No fusion complexity without RRF baseline

**Related Rules/Skills/Trees:**
- Rule: Start with RRF Before Weighted Fusion (`hybrid-ranking-fusion/05-rules.md:1`)
- Decision Tree: Relevance Tuning Strategy (`hybrid-ranking-fusion/07-decision-trees.md:20`)

---

### AP-HRF-02: Fusing Without Individual Path Benchmarks

**Category:** Testing

**Description:** Deploying hybrid ranking fusion without independently measuring each retrieval path's quality.

**Why It Happens:** Focus on combined result. Teams assume both paths are adequate.

**Warning Signs:**
- Keyword-only and vector-only recall metrics unknown
- Fusion tuning when one path has <50% recall
- Team attributes poor hybrid results to fusion algorithm

**Why Harmful:** Fusion amplifies weaknesses. A poor retrieval path drags down hybrid quality regardless of fusion method.

**Consequences:**
- Wasted fusion tuning effort
- Undiagnosed path-level issues
- False conclusion that hybrid search doesn't work

**Alternative:** Benchmark each path independently. Fix path-level issues before evaluating fusion.

**Refactoring Strategy:**
1. Measure keyword-only recall with test set
2. Measure vector-only recall with test set
3. Fix any path below 70% recall threshold
4. Measure hybrid fusion improvement over best single path

**Detection Checklist:**
- [ ] Each path's recall measured independently
- [ ] Path-level issues fixed before fusion tuning
- [ ] Hybrid improvement measured over individual baselines

**Related Rules/Skills/Trees:**
- Rule: Benchmark Individual Paths Before Fusing (`hybrid-ranking-fusion/05-rules.md:34`)
- Decision Tree: BM25 vs Vector Similarity for Relevance (`hybrid-ranking-fusion/07-decision-trees.md:79`)

---

### AP-HRF-03: Unlimited Fusion Candidate Pool

**Category:** Performance

**Description:** Passing very large candidate lists (top-1000+) from each path into fusion, causing unnecessary computation.

**Why It Happens:** Assumption more candidates = better recall. Unaware of diminishing returns.

**Warning Signs:**
- Fusion receives 1000+ items per path
- Fusion computation measurable in milliseconds
- Top-20 results rarely include items beyond rank-100

**Why Harmful:** Beyond top-100, additional candidates negligibly improve final top-20 recall while increasing computation linearly.

**Consequences:**
- Higher latency per query
- More memory usage
- Reduced throughput

**Alternative:** Cap candidate pools at top-100 per path before fusion.

**Refactoring Strategy:**
1. Set path retrieval limits to top-100
2. Benchmark recall at top-100 vs top-1000
3. Confirm minimal recall difference
4. Configure fusion to produce top-20 final results

**Detection Checklist:**
- [ ] Candidate pools limited to top-100
- [ ] Recall vs pool size tradeoff documented
- [ ] Fusion computation <1ms

**Related Rules/Skills/Trees:**
- Rule: Limit Fusion Input to Top-100 (`hybrid-ranking-fusion/05-rules.md:68`)
- Rule: Cap Candidate Pool at Top-100 Per Path (`hybrid-search-concept/05-rules.md:71`)

---

### AP-HRF-04: Sequential Retrieval in Fusion Pipeline

**Category:** Performance

**Description:** Running keyword and vector retrieval sequentially when fusing results, doubling latency.

**Why It Happens:** Simple linear code. No async/await pattern used.

**Warning Signs:**
- Search latency = keyword + vector + fusion
- No concurrent execution pattern in code
- Sequential function calls

**Why Harmful:** Hybrid latency should be max(keyword, vector) + fusion, not sum.

**Consequences:**
- 2x slower than necessary
- Poor user experience
- Higher server resource usage

**Alternative:** Execute both queries concurrently using async/await or parallel dispatch.

**Refactoring Strategy:**
1. Wrap each query in async closure
2. Use `await()` to run concurrently
3. Verify latency ≈ max(path1, path2) + fusion

**Detection Checklist:**
- [ ] Both queries execute concurrently
- [ ] Latency ≈ max(path1, path2) + fusion
- [ ] Async infrastructure tested

**Related Rules/Skills/Trees:**
- Rule: Start with RRF Before Weighted Fusion (`hybrid-ranking-fusion/05-rules.md:1`)
- Skill: Configure and Implement Hybrid Ranking Fusion (`hybrid-ranking-fusion/06-skills.md:1`)

---

### AP-HRF-05: Deploying Fusion Without Quality Validation

**Category:** Testing

**Description:** Deploying a fusion strategy to production without measuring whether fusion improves over each individual retrieval path.

**Why It Happens:** Assumption fusion always helps. No benchmarking infrastructure.

**Warning Signs:**
- No baseline metrics for individual paths
- Fusion deployed but quality improvement unquantified
- Team cannot say if fusion helps

**Why Harmful:** Fusion adds latency and complexity. If it doesn't improve quality, it's pure overhead.

**Consequences:**
- Higher latency for no benefit
- Wasted infrastructure (dual retrieval)
- Masked individual path degradation

**Alternative:** Benchmark fusion quality against each individual path before deployment.

**Refactoring Strategy:**
1. Measure keyword-only quality (NDCG@10)
2. Measure vector-only quality (NDCG@10)
3. Measure hybrid fusion quality (NDCG@10)
4. Only deploy if fusion > max(keyword, vector)
5. Document metrics for ongoing monitoring

**Detection Checklist:**
- [ ] Individual path quality documented
- [ ] Fusion improvement quantified
- [ ] Deploy decision based on metrics
- [ ] Ongoing quality monitoring in place

**Related Rules/Skills/Trees:**
- Rule: Benchmark Individual Paths Before Fusing (`hybrid-ranking-fusion/05-rules.md:34`)
- Skill: Optimize and Monitor Hybrid Ranking Fusion Production Search (`hybrid-ranking-fusion/06-skills.md:81`)

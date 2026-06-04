| Metadata | |
|---|---|
| Knowledge Unit ID | ku-04 |
| Subdomain | hybrid-search |
| Topic | Weighted Hybrid Scoring |
| Source | Industry / Academic |
| Maturity | Stable |

## Anti-Pattern Inventory

| Anti-Pattern ID | Name | Category |
|---|---|---|
| AP-WHS-01 | Weighted Fusion Without Score Normalization | Performance |
| AP-WHS-02 | Setting α to 0 or 1 | Design |
| AP-WHS-03 | Deploying Weighted Fusion Without RRF Baseline | Testing |
| AP-WHS-04 | Linear Normalization with Score Outliers | Reliability |
| AP-WHS-05 | Static α for All Query Types | Performance |

## Repository-Wide Anti-Patterns

- RAP-SEARCH-04: Using raw scores without score normalization across different engines (`keyword-vector-fusion/04-standardized-knowledge.md:68`)
- RAP-SEARCH-05: Tuning fusion parameters without per-content-type analysis (`meilisearch-hybrid-search/04-standardized-knowledge.md:39`)

---

### AP-WHS-01: Weighted Fusion Without Score Normalization

**Category:** Performance

**Description:** Applying `α * keywordScore + (1-α) * vectorScore` without normalizing scores to a common scale, causing one path to dominate based on its scoring range.

**Why It Happens:** Assumption that different search engines produce scores on comparable scales. Developers may not realize BM25 (0-20+) and cosine similarity (0-1) are incompatible.

**Warning Signs:**
- Raw scores used directly in weighted sum
- One retrieval path consistently provides all top results regardless of α value
- Changing α has no visible effect on rankings

**Why Harmful:** Weighted fusion becomes meaningless. The path with the larger score range dominates, and α tuning has no effect because it's overwhelmed by scale differences.

**Consequences:**
- Hybrid search degrades to single-path search
- Investment in second retrieval path is wasted
- False confidence in weighted fusion approach

**Alternative:** Normalize scores to [0,1] using min-max normalization before weighted fusion. Better yet, use RRF (rank-based, no normalization).

**Refactoring Strategy:**
1. Identify all weighted fusion calls using raw scores
2. Add min-max normalization: `($score - $min) / ($max - $min)` for each score array
3. Handle edge cases: single-item list, all-equal scores
4. Verify both paths contribute to top-10 after normalization
5. Benchmark normalized vs unnormalized fusion quality

**Detection Checklist:**
- [ ] All weighted fusion calls normalize scores first
- [ ] Min-max normalization handles edge cases
- [ ] Both paths contribute to top-10 results
- [ ] α tuning has visible effect on ranking

**Related Rules/Skills/Trees:**
- Rule: Normalize Scores Before Weighted Fusion (`weighted-hybrid-scoring/05-rules.md:1`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`weighted-hybrid-scoring/07-decision-trees.md:74`)

---

### AP-WHS-02: Setting α to 0 or 1

**Category:** Design

**Description:** Setting the α parameter to 0 (pure vector) or 1 (pure keyword) in weighted fusion, which defeats the purpose of hybrid search.

**Why It Happens:** Hasty configuration. Developers set α to an extreme when tuning, forget to change it back, or use α=0/1 to effectively disable one path.

**Warning Signs:**
- α = 0.0 or α = 1.0 in configuration
- One path's scores completely ignored in fusion
- Hybrid search effectively operating as single-path search

**Why Harmful:** α=0 or α=1 means only one retrieval path contributes to final scores. This is identical to running that path alone, but with the overhead of dual retrieval.

**Consequences:**
- Double the query latency for no benefit
- Dual indexing cost wasted on unused path
- Misleading "hybrid search" label when only one path active

**Alternative:** Use α in 0.3-0.7 range for meaningful hybrid balance. If only one path is needed, disable hybrid entirely.

**Refactoring Strategy:**
1. Audit all α values in configuration and code
2. Replace α=0 or α=1 with meaningful values (start with 0.5)
3. If one path is intentionally excluded, disable hybrid search entirely
4. Replace hybrid call with single-path call
5. Remove dual retrieval code and extra infrastructure if hybrid is not needed

**Detection Checklist:**
- [ ] α value is in 0.3-0.7 range (or validated alternative)
- [ ] No α=0 or α=1 without explicit justification
- [ ] Both paths contribute to fused results
- [ ] If one path disabled, hybrid search is not used

**Related Rules/Skills/Trees:**
- Rule: Normalize Scores Before Weighted Fusion (`weighted-hybrid-scoring/05-rules.md:1`)
- Skill: Configure and Implement Weighted Hybrid Scoring (`weighted-hybrid-scoring/06-skills.md:1`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`weighted-hybrid-scoring/07-decision-trees.md:74`)

---

### AP-WHS-03: Deploying Weighted Fusion Without RRF Baseline

**Category:** Testing

**Description:** Deploying weighted fusion (with normalization, α tuning) to production without benchmarking against a simple RRF baseline to verify improvement.

**Why It Happens:** Teams assume weighted fusion with optimized α is always better than RRF. RRF is not implemented as a comparison baseline.

**Warning Signs:**
- No RRF implementation exists in codebase
- Weighted fusion deployed with justification like "fine-grained control"
- Quality metrics for weighted fusion vs RRF unknown

**Why Harmful:** Weighted fusion adds normalization complexity, α tuning, and maintenance burden. If RRF performs equally well, the added complexity is unjustified.

**Consequences:**
- Higher maintenance burden for no quality benefit
- Debugging normalization issues that RRF would avoid
- Team time spent tuning α instead of improving retrieval quality

**Alternative:** Implement RRF baseline first. Benchmark weighted fusion against it. Only deploy weighted fusion if it shows statistically significant quality improvement.

**Refactoring Strategy:**
1. Implement RRF as a benchmark baseline
2. Run both RRF and weighted fusion on a representative query set
3. Compare NDCG or MRR metrics
4. If weighted fusion does not significantly outperform RRF, replace with RRF
5. If weighted fusion performs better, document improvement metrics as justification

**Detection Checklist:**
- [ ] RRF baseline implemented and benchmarked
- [ ] Weighted fusion compared to RRF with documented metrics
- [ ] Justification exists if weighted fusion is used instead of RRF

**Related Rules/Skills/Trees:**
- Rule: Benchmark Weighted Fusion Against RRF (`weighted-hybrid-scoring/05-rules.md:38`)
- Decision Tree: Hybrid Search Fusion Strategy (`weighted-hybrid-scoring/07-decision-trees.md:20`)

---

### AP-WHS-04: Linear Normalization with Score Outliers

**Category:** Reliability

**Description:** Using min-max normalization for weighted fusion when score distributions contain outliers, causing all non-outlier scores to compress near zero.

**Why It Happens:** Min-max normalization is the simplest and most commonly implemented. Developers don't consider outlier sensitivity.

**Warning Signs:**
- After normalization, most scores are in 0-0.05 range with one score at 1.0
- α tuning has no effect (all non-outlier items get similar scores)
- Outlier documents dominate final rankings regardless of α

**Why Harmful:** A single extreme outlier score compresses the entire score distribution: `[0, 1, 2, 500]` normalizes to `[0, 0.002, 0.004, 1.0]`. All items except the outlier become nearly indistinguishable.

**Consequences:**
- Fusion quality determined by outlier scores, not meaningful differences
- α tuning rendered useless
- Unpredictable rankings

**Alternative:** Use sigmoid normalization, z-score normalization, or score clipping to handle outliers robustly.

**Refactoring Strategy:**
1. Analyze score distributions from both retrieval paths
2. If outliers are present, replace min-max with sigmoid normalization
3. Sigmoid: `1 / (1 + exp(-(score - mean) / stddev))`
4. Handle edge cases: all-equal scores, zero standard deviation
5. Benchmark fusion quality with robust vs min-max normalization
6. Document normalization method and rationale

**Detection Checklist:**
- [ ] Score distributions analyzed for outliers
- [ ] Normalization method robust to outliers (sigmoid, z-score, or clipping)
- [ ] Normalization method handles edge cases
- [ ] Fusion quality stable across score distribution changes

**Related Rules/Skills/Trees:**
- Rule: Handle Score Outliers with Robust Normalization (`weighted-hybrid-scoring/05-rules.md:70`)
- Skill: Configure and Implement Weighted Hybrid Scoring (`weighted-hybrid-scoring/06-skills.md:1`)

---

### AP-WHS-05: Static α for All Query Types

**Category:** Performance

**Description:** Using a single, static α value for weighted fusion across all query types, ignoring that different queries need different keyword-vector balances.

**Why It Happens:** Simplicity. One configuration value is easy to maintain. Per-query-type α requires query classification logic.

**Warning Signs:**
- Single α value for all hybrid queries
- Team unable to optimize for both product searches and article searches
- α=0.5 used without testing other values

**Why Harmful:** Factual queries (SKU lookup, exact name) need keyword-heavy weighting (α=0.7-0.9). Conceptual queries need vector-heavy weighting (α=0.3-0.5). A single α underperforms for both.

**Consequences:**
- Suboptimal results for both query types
- Product search misses exact matches (α too low)
- Content search misses conceptual results (α too high)

**Alternative:** Classify queries by type and use different α values per class, or use RRF (which handles both well without tuning).

**Refactoring Strategy:**
1. Implement query classification: heuristics (word count, SKU patterns) or ML-based
2. Define α values per query class: factual (0.8), mixed (0.5), conceptual (0.3)
3. Route queries to different α values based on classification
4. A/B test per-class α values against uniform α
5. If per-class α doesn't improve over RRF, switch to RRF entirely
6. Remove static α configuration

**Detection Checklist:**
- [ ] Query types classified (factual, mixed, conceptual)
- [ ] α tuned per query type or RRF used instead
- [ ] Per-class α improvement over single α documented
- [ ] Query classification accuracy monitored

**Related Rules/Skills/Trees:**
- Rule: Benchmark Weighted Fusion Against RRF (`weighted-hybrid-scoring/05-rules.md:38`)
- Skill: Optimize and Monitor Weighted Hybrid Scoring Production Search (`weighted-hybrid-scoring/06-skills.md:81`)
- Decision Tree: Keyword vs Vector Search Weight Allocation (`weighted-hybrid-scoring/07-decision-trees.md:74`)

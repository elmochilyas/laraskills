# ECC Anti-Patterns — TF-IDF & BM25
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Relevance and Ranking | Knowledge Unit | TF-IDF & BM25 | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Implementing Custom TF-IDF When BM25 Libraries Exist
2. Ignoring BM25 Parameter Tuning
3. Comparing Raw Scores Across Different Corpora or Fields
4. Using TF-IDF Without IDF (Raw Term Frequency)
5. Field-Weighting Without Understanding BM25 Baseline
---
## Repository-Wide Anti-Patterns
- Building custom ranking solutions without first understanding BM25 baselines
- Treating BM25 as a black box without parameter knowledge
- Mixing scores from different ranking algorithms without normalization
---
## Anti-Pattern 1: Implementing Custom TF-IDF When BM25 Libraries Exist
### Category
Maintainability | Productivity
### Description
Writing a custom TF-IDF implementation from scratch when mature, battle-tested BM25 implementations exist in the search engine.
### Why It Happens
Not-invented-here syndrome or lack of awareness that popular search engines already implement optimized BM25 ranking internally.
### Warning Signs
- Custom TF-IDF formula in application code
- Manual term frequency and inverse document frequency calculations
- No dependency on a search engine that provides BM25
- Poor ranking performance compared to search engines
### Why Harmful
Custom TF-IDF is slower, more error-prone, and less effective than BM25. It lacks document length normalization and term frequency saturation that BM25 provides.
### Consequences
- Suboptimal ranking quality compared to BM25
- Performance overhead from custom computation
- Ongoing maintenance burden for ranking code
- Missing features like field weighting and normalization
### Alternative
Use BM25 provided by the search engine (Meilisearch, Elasticsearch, PostgreSQL FTS). Only implement custom ranking when engine-level BM25 is insufficient.
### Refactoring Strategy
1. Identify search engine's BM25 implementation
2. Remove custom TF-IDF code
3. Configure engine to use BM25 ranking
4. Tune BM25 parameters (k1, b) if needed
5. Verify ranking quality matches or exceeds custom TF-IDF
### Detection Checklist
- [ ] No custom TF-IDF formula in application code
- [ ] Search engine BM25 implementation used
- [ ] BM25 baselines established for comparison
- [ ] Custom ranking justified when not using BM25
### Related Rules/Skills/Trees
- Decision: BM25 vs Vector Similarity for Relevance
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Ignoring BM25 Parameter Tuning
### Category
Performance | Accuracy
### Description
Using default BM25 parameters (k1=1.2, b=0.75) without tuning for the specific corpus characteristics, resulting in suboptimal ranking.
### Why It Happens
Default parameters work reasonably well for average English text. Teams assume defaults are optimal or don't know how BM25 parameters affect ranking.
### Warning Signs
- Long documents ranked too high or too low
- Short content consistently outranks longer, more relevant documents
- Parameter tuning never performed during search setup
- Ranking issues suspected but BM25 parameters never adjusted
### Why Harmful
Untuned BM25 over-penalizes long documents that contain relevant information or under-penalizes short documents that lack depth. The ranking baseline is suboptimal from the start.
### Consequences
- Consistent ranking quality gap that persists across all queries
- Misattribution of ranking issues to other factors
- Effort wasted on custom ranking rules that could be solved by BM25 tuning
- Harder to evaluate improvements against a non-optimal baseline
### Alternative
Test k1 values (0.5-3.0) and b values (0.5-1.0) against the query test set to find optimal parameters for the corpus.
### Refactoring Strategy
1. Create a query test set with expected results
2. Benchmark default BM25 (k1=1.2, b=0.75) as baseline
3. Test k1 values: 0.5, 1.0, 1.2, 1.5, 2.0, 3.0
4. Test b values: 0.5, 0.75, 1.0
5. Select parameters that maximize NDCG on the test set
### Detection Checklist
- [ ] BM25 parameter tuning performed
- [ ] Multiple k1 and b values tested
- [ ] Tuning results documented
- [ ] Optimal parameters deployed to production
- [ ] Parameters re-evaluated when corpus changes significantly
### Related Rules/Skills/Trees
- Rule: Create Query Test Set Before Tuning
- Decision: BM25 vs Vector Similarity for Relevance
---
## Anti-Pattern 3: Comparing Raw Scores Across Different Corpora or Fields
### Category
Data Quality | Accuracy
### Description
Comparing raw BM25 scores across different search indexes, corpora, or document fields as if they were normalized and directly comparable.
### Why It Happens
BM25 scores look like normalized values (0 to ~10), tempting developers to compare them as absolute relevance measures.
### Warning Signs
- Score-based threshold applied universally across indexes
- Raw BM25 scores used in A/B test comparisons
- Score comparison between different content types
- Hardcoded score cutoff values
### Why Harmful
BM25 scores are corpus-dependent: IDF values differ across corpora, document length distributions differ, and field configurations differ. Scores are not comparable across contexts.
### Consequences
- Incorrect relevance thresholds
- Misleading A/B test conclusions
- Inconsistent ranking behavior across indexes
- Unexplained score differences between content types
### Alternative
Use ranking position rather than raw scores for comparison. Normalize scores within a query context if needed.
### Refactoring Strategy
1. Replace score-based cutoffs with rank-based thresholds
2. Use NDCG or MRR for cross-index evaluation
3. If scores must be compared, normalize per-query (min-max or z-score)
4. Document that BM25 scores are corpus-specific
5. Use Reciprocal Rank Fusion for hybrid scoring instead of raw score mixing
### Detection Checklist
- [ ] No raw BM25 score comparison across indexes
- [ ] Score thresholds avoided in favor of rank-based
- [ ] Cross-index evaluation uses NDCG/MRR not raw scores
- [ ] Score normalization applied when necessary
### Related Rules/Skills/Trees
- Decision: BM25 vs Vector Similarity for Relevance
- Decision: RRF (Reciprocal Rank Fusion)
---
## Anti-Pattern 4: Using TF-IDF Without IDF (Raw Term Frequency)
### Category
Data Quality | Accuracy
### Description
Using raw term frequency as the ranking score without inverse document frequency, allowing common stop-word-like terms to dominate ranking.
### Why It Happens
Simpler implementation: just count term occurrences per document without computing IDF across the corpus.
### Warning Signs
- Common words dominate search results
- "The", "and", "or" matching boosts documents with high frequency
- Rare but precise terms don't help ranking
- No IDF computation in ranking logic
### Why Harmful
Without IDF, common terms that appear in every document dominate ranking. Rare but important terms provide no ranking signal. Search results favor verbosity over relevance.
### Consequences
- Search results favor documents with common terms
- Precise, rare term matches don't surface
- Low-quality verbatim content ranks well
- User search experience is poor for typical queries
### Alternative
Always use BM25 or TF-IDF with full IDF computation. Never use raw term frequency alone.
### Refactoring Strategy
1. Identify raw TF usage in ranking code
2. Implement full BM25 or TF-IDF with IDF
3. Test that rare terms gain appropriate ranking weight
4. Verify common terms no longer dominate results
5. Replace custom code with search engine built-in ranking
### Detection Checklist
- [ ] IDF component included in ranking formula
- [ ] Rare terms rank higher for precise matches
- [ ] Common words no longer dominate results
- [ ] BM25 or TF-IDF fully implemented
### Related Rules/Skills/Trees
- Decision: BM25 vs Vector Similarity for Relevance
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: Field-Weighting Without Understanding BM25 Baseline
### Category
Process | Accuracy
### Description
Applying custom field weights and boosting before understanding the BM25 baseline ranking, masking whether field weights genuinely improve relevance.
### Why It Happens
Teams want to prioritize important fields and add weights early, without establishing a control baseline.
### Warning Signs
- Field weights applied before any unweighted ranking evaluation
- No baseline metrics before field weighting
- Heavy title boosting that drowns out body content
- Inability to explain why specific weights were chosen
### Why Harmful
Without a BM25 baseline, you don't know if field weights help or hurt. Heavy boosting may create a biased ranking that systematically prefers short title matches over comprehensive body content.
### Consequences
- Unvalidated field weights that may hurt relevance
- Over-boosted short fields (titles) dominating results
- No objective measure of field weight effectiveness
- Hard to debug ranking issues when weights mask underlying problems
### Alternative
Establish a BM25 baseline first, then add field weights incrementally, measuring impact at each step.
### Refactoring Strategy
1. Run queries with default BM25 and no field weights
2. Measure baseline NDCG, MRR, and CTR
3. Add field weights one at a time, measuring impact
4. Document optimal weight values and their rationale
5. Re-evaluate weights periodically as content changes
### Detection Checklist
- [ ] BM25 baseline established before field weighting
- [ ] Each field weight tested with before/after metrics
- [ ] Field weight rationale documented
- [ ] No single field dominates ranking unfairly
### Related Rules/Skills/Trees
- Rule: Tune in Order of Impact
- Rule: Document Every Tuning Change
- Decision: BM25 vs Vector Similarity for Relevance

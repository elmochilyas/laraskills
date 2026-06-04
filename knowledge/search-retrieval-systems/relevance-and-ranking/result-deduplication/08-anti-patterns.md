# ECC Anti-Patterns — Result Deduplication
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Relevance and Ranking | Knowledge Unit | Result Deduplication | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Overly Aggressive Deduplication
2. Near-Dedup Without Quality Thresholds
3. Deduplication Without Override Mechanism
4. Ignoring Deduplication in Aggregator/Content Platforms
5. Inconsistent Deduplication Across Indexes
---
## Repository-Wide Anti-Patterns
- Applying deduplication blindly without considering result diversity needs
- Using exact matching only when near-duplicate content is the real problem
- Not monitoring deduplication rate for quality regressions
---
## Anti-Pattern 1: Overly Aggressive Deduplication
### Category
Data Quality | User Experience
### Description
Applying deduplication rules that are too aggressive, removing genuinely useful duplicate results that provide different perspectives or pricing options.
### Why It Happens
Teams see duplicate results as a problem and apply broad deduplication rules without understanding when duplicates are actually valuable to users.
### Warning Signs
- Users complaining about missing results
- Dedup rate > 30% of total results
- Same dedup strategy applied to all query types
- E-commerce searches missing different seller options
### Why Harmful
Aggressive deduplication hides useful results. In e-commerce, users want to see multiple sellers for the same product. In news, multiple sources for the same story provide perspective.
### Consequences
- Reduced result set diversity
- User frustration from missing expected results
- Lost revenue from hidden product options
- Hard to debug because dedup happens transparently
### Alternative
Apply selective deduplication based on query intent. Allow dedup override per query. Monitor dedup rate and adjust thresholds.
### Refactoring Strategy
1. Categorize queries by intent (navigational, informational, transactional)
2. Apply dedup only for informational queries where diversity matters less
3. Set maximum dedup threshold (e.g., remove at most 20% of results)
4. Allow users to opt-in to seeing duplicate results
5. Monitor dedup rate per query category
### Detection Checklist
- [ ] Dedup rate monitored and below 30%
- [ ] Dedup rules vary by query intent
- [ ] Duplicate override mechanism available
- [ ] Users can see hidden duplicates if desired
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Near-Dedup Without Quality Thresholds
### Category
Reliability | Accuracy
### Description
Implementing near-dedup (simhash, MinHash, embedding clustering) without proper similarity thresholds, causing false positives that remove genuinely different content.
### Why It Happens
Near-dedup requires tuning similarity thresholds per content type. Developers set a single threshold that works for one content type but fails for others.
### Warning Signs
- Different articles on same topic are removed as duplicates
- Short content incorrectly matched as near-duplicate
- Threshold set arbitrarily without testing
- No validation of near-dedup accuracy
### Why Harmful
False positives from near-dedup remove genuinely unique content. Users miss relevant results because the algorithm incorrectly considers them duplicates.
### Consequences
- Reduced content diversity in results
- Important but similar-topic content hidden from users
- Hard to diagnose because near-dedup is opaque
- Threshold tuning requires ongoing maintenance
### Alternative
Test near-dedup thresholds against a curated dataset. Set conservative thresholds initially. Use field-based grouping as a simpler alternative.
### Refactoring Strategy
1. Create test set of known near-duplicate and non-duplicate pairs
2. Tune similarity threshold to maximize F1 score
3. Set per-content-type thresholds if needed
4. Start with conservative threshold (lower false positive rate)
5. Monitor near-dedup false positive rate in production
### Detection Checklist
- [ ] Near-dedup threshold tuned on test dataset
- [ ] False positive rate monitored in production
- [ ] Different thresholds for different content types
- [ ] Conservative threshold set initially
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 3: Deduplication Without Override Mechanism
### Category
User Experience | Flexibility
### Description
Implementing deduplication without allowing users or queries to override it, removing user agency over what results they see.
### Why It Happens
Deduplication is implemented as an invisible filter that always applies. The idea of an override is overlooked during implementation.
### Warning Signs
- No query parameter to disable dedup
- No UI toggle for showing duplicates
- No way to bypass dedup for power users
- Hardcoded dedup logic in search service
### Why Harmful
There are valid use cases for seeing duplicates: comparing prices, reading multiple perspectives, finding related products. Removing user choice creates frustration.
### Consequences
- Power users bypass the search feature entirely
- User trust reduced when results seem incomplete
- Accessibility issues for users who want all results
- Support tickets about "missing" results
### Alternative
Provide a query parameter or UI toggle to disable deduplication. Allow override per query in Scout callbacks.
### Refactoring Strategy
1. Add `dedup=false` query parameter that disables deduplication
2. Expose a UI toggle for showing/hiding duplicates
3. Implement bypass for authenticated/power users
4. Log override usage to understand demand
5. Consider showing a "X duplicate results hidden" notice
### Detection Checklist
- [ ] Query parameter available to disable dedup
- [ ] UI toggle for showing duplicates
- [ ] Power users can bypass dedup
- [ ] Hidden duplicates shown on request
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
---
## Anti-Pattern 4: Ignoring Deduplication in Aggregator/Content Platforms
### Category
Data Quality | User Experience
### Description
Not implementing any deduplication in content aggregator or multi-source platforms, allowing duplicate or syndicated content to dominate search results.
### Why It Happens
Teams don't realize how much duplicate content exists across sources. Each source seems unique until aggregated and compared.
### Warning Signs
- Multiple results with identical content from different URLs
- Same product listed by different sellers all appearing on page 1
- News search shows 5 articles with the same story
- Users must scan past duplicates to find diverse results
### Why Harmful
Duplicates waste the user's time and push diverse results off the first page. Search quality perception drops when results feel repetitive.
### Consequences
- Poor search experience with repetitive results
- Users abandon searches due to duplicate density
- Important diverse content pushed below the fold
- Reduced engagement with search results
### Alternative
Implement field-based grouping (Typesense) or custom dedup for content aggregators. Group by source domain or story cluster.
### Refactoring Strategy
1. Analyze search logs to quantify duplicate content prevalence
2. Choose dedup strategy based on content type (exact, field-based, near-dedup)
3. Implement Typesense grouping or custom dedup logic
4. Test dedup with representative queries
5. Monitor dedup rate and user feedback
### Detection Checklist
- [ ] Duplicate content prevalence quantified
- [ ] Dedup strategy implemented for aggregator
- [ ] Field-based grouping configured (Typesense)
- [ ] Dedup effectiveness measured
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: Inconsistent Deduplication Across Indexes
### Category
Maintainability | Reliability
### Description
Applying different deduplication logic across multiple search indexes or environments, causing inconsistent user experiences and confusing behavior.
### Why It Happens
Each search index has independent configuration. Teams configure dedup per-index without cross-index consistency review.
### Warning Signs
- Same query returns different dedup patterns on different indexes
- Development environment has no dedup; production does
- Products indexed in multiple categories appear inconsistently
- Stakeholders see different results on different pages
### Why Harmful
Inconsistent dedup creates confusing user experiences. Results vary unpredictably based on which index handles the query. Debugging becomes nearly impossible.
### Consequences
- Users confused by inconsistent dedup behavior
- Cross-index search results unpredictable
- Development-to-production dedup discrepancies
- Maintenance burden of per-index dedup configs
### Alternative
Standardize deduplication strategy across all indexes. Use shared configuration or service-layer dedup abstraction.
### Refactoring Strategy
1. Audit dedup configuration across all search indexes
2. Define a single dedup strategy document
3. Implement dedup in a shared service class used by all indexes
4. Add integration tests verifying consistent dedup behavior
5. Document the dedup strategy for all environments
### Detection Checklist
- [ ] Dedup strategy documented and shared across indexes
- [ ] All indexes use consistent dedup configuration
- [ ] Integration tests verify cross-index dedup consistency
- [ ] Development and production dedup match
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy

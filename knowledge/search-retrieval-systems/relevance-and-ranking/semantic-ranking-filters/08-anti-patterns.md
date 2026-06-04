# ECC Anti-Patterns — Semantic Ranking Filters
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Relevance and Ranking | Knowledge Unit | Semantic Ranking Filters | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Post-Filtering Without Understanding Recall Loss
2. Not Indexing Filterable Attributes
3. Ignoring Empty Result Scenarios from Filters
4. Mixing Pre-Filter and Post-Filter Without Strategy
5. Single Filter Strategy for All Query Types
---
## Repository-Wide Anti-Patterns
- Defaulting to post-filtering without considering performance impact
- Not monitoring filter selectivity and zero-result rates
- Hardcoding filter logic instead of using engine-native filter capabilities
---
## Anti-Pattern 1: Post-Filtering Without Understanding Recall Loss
### Category
Performance | Accuracy
### Description
Using post-filtering by default without understanding that it can eliminate a large portion of top-k results, leaving insufficient or irrelevant results.
### Why It Happens
Post-filtering is simpler to implement — no special index or query configuration needed. Teams default to it without considering the recall implications.
### Warning Signs
- Search returns very few results when filters are applied
- Relevant filtered-out results are invisible to users
- High zero-result rate on filtered queries
- Vector search returns semantically good results that are then removed
### Why Harmful
Post-filtering removes already-retrieved results, potentially discarding the most relevant ones. Users get fewer results than expected or zero results despite relevant content existing.
### Consequences
- Poor user experience with sparse filtered results
- Increased zero-result rates
- Schema-compliant content hidden from search
- Users must remove filters to find what they need
### Alternative
Use pre-filtering when filter selectivity is high. Implement iterative search: start strict, relax filter if too few results.
### Refactoring Strategy
1. Assess filter selectivity for common filter combinations
2. Switch to pre-filtering for highly selective filters
3. If pre-filtering isn't supported, implement iterative search
4. Start with strict filter, relax progressively until minimum result count
5. Monitor zero-result rate per filter combination
### Detection Checklist
- [ ] Post-filtering recall loss quantified
- [ ] Highly selective filters use pre-filtering
- [ ] Iterative search or fallback implemented
- [ ] Zero-result rate monitored per filter
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 2: Not Indexing Filterable Attributes
### Category
Performance | Data Quality
### Description
Failing to declare metadata fields as filterable attributes in the search engine configuration, causing filters to be applied inefficiently or silently ignored.
### Why It Happens
Filterable attributes must be explicitly configured in the search engine schema. Developers assume all fields are automatically filterable.
### Warning Signs
- Filters are silently ignored in search results
- Slow query performance when filters are applied
- Search engine warnings about non-filterable attributes
- Filters work in development but not production
### Why Harmful
Filters that are silently ignored produce incorrect results. Users think they are filtering but see unfiltered results, creating a broken experience.
### Consequences
- Filters appear to work on the UI but have no effect
- Users lose trust in the search feature
- Debugging consumes time as the root cause is non-obvious
- Schema changes required to fix require re-indexing
### Alternative
Declare all needed filterable attributes in the search engine index schema before importing data.
### Refactoring Strategy
1. Review all metadata fields used as filters in the application
2. Add filterable declarations to search engine index configuration
3. Re-index data to apply schema changes
4. Add integration tests verifying filters produce correct results
5. Add schema validation to CI pipeline
### Detection Checklist
- [ ] All filterable attributes declared in search schema
- [ ] Integration tests verify filter functionality
- [ ] Schema validation in CI pipeline
- [ ] Filter performance acceptable
### Related Rules/Skills/Trees
- Rule: Tune in Order of Impact
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 3: Ignoring Empty Result Scenarios from Filters
### Category
User Experience | Reliability
### Description
Not handling the case where filters eliminate all search results, showing users an empty page instead of suggesting filter relaxation or alternatives.
### Why It Happens
Developers test with data that matches filters. Empty result scenarios are overlooked until they happen in production.
### Warning Signs
- Zero-result search page with no guidance
- Users must manually remove filters to find results
- No "no results" suggestions or alternatives
- High bounce rate on filtered search pages
### Why Harmful
Users hit dead ends with no way to find results. They must guess which filter to remove. This creates frustration and abandonment.
### Consequences
- Users abandon search on empty results
- Lost sales or engagement from over-filtered searches
- Negative perception of search quality
- Support burden from users complaining about missing results
### Alternative
Implement iterative search that relaxes filters when too few results are found. Show suggestions for alternative filters.
### Refactoring Strategy
1. Detect zero or very low result counts from filtered queries
2. Implement iterative search: relax the most restrictive filter
3. Show "No results for this filter combination" message with suggestions
4. Display popular unfiltered results or category alternatives
5. Log filter combinations that produce zero results for analysis
### Detection Checklist
- [ ] Zero-result scenario handled gracefully
- [ ] Iterative search or filter relaxation implemented
- [ ] Suggestions shown for alternative filters
- [ ] Filter combinations with zero results are logged and analyzed
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
---
## Anti-Pattern 4: Mixing Pre-Filter and Post-Filter Without Strategy
### Category
Architecture | Maintainability
### Description
Applying some filters as pre-filters and others as post-filters without a documented strategy, creating unpredictable result filtering behavior.
### Why It Happens
Different filters are implemented at different times by different developers. No architectural decision governs which filter type to use where.
### Warning Signs
- No documentation of which filters are pre vs post
- Some filters use Scout where(), others use collection filtering
- Inconsistent behavior: some filters narrow results, others remove them
- Changing a filter type changes the result set unexpectedly
### Why Harmful
Users cannot predict how filters affect results. The same filter criteria may behave differently depending on implementation. Debugging filter issues becomes complex.
### Consequences
- Inconsistent user experience across filter types
- Difficult to debug filter behavior
- Architectural drift as new filters are added
- Performance issues from wrong filter type choices
### Alternative
Document a filter strategy: use pre-filtering for highly selective metadata, post-filtering for soft constraints. Always pre-filter for tenant isolation.
### Refactoring Strategy
1. Audit all existing filters and classify by selectivity
2. Document filter strategy: pre-filter for hard constraints, post-filter for soft
3. Standardize filter implementation in service layer
4. Add tests verifying filter behavior matches strategy
5. Review new filters against the strategy before implementation
### Detection Checklist
- [ ] Filter strategy documented
- [ ] All filters classified as pre or post with rationale
- [ ] Filter implementation standardized
- [ ] Architecture review for new filters
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Skill: Configure and Implement Relevance Tuning Workflow
---
## Anti-Pattern 5: Single Filter Strategy for All Query Types
### Category
Performance | User Experience
### Description
Applying the same filter approach (pre or post) to all query types regardless of their characteristics, missing optimization opportunities.
### Why It Happens
Teams choose one approach (usually post-filtering for simplicity) and apply it universally without considering query-specific needs.
### Warning Signs
- Same filter strategy for broad and narrow queries
- Performance issues on highly selective queries
- Poor recall on broad queries with restrictive filters
- No query-type-aware filter logic
### Why Harmful
Broad queries with many filters benefit from pre-filtering. Narrow queries with few filters may be fine with post-filtering. One-size-fits-all sacrifices performance or recall.
### Consequences
- Suboptimal performance for filter-heavy queries
- Reduced recall for broad filtered queries
- Missed optimization opportunities
- Inflexible architecture hard to adapt
### Alternative
Analyze query patterns and apply filter strategies per query category. Use pre-filtering for high-selectivity filters; post-filtering for low-selectivity ones.
### Refactoring Strategy
1. Categorize queries by filter selectivity and count
2. Design filter strategy per category
3. Implement query-type-aware filter logic
4. Test each category for performance and recall
5. Monitor and adjust strategies based on metrics
### Detection Checklist
- [ ] Query categories defined with filter strategies
- [ ] Query-type-aware filter logic implemented
- [ ] Performance and recall metrics per category
- [ ] Strategies reviewed and adjusted periodically
### Related Rules/Skills/Trees
- Decision: Relevance Tuning Strategy
- Decision: BM25 vs Vector Similarity for Relevance

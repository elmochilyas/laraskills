# ECC Anti-Patterns — Qdrant Payload Filtering
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Search UX and Analytics | Knowledge Unit | Qdrant Payload Filtering | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Not Creating Payload Indexes on Filtered Fields
2. Using must_not for Exclusion When must Is More Efficient
3. Storing Large Payload Data That Slows Index Performance
4. Not Leveraging Geo Filters When Location Is Available
5. Complex Nested Filters Without Evaluation
---
## Repository-Wide Anti-Patterns
- Applying post-filtering instead of Qdrant's filter-integrated ANN
- Not combining payload filters with vector similarity for hybrid search
- Using the same filter logic across all collections without customization
---
## Anti-Pattern 1: Not Creating Payload Indexes on Filtered Fields
### Category
Performance | Operations
### Description
Failing to create payload indexes on frequently filtered fields, causing slow filtered ANN queries as Qdrant must scan all payloads.
### Why It Happens
New Qdrant users don't know payload indexes exist or assume they're automatic.
### Warning Signs
- Filtered queries much slower than unfiltered
- High-cardinality field filters particularly slow
- No payload indexes visible in collection configuration
- Qdrant performance docs mention payload indexes but they're absent
### Why Harmful
Without payload indexes, Qdrant cannot efficiently narrow the search space during HNSW traversal. Every filter requires scanning the entire payload set, defeating the purpose of filter-integrated ANN.
### Consequences
- Slow filtered search queries
- Poor multi-tenant performance
- Inefficient HNSW traversal with filters
- Scaling requires more resources than necessary
### Alternative
Create payload indexes on all frequently filtered fields (tenant_id, category, status).
### Refactoring Strategy
1. Identify fields most used in filter conditions
2. Create payload indexes: `collection.create_payload_index(field_name="category")`
3. Benchmark filter performance before and after indexing
4. Create indexes for all filterable fields in each collection
5. Document payload index configuration
### Detection Checklist
- [ ] Payload indexes created on filtered fields
- [ ] Filter performance benchmarked with indexes
- [ ] Index creation included in collection setup
- [ ] Index configuration documented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Using must_not for Exclusion When must Is More Efficient
### Category
Performance | Architecture
### Description
Using `must_not` conditions for exclusions when positive `must` conditions would be more efficient, causing slower query performance.
### Why It Happens
`must_not` seems intuitive for exclusion logic. Developers don't consider the performance difference between positive and negative conditions.
### Warning Signs
- Excessive use of `must_not` in filter expressions
- Filters that exclude one or two values from a large set
- Slow queries with many `must_not` conditions
- Performance degrades as excluded value list grows
### Why Harmful
`must_not` requires scanning and excluding results, which is computationally more expensive than positive matching. A `must` condition narrows the search space; `must_not` only removes from already-found results.
### Consequences
- Filter performance degradation with exclusion-heavy queries
- Higher query latency than necessary
- Unnecessary server resource consumption
- Poor UX for queries with excluded values
### Alternative
Restructure filters: use positive `must` conditions to match included values instead of `must_not` to exclude.
### Refactoring Strategy
1. Review filter logic for must_not usage
2. Convert must_not exclusions to must inclusions where feasible
3. For small exclusion sets (1-2 values), keep must_not if conversion adds complexity
4. Benchmark must_not vs equivalent must performance
5. Document guidance on when to use each filter type
### Detection Checklist
- [ ] Must_not usage minimized
- [ ] Positive must conditions preferred
- [ ] Performance compared between approaches
- [ ] Team guidance documented
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Storing Large Payload Data That Slows Index Performance
### Category
Performance | Architecture
### Description
Storing large content (descriptions, full text, images) in payload metadata, increasing index size and slowing query performance.
### Why It Happens
It's convenient to store everything with the vector. Developers don't consider the index performance impact of large payloads.
### Warning Signs
- Payload size > 1KB per point
- Description or full-text content stored in payload
- Index size much larger than vector size would suggest
- Slow index loading and query warm-up times
### Why Harmful
Large payloads dramatically increase index size. Qdrant must read and process this data during queries even when it's not needed for filtering. Index memory usage spikes.
### Consequences
- Larger memory footprint for Qdrant
- Slower point lookup and retrieval
- Higher hosting costs due to storage requirements
- Backup and restore operations slower
### Alternative
Store only filterable metadata in payload (IDs, status, category). Keep large content in the application database.
### Refactoring Strategy
1. Audit current payload sizes across collections
2. Remove non-filterable large content from payload
3. Store only: IDs, category, status, price, timestamps (filterable fields)
4. Move descriptions and full text back to application database
5. Re-index with leaner payloads
6. Monitor index size reduction
### Detection Checklist
- [ ] Payload size minimized (< 1KB per point)
- [ ] Only filterable metadata stored in payload
- [ ] Large content in application database
- [ ] Index size reduction verified
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Not Leveraging Geo Filters When Location Is Available
### Category
Functionality | User Experience
### Description
Having location data available but not using Qdrant's built-in geo-polygon, geo-radius, or geo-bounding-box filters for location-based search.
### Why It Happens
Teams implement custom geo-filtering in application code instead of using Qdrant's native geo operators.
### Warning Signs
- Location data stored but not used in filtering
- Custom distance calculation in application code
- Geo-filter applied as post-filter in PHP
- Qdrant geo operators ($geo_radius, $geo_polygon) not used
### Why Harmful
Custom geo-filtering in application code is slower, less accurate, and cannot leverage Qdrant's geo-indexed HNSW traversal. Users get slower location-based search.
### Consequences
- Slower geo-filtered searches
- Post-filtering removes relevant results after ANN
- Development effort maintaining custom geo-logic
- Missing accuracy of Qdrant's geo-indexed filtering
### Alternative
Use Qdrant's native $geo_radius or $geo_polygon filters in the query payload.
### Refactoring Strategy
1. Store geo coordinates in point payload as structured data
2. Replace custom geo-filtering with Qdrant's `$geo_radius` or `$geo_polygon`
3. Test geo-filter accuracy with known coordinates
4. Combine geo filter with other payload filters
5. Remove custom geo-filtering code
### Detection Checklist
- [ ] Geo coordinates in payload
- [ ] Qdrant geo operators used for filtering
- [ ] Custom geo-filtering code removed
- [ ] Geo-filter accuracy verified
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Complex Nested Filters Without Evaluation
### Category
Performance | Maintainability
### Description
Building deeply nested filter conditions with `$and`/`$should`/`$must_not` combinations without testing their performance or correctness.
### Why It Happens
Filter expressions grow organically. Each condition is added without reviewing the full expression tree.
### Warning Signs
- Nesting depth of 4+ levels in filter expressions
- Combined must/should/must_not in unpredictable patterns
- Filter bugs discovered in production
- Hard to reason about what the filter actually does
- No unit tests for filter logic
### Why Harmful
Complex nested filters are hard to reason about, debug, and optimize. They often produce incorrect or unexpected results due to logic errors in the expression structure.
### Consequences
- Filter bugs that are hard to reproduce and fix
- Performance degradation from complex expression evaluation
- High cognitive load for team members maintaining filters
- Missed filter optimizations hidden in complex nesting
### Alternative
Simplify filter expressions. Use the simplest filter structure that meets requirements. Unit test all filter combinations.
### Refactoring Strategy
1. Audit current filter expressions for complexity
2. Simplify: reduce nesting depth, flatten conditions
3. Use separate queries instead of combining in one expression if too complex
4. Add unit tests for each filter combination
5. Document filter logic with examples
6. Benchmark simplified vs complex expression performance
### Detection Checklist
- [ ] Filter nesting depth limited (max 2-3 levels)
- [ ] Filter logic documented
- [ ] Unit tests cover filter combinations
- [ ] No filter bugs in production
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy

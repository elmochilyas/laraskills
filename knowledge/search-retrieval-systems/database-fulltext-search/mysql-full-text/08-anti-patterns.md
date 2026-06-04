# ECC Anti-Patterns — MySQL Full-Text Search
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | MySQL Full-Text Search | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. FULLTEXT Index Not Created
2. Natural Language Mode 50% Threshold Trap
3. Default Minimum Token Size Mismatch
4. Mixing FULLTEXT with Non-FULLTEXT Columns
5. Expecting Dedicated Search Features from MySQL FTS
---
## Repository-Wide Anti-Patterns
- Trusting `LIKE %term%` for production search
- Not verifying FULLTEXT indexes exist via EXPLAIN
- Using MySQL FTS without understanding Boolean vs Natural Language Mode
---
## Anti-Pattern 1: FULLTEXT Index Not Created
### Category
Performance
### Description
Adding `#[SearchUsingFullText]` attribute to a model without creating the corresponding FULLTEXT index in the database, causing Scout to silently fall back to `LIKE` queries that are 100-1000x slower.
### Why It Happens
The attribute only changes query syntax — it doesn't create the index. Developers add the attribute but forget the migration step.
### Warning Signs
- Search queries are slow despite SearchUsingFullText attribute
- EXPLAIN shows full table scan instead of FULLTEXT index usage
- Query log shows `LIKE` queries instead of `MATCH...AGAINST`
- No `$table->fullText(...)` migration exists
### Why Harmful
Users experience 1-10 second search latency. Database CPU spikes to 100% on every search. The attribute is effectively decorative — no performance gain.
### Consequences
- Slow search response times
- Database resource exhaustion from full table scans
- Poor user experience: "search is broken"
### Alternative
Always create FULLTEXT indexes in a migration before applying the attribute: `$table->fullText(['title', 'body'])`.
### Refactoring Strategy
1. Create migration adding FULLTEXT index: `Schema::table('posts', fn($t) => $t->fullText(['title', 'body']))`
2. Verify with `EXPLAIN SELECT ... MATCH ... AGAINST` that index is used
3. Ensure SearchUsingFullText attribute columns match indexed columns
4. Measure query time before and after index creation
### Detection Checklist
- [ ] FULLTEXT index exists matching SearchUsingFullText attribute columns
- [ ] EXPLAIN shows FULLTEXT index usage
- [ ] Query time within expected range (<100ms for 50K records)
- [ ] No LIKE queries in search query log
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Natural Language Mode 50% Threshold Trap
### Category
Reliability
### Description
Using MySQL FULLTEXT in Natural Language Mode (default), causing searches for common terms to return zero results because the term appears in >50% of rows.
### Why It Happens
MySQL's default FULLTEXT search mode is Natural Language. Developers don't explicitly set Boolean Mode. Common words return empty results without error.
### Warning Signs
- Searching for very common terms returns zero results
- Search for "published" status returns nothing when >50% of records have that status
- Search works for rare terms but fails for common ones
- No error or warning when zero results are returned
### Why Harmful
Silent failures are dangerous. Users type common, valid search terms and see "no results." They think the content doesn't exist. Critical search paths are broken for ubiquitous terms.
### Consequences
- Users can't find content with common terms
- Zero results for broad searches
- Support tickets: "I know the data is there but search can't find it"
### Alternative
Use Boolean Mode (Scout's default with database engine) which doesn't have the 50% threshold.
### Refactoring Strategy
1. Scout's database engine uses Boolean Mode by default — verify this
2. If using raw MySQL: add `IN BOOLEAN MODE` to MATCH...AGAINST
3. Test search with common terms (appearing in 50%+ of records)
4. Verify results are returned for all search terms
### Detection Checklist
- [ ] Boolean Mode used (not Natural Language)
- [ ] Common terms return expected results
- [ ] No silent zero-result issues for broad searches
- [ ] Scout database engine configured properly
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Default Minimum Token Size Mismatch
### Category
Performance | Reliability
### Description
Not configuring MySQL's `innodb_ft_min_token_size` (default 3), causing short but meaningful words (ID, SKU, AI, 2FA, etc.) to be excluded from the FULLTEXT index.
### Why It Happens
Default setting works for most natural language content. Developers with technical content (code, abbreviations, SKUs) discover that short terms return zero results.
### Warning Signs
- Search for "SKU-123" returns zero results
- Two-letter terms like "AI" or "ID" not found
- Three-letter terms like "KEY" or "API" not found
- Technical identifiers with short segments not searchable
### Why Harmful
Content indexed but short terms are invisible to search. Users can't find content by technical identifiers, abbreviations, or short keywords. The search index silently ignores these terms.
### Consequences
- Technical users frustrated by inability to search short codes
- Product SKUs unsearchable
- Abbreviations return no results
### Alternative
Configure `innodb_ft_min_token_size` to 2 or 1 based on content type, or use `SearchUsingPrefix` for identifier fields.
### Refactoring Strategy
1. Review content types: does it contain short terms (SKUs, codes, abbreviations)?
2. Set `innodb_ft_min_token_size=2` in MySQL config (requires restart)
3. Rebuild FULLTEXT index: `REPAIR TABLE posts QUICK`
4. For identifiers: add `SearchUsingPrefix` attribute instead
5. Test search with short terms after reconfiguration
### Detection Checklist
- [ ] innodb_ft_min_token_size configured for content type
- [ ] Short terms return expected results
- [ ] Technical identifiers searchable
- [ ] FULLTEXT index rebuilt after configuration change
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Mixing FULLTEXT with Non-FULLTEXT Columns
### Category
Performance
### Description
Listing non-FULLTEXT-indexed columns in the `#[SearchUsingFullText]` attribute array alongside FULLTEXT-indexed columns, causing Scout to fall back to `LIKE` queries for the entire search.
### Why It Happens
Developers add all searchable attributes to the attribute array regardless of index status. If any column listed lacks a FULLTEXT index, Scout falls back to `LIKE` for the whole query.
### Warning Signs
- EXPLAIN shows no FULLTEXT index usage despite indexes existing on some columns
- Mixed performance: some searches fast, some slow
- Attribute includes both indexed and non-indexed columns
- Developers unsure which columns have FULLTEXT indexes
### Why Harmful
The presence of a single non-indexed column in the attribute array degrades the entire query to `LIKE` scans. The effort of creating FULLTEXT indexes on other columns is wasted.
### Consequences
- FULLTEXT indexes created but unused
- Performance regression after adding a non-indexed column to the attribute
- Confusing: indexes exist but queries are still slow
### Alternative
Only list FULLTEXT-indexed columns in `SearchUsingFullText`. Use `SearchUsingPrefix` for identifier columns. Keep searchable attributes aligned with indexed columns.
### Refactoring Strategy
1. Audit which columns have FULLTEXT indexes
2. Remove non-FULLTEXT columns from SearchUsingFullText attribute
3. Add SearchUsingPrefix for identifier columns if needed
4. Add FULLTEXT indexes to additional columns if needed
5. Verify EXPLAIN shows FULLTEXT index usage after refactoring
### Detection Checklist
- [ ] SearchUsingFullText lists only FULLTEXT-indexed columns
- [ ] Non-FULLTEXT columns use SearchUsingPrefix attribute
- [ ] EXPLAIN shows FULLTEXT index usage
- [ ] No LIKE fallback for mixed column queries
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Expecting Dedicated Search Features from MySQL FTS
### Category
Design | Reliability
### Description
Building a search UX that depends on typo tolerance, fuzzy matching, synonym expansion, facet counts, or personalized ranking — features MySQL FULLTEXT cannot provide — while using the database engine.
### Why It Happens
Scout's abstraction makes engines interchangeable in code but not in features. Developers design for Algolia/Meilisearch features while running MySQL.
### Warning Signs
- "Did you mean" suggestions needed but MySQL doesn't provide them
- Faceted search UI with count breakdown — not possible in MySQL FTS
- Typo tolerance expected in search results
- Personalized ranking needed for search relevance
### Why Harmful
Search UX must be dumbed down, or complex application-level workarounds must be built. These workarounds are slow, memory-intensive, and bug-prone compared to native engine features.
### Consequences
- Poor search UX compared to applications with dedicated engines
- Complex PHP-level faceting and typo tolerance implementations
- Late and risky migration to dedicated engine
### Alternative
If advanced search features are required, use a dedicated engine (Meilisearch, Typesense, Algolia) from the start. Match engine choice to feature requirements.
### Refactoring Strategy
1. Document required search features
2. If MySQL FTS can't provide them: plan migration to dedicated engine
3. Implement feature parity during migration
4. Test all search features on the new engine before cutover
5. Decommission MySQL FTS-based search after migration
### Detection Checklist
- [ ] Required search features match MySQL FTS capabilities
- [ ] No complex workarounds for missing engine features
- [ ] Feature requirements justify current engine choice
- [ ] Migration plan documented if features are needed later
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design

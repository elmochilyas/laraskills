# ECC Anti-Patterns — SearchUsingFullText Attribute
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | SearchUsingFullText Attribute | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Attribute Without Matching FULLTEXT Index
2. Attribute on Non-Text Columns
3. Mixing Indexed and Non-Indexed Columns in Attribute
4. Forgetting to Add Attribute After Creating Index
5. Attribute on Columns With Wrong Collation/Encoding
---
## Repository-Wide Anti-Patterns
- Adding the attribute but not creating the corresponding index
- Assuming the attribute alone provides performance benefit
- Not verifying index usage with EXPLAIN
---
## Anti-Pattern 1: Attribute Without Matching FULLTEXT Index
### Category
Performance
### Description
Applying `#[SearchUsingFullText]` to model columns without creating the corresponding FULLTEXT/GIN index, making the attribute decorative — Scout still falls back to LIKE queries.
### Why It Happens
The attribute is code-side; the index is database-side. Developers add the attribute without creating the migration.
### Warning Signs
- SearchUsingFullText attribute present but no FULLTEXT index in database
- EXPLAIN shows table scan instead of FULLTEXT index
- Query log shows LIKE queries despite the attribute
- Performance is the same with or without the attribute
### Why Harmful
The attribute changes query syntax but without the index, MySQL ignores the syntax and falls back to LIKE. Performance is 100-1000x slower than expected.
### Consequences
- No performance benefit from the attribute
- Developers confused: "I set up the attribute, why is search slow?"
- FULLTEXT index never created in production
### Alternative
Always create the FULLTEXT index in a migration before or alongside the attribute application.
### Refactoring Strategy
1. Create migration: `Schema::table('posts', fn($t) => $t->fullText(['title', 'body']))`
2. Verify index exists: `SHOW INDEX FROM posts WHERE Index_type = 'FULLTEXT'`
3. Test with EXPLAIN that FULLTEXT index is used
4. Measure query time improvement
### Detection Checklist
- [ ] FULLTEXT index created matching attribute columns exactly
- [ ] EXPLAIN shows FULLTEXT index usage
- [ ] Query time within expected range
- [ ] Index created in all environments
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Attribute on Non-Text Columns
### Category
Performance | Reliability
### Description
Applying `SearchUsingFullText` to non-text columns (integers, booleans, dates, ENUMs) where FULLTEXT indexes cannot be created or provide no benefit.
### Why It Happens
Developers add all searchable columns to the attribute regardless of type, thinking more is better.
### Warning Signs
- Integer, boolean, or date columns listed in SearchUsingFullText attribute
- FULLTEXT index creation fails on non-text columns
- Fallback to LIKE for the entire query because one column can't be FULLTEXT-indexed
- MySQL error when trying to create FULLTEXT index on non-text column
### Why Harmful
FULLTEXT indexes only work on CHAR, VARCHAR, and TEXT columns. Including non-text columns forces Scout to fall back to LIKE for the entire query, negating the benefit on columns that could use FULLTEXT.
### Consequences
- FULLTEXT index cannot be created on non-text columns
- Entire search falls back to LIKE
- Effort wasted on wrong column types
### Alternative
Only apply `SearchUsingFullText` to text-based columns (CHAR, VARCHAR, TEXT). Use `SearchUsingPrefix` for identifier columns and standard B-tree indexes for exact-match filtering.
### Refactoring Strategy
1. Remove non-text columns from SearchUsingFullText attribute
2. For identifier columns: use SearchUsingPrefix instead
3. For exact-match filtering: use Scout where() with B-tree indexed columns
4. Verify FULLTEXT index covers only text columns
5. Test search performance after correction
### Detection Checklist
- [ ] SearchUsingFullText only on CHAR/VARCHAR/TEXT columns
- [ ] Non-text columns use appropriate alternative (SearchUsingPrefix, where())
- [ ] FULLTEXT index creation succeeds
- [ ] EXPLAIN shows FULLTEXT index usage
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Mixing Indexed and Non-Indexed Columns in Attribute
### Category
Performance
### Description
Listing both FULLTEXT-indexed columns and non-indexed columns in the same `SearchUsingFullText` attribute array, causing Scout to fall back to LIKE for the entire query.
### Why It Happens
Developers add all searchable columns to the attribute without verifying each one has a FULLTEXT index. One non-indexed column ruins it for the rest.
### Warning Signs
- EXPLAIN shows LIKE query despite FULLTEXT index existing on some columns
- Some attribute columns have FULLTEXT index, some don't
- Adding a new column to the attribute without adding its index
- Performance regression after adding a new column to the attribute
### Why Harmful
The presence of a single non-indexed column in the attribute forces the entire search query to use LIKE. FULLTEXT indexes on other columns are ignored.
### Consequences
- FULLTEXT indexes created but not used
- Developers misled into thinking they have FULLTEXT search
- Performance degradation over time as more columns added
### Alternative
Ensure every column listed in `SearchUsingFullText` has a corresponding FULLTEXT index. Keep indexed and non-indexed searchable columns separate.
### Refactoring Strategy
1. Audit each column in SearchUsingFullText for FULLTEXT index existence
2. Create missing FULLTEXT indexes
3. If index can't be created (not text type): move column to SearchUsingPrefix
4. Remove non-indexed columns from SearchUsingFullText
5. Verify with EXPLAIN that FULLTEXT index is used after cleanup
### Detection Checklist
- [ ] Every SearchUsingFullText column has FULLTEXT index
- [ ] EXPLAIN shows FULLTEXT index usage
- [ ] No mixed indexed/non-indexed columns in attribute
- [ ] New columns added with matching index
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Forgetting to Add Attribute After Creating Index
### Category
Performance
### Description
Creating FULLTEXT indexes in the database but forgetting to apply the `SearchUsingFullText` attribute to the model, so Scout never knows about the indexes and continues using LIKE queries.
### Why It Happens
Developers create the migration for FULLTEXT index but forget the model attribute. Search works, so they don't notice the performance issue.
### Warning Signs
- FULLTEXT index exists in the database
- EXPLAIN shows LIKE query (not MATCH...AGAINST)
- No SearchUsingFullText attribute on the model
- Search performance is the same as before index creation
### Why Harmful
The index exists but Scout doesn't use it. The query syntax remains LIKE. The index creation effort and storage overhead are wasted.
### Consequences
- Index storage used but never utilized
- Search performance unchanged despite index creation
- Developers think index is working but it's not
### Alternative
Always apply `SearchUsingFullText` to the model immediately after creating FULLTEXT indexes.
### Refactoring Strategy
1. Add `#[SearchUsingFullText(['title', 'body'])]` to the model
2. Verify EXPLAIN shows FULLTEXT index usage after adding attribute
3. Test search performance improvement
4. Add deployment checklist: create index in migration, add attribute to model
### Detection Checklist
- [ ] SearchUsingFullText attribute applied to model
- [ ] EXPLAIN shows FULLTEXT index usage (MATCH...AGAINST)
- [ ] Performance improvement confirmed
- [ ] Feature checklist ensures both index and attribute are in place
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Attribute on Columns With Wrong Collation/Encoding
### Category
Reliability
### Description
Applying `SearchUsingFullText` to columns with collation or encoding incompatible with FULLTEXT indexing (e.g., non-UTF8 charset, binary collation), causing index creation to fail or produce poor results.
### Why It Happens
Legacy databases may use non-standard character sets. Developers don't check table collation before applying FULLTEXT features.
### Warning Signs
- FULLTEXT index creation fails with charset error
- FULLTEXT index created but search misses accented characters
- Non-ASCII characters not matched in search
- MySQL error 1214: "Incorrect charset"
### Why Harmful
Wrong collation or encoding prevents FULLTEXT index creation entirely, or creates an index that doesn't handle Unicode correctly.
### Consequences
- Index creation blocked by charset incompatibility
- Accented/unusual characters unsearchable
- Migration updates needed for table collation
### Alternative
Ensure columns are using UTF-8 encoding (utf8mb4) with appropriate collation (utf8mb4_unicode_ci) before creating FULLTEXT indexes.
### Refactoring Strategy
1. Check column charset: `SHOW FULL COLUMNS FROM posts`
2. Convert to utf8mb4: `ALTER TABLE posts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
3. Create FULLTEXT index after charset conversion
4. Test with accented and special characters
5. Document charset requirements for FULLTEXT search
### Detection Checklist
- [ ] Columns use utf8mb4 charset
- [ ] Collation is utf8mb4_unicode_ci or compatible
- [ ] FULLTEXT index creation succeeds
- [ ] Accented/special characters searchable
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design

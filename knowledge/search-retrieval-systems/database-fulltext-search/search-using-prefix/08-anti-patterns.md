# ECC Anti-Patterns — SearchUsingPrefix Attribute
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | SearchUsingPrefix Attribute | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Using SearchUsingPrefix for Free-Text Content
2. Missing B-Tree Index on Prefixed Columns
3. Case-Insensitive Collation Mismatch (PostgreSQL)
4. Leading Wildcard Search Instead of Prefix
5. Not Combining SearchUsingPrefix with SearchUsingFullText
---
## Repository-Wide Anti-Patterns
- Using prefix matching for full-text content where FULLTEXT is better
- Not ensuring B-tree indexes exist on prefixed columns
- Confusing prefix matching with full-text tokenization
---
## Anti-Pattern 1: Using SearchUsingPrefix for Free-Text Content
### Category
Performance | Reliability
### Description
Applying `SearchUsingPrefix` to free-text columns (title, body, description) where full-text tokenization would provide better search quality and performance.
### Why It Happens
Developers apply SearchUsingPrefix to all searchable columns without distinguishing between identifiers and free-text content.
### Warning Signs
- `SearchUsingPrefix` applied to `title`, `body`, or `description` columns
- Search matches only from the start of words (prefix) instead of anywhere
- Users can't find content by words in the middle of text
- No `SearchUsingFullText` attribute used alongside it
### Why Harmful
Prefix matching only searches from the start of the column value. Users can't find content by words appearing in the middle of sentences. Search quality is poor for natural language content.
### Consequences
- Users can't find content by keywords in the middle of text
- Search returns no results for valid content
- Poor user experience: "I know the word is there but search can't find it"
### Alternative
Use `SearchUsingFullText` for free-text content columns. Use `SearchUsingPrefix` only for identifier fields (emails, SKUs, usernames).
### Refactoring Strategy
1. Move text content columns from SearchUsingPrefix to SearchUsingFullText
2. Create FULLTEXT indexes for text columns
3. Keep SearchUsingPrefix only for identifier columns
4. Verify search quality improvement for partial word matching
5. Test both identifier and text search scenarios
### Detection Checklist
- [ ] SearchUsingPrefix only on identifier columns (email, SKU, username)
- [ ] Text content columns use SearchUsingFullText
- [ ] FULLTEXT indexes exist for text columns
- [ ] Users can find content by words in any position
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Missing B-Tree Index on Prefixed Columns
### Category
Performance
### Description
Applying `SearchUsingPrefix` to columns without a B-tree index, causing the prefix `LIKE 'term%'` query to perform a full table scan instead of an index range scan.
### Why It Happens
Developers apply the attribute without considering database indexing. Prefix LIKE can use B-tree indexes, but only if they exist.
### Warning Signs
- EXPLAIN shows table scan on prefixed column queries
- Search on prefixed columns is slow
- No B-tree index on the prefixed column
- `CREATE INDEX` migration missing for the column
### Why Harmful
Without a B-tree index, prefix LIKE must scan every row. For large tables, this is 100-1000x slower than an index range scan.
### Consequences
- Slow identifier search on large tables
- Database CPU spikes from full table scans
- Poor search-as-you-type performance
### Alternative
Create a B-tree index on any column using `SearchUsingPrefix`. The index makes prefix LIKE extremely fast.
### Refactoring Strategy
1. Create B-tree index: `Schema::table('users', fn($t) => $t->index(['email']))`
2. For multiple prefix columns: consider composite index
3. For case-insensitive search (PostgreSQL): use `citext` extension or `lower()` index
4. Verify EXPLAIN shows index range scan after index creation
5. Measure query time improvement
### Detection Checklist
- [ ] B-tree index exists on each SearchUsingPrefix column
- [ ] EXPLAIN shows index range scan (not table scan)
- [ ] Prefix search latency <50ms
- [ ] Index creation documented in migration
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Case-Insensitive Collation Mismatch (PostgreSQL)
### Category
Reliability
### Description
Using `SearchUsingPrefix` on PostgreSQL columns without handling case sensitivity, causing `LIKE 'term%'` to miss results that differ in case (e.g., searching "john" misses "John").
### Why It Happens
PostgreSQL's default `LIKE` is case-sensitive (unlike MySQL's default). Developers coming from MySQL don't anticipate this difference.
### Warning Signs
- Search for lowercase "john" returns no results when data has "John"
- Case-insensitive search expected but not working
- PostgreSQL database with standard collation
- MySQL-to-PostgreSQL migration broken prefix search
### Why Harmful
Users expect search to be case-insensitive. Case-sensitive prefix matching misses valid results, making identifier search unreliable.
### Consequences
- Users can't find their own account by typing their lowercase email
- Product SKU search fails because of case mismatch
- Support tickets: "I searched for my order number and got nothing"
### Alternative
Use `ILIKE` (case-insensitive LIKE) for PostgreSQL, or create case-insensitive indexes using `citext` or functional `lower()` indexes.
### Refactoring Strategy
1. For PostgreSQL: Scout may need engine-specific callback for ILIKE
2. Add `citext` extension and use `citext` column type
3. Or create functional index: `CREATE INDEX ON users (lower(email))`
4. Or set case-insensitive collation on the column
5. Test both lowercase and mixed-case searches
### Detection Checklist
- [ ] Case-insensitive prefix search works on PostgreSQL
- [ ] Users can search regardless of input case
- [ ] Index supports case-insensitive lookups
- [ ] Migration from MySQL accounts for case sensitivity difference
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Leading Wildcard Search Instead of Prefix
### Category
Performance
### Description
Searching with leading wildcards (`LIKE '%term%'` or `LIKE '%term'`) on prefixed columns, which cannot use B-tree indexes and forces full table scans.
### Why It Happens
Users (or autocomplete implementations) enter partial terms expecting to match anywhere in the value. `%term%` is a common pattern in non-Scout search implementations.
### Warning Signs
- Search queries logged as `LIKE '%term%'` instead of `LIKE 'term%'`
- Full table scans on identifier searches
- Slow search-as-you-type responses
- User typing triggers search as soon as they type (no prefix anchor)
### Why Harmful
Leading wildcard queries cannot use B-tree indexes. Every search scans the entire table, regardless of how good the index is. Performance degrades with data size.
### Consequences
- Very slow search for partial inputs
- Users give up on search because it's too slow
- Server CPU spikes from full table scans
### Alternative
Only support prefix matching (search from start of value). If full substring matching is needed, consider `SearchUsingFullText` or a dedicated engine.
### Refactoring Strategy
1. Ensure user input triggers prefix search: `$query . '%'`
2. Modify autocomplete to wait until 2-3 characters typed (meaningful prefix)
3. If substring search is required: use FULLTEXT or dedicated engine
4. Add validation: reject or transform search queries with leading wildcard
5. Monitor query log for leading wildcard patterns
### Detection Checklist
- [ ] Search queries use prefix only (trailing %)
- [ ] No leading wildcard (%term) in search queries
- [ ] B-tree index being used (index range scan)
- [ ] Autocomplete triggers only after meaningful prefix length
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Not Combining SearchUsingPrefix with SearchUsingFullText
### Category
Design | Performance
### Description
Using only `SearchUsingPrefix` on a model that has both identifier and text content, missing the performance and quality benefits of FULLTEXT search for content columns.
### Why It Happens
Developers apply one attribute and don't realize they can combine multiple attributes on the same model.
### Warning Signs
- Model has both text and identifier columns but only one attribute type
- Text content searched via prefix (poor quality for natural language)
- No `SearchUsingFullText` despite having text content
- SearchUsingPrefix applied to all columns including text
### Why Harmful
Text content searched via prefix only matches from the start of the value. Users can't find content by keywords in the middle of text. Performance is suboptimal compared to FULLTEXT.
### Consequences
- Poor search quality for text content
- Missed results for partial word matches in text
- Better performance available but not utilized
### Alternative
Combine both attributes: `SearchUsingPrefix` for identifier columns and `SearchUsingFullText` for text content columns.
### Refactoring Strategy
1. Split columns by type: identifiers vs free-text
2. Apply `#[SearchUsingPrefix(['email', 'sku'])]`
3. Apply `#[SearchUsingFullText(['title', 'body'])]`
4. Create appropriate indexes (B-tree for prefix, FULLTEXT for text)
5. Test both search types work correctly
### Detection Checklist
- [ ] Both SearchUsingPrefix and SearchUsingFullText applied
- [ ] Identifier columns use prefix, text columns use FULLTEXT
- [ ] Appropriate indexes created per column type
- [ ] Search quality and performance optimal for both content types
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design

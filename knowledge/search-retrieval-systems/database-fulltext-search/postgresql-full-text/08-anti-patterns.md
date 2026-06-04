# ECC Anti-Patterns — PostgreSQL Full-Text Search
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | PostgreSQL Full-Text Search | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Missing GIN Index on tsvector
2. Runtime tsvector Computation Instead of Generated Columns
3. Wrong Text Search Configuration for Language
4. Using to_tsquery() with Raw User Input
5. Ignoring GIN Index Bloat
---
## Repository-Wide Anti-Patterns
- Full sequential scans on tsvector queries
- Same text search configuration for all languages
- No REINDEX maintenance plan for GIN indexes
---
## Anti-Pattern 1: Missing GIN Index on tsvector
### Category
Performance
### Description
Performing `tsvector @@ tsquery` searches without a GIN index on the tsvector column, causing PostgreSQL to perform a full sequential scan on every search query.
### Why It Happens
Developers create the tsvector column but forget to create the GIN index. The query "works" but gets progressively slower as data grows.
### Warning Signs
- EXPLAIN shows Sequential Scan on tsvector queries
- Search slows down proportionally to table growth
- No GIN index in database schema
- Query plans show `Seq Scan` instead of `Bitmap Index Scan`
### Why Harmful
Without GIN index, every search scans the entire table. A 1M record table requires reading and ranking every row for every search query. Search becomes unusable at scale.
### Consequences
- Search latency measured in seconds, not milliseconds
- Database CPU and I/O spike on every search
- Users experience timeout or slow responses
### Alternative
Always create a GIN index on the tsvector column: `CREATE INDEX posts_search_idx ON posts USING GIN(search_vector)`.
### Refactoring Strategy
1. Create GIN index: `CREATE INDEX CONCURRENTLY posts_search_idx ON posts USING GIN(search_vector)`
2. Verify with EXPLAIN that index is being used
3. Measure query performance before and after
4. Add index creation to migrations for new environments
### Detection Checklist
- [ ] GIN index exists on tsvector column
- [ ] EXPLAIN shows Bitmap Index Scan for tsvector queries
- [ ] Search latency <100ms for typical queries
- [ ] Index creation documented in migrations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Runtime tsvector Computation Instead of Generated Columns
### Category
Performance
### Description
Computing the `tsvector` at query time (e.g., `WHERE to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('search')`) instead of using a generated column, adding significant CPU overhead to every search query.
### Why It Happens
Developers write inline tsvector conversions in queries. It's the first approach that works. Generated columns are a more advanced feature.
### Warning Signs
- Queries use `to_tsvector()` in the WHERE clause
- EXPLAIN shows function evaluation per row
- High CPU usage during search queries
- No generated tsvector column in table schema
### Why Harmful
`to_tsvector()` is CPU-intensive — it tokenizes, stems, and normalizes text. Computing it at query time for every row is wasteful. The same computation is repeated on each query, even though the source text hasn't changed.
### Consequences
- High CPU usage for search queries
- Slower response times due to per-row function evaluation
- Poor scalability as dataset grows
### Alternative
Use a generated tsvector column that computes once on write and reuses on read.
### Refactoring Strategy
1. Add generated column: `ALTER TABLE posts ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body, ''))) STORED`
2. Create GIN index on the generated column
3. Update queries to reference the column instead of inline to_tsvector()
4. Drop any redundant indexes on old expression-based approaches
5. Test query performance improvement
### Detection Checklist
- [ ] Generated tsvector column exists
- [ ] Queries reference the column, not inline to_tsvector()
- [ ] CPU usage decreased on search queries
- [ ] EXPLAIN shows index scan on generated column
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Wrong Text Search Configuration for Language
### Category
Reliability
### Description
Using the default English text search configuration for multilingual content, causing incorrect stemming, wrong stop words, and poor search quality for non-English content.
### Why It Happens
PostgreSQL defaults to English configuration. Developers don't specify per-column language, especially when the content is mostly English with some multilingual entries.
### Warning Signs
- German compound words not split correctly
- French accented characters causing missed matches
- Japanese text not tokenized at all
- Domain-specific terms incorrectly stemmed
- `SHOW default_text_search_config;` shows 'pg_catalog.english'
### Why Harmful
Wrong configuration produces bad search results: missed matches from incorrect stemming, false positives from wrong stop words, and poor relevance ranking. Non-English content is effectively unsearchable.
### Consequences
- Non-English users can't find content
- Poor search relevance for multilingual datasets
- Compound word search broken for Germanic languages
### Alternative
Specify the correct text search configuration per column using `to_tsvector('language', column)` with the appropriate language dictionary.
### Refactoring Strategy
1. Identify languages used in each text column
2. Create separate tsvector columns per language or use `regconfig` parameter
3. Update generated column to use correct config: `to_tsvector('french', body)`
4. For domain-specific terms: create custom text search dictionary
5. Create GIN indexes on each language-specific tsvector column
6. Test search quality for each language
### Detection Checklist
- [ ] Text search configuration matches column content language
- [ ] Non-English content search returns expected results
- [ ] Domain-specific terms handled correctly
- [ ] Custom dictionaries created where needed
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Using to_tsquery() with Raw User Input
### Category
Security
### Description
Passing raw user search input to `to_tsquery()` (which accepts boolean operators), allowing users to inject complex query syntax that can cause errors or expensive computation.
### Why It Happens
`to_tsquery()` accepts boolean operators (`&`, `|`, `!`) from input. Developers pass `$_GET['q']` directly without sanitization.
### Warning Signs
- Search query uses `to_tsquery($userInput)`
- User can enter `!term` to exclude results
- Complex boolean queries in search logs
- Errors when users enter special characters like `&` or `|`
### Why Harmful
Users can craft expensive queries that consume database resources. Malformed input causes SQL-like errors. Complex boolean combinations can create computationally expensive search operations.
### Consequences
- Potential DoS vector through expensive custom queries
- Error messages exposed to users from malformed queries
- Unpredictable search behavior from injected operators
### Alternative
Use `plainto_tsquery()` (strips operators, treats input as plain text) or `websearch_to_tsquery()` (safe web-style syntax parsing).
### Refactoring Strategy
1. Replace `to_tsquery()` with `plainto_tsquery()` (removes all operators)
2. If advanced search syntax is needed: use `websearch_to_tsquery()` (limited, safe syntax)
3. Validate and sanitize user input length (max 200 chars)
4. Test with special characters, boolean operators, and long strings
5. Add query complexity monitoring
### Detection Checklist
- [ ] plainto_tsquery() or websearch_to_tsquery() used for user input
- [ ] No raw to_tsquery() with user input
- [ ] User input sanitized and length-limited
- [ ] No query syntax injection possible
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Ignoring GIN Index Bloat
### Category
Operations | Performance
### Description
Not scheduling periodic `REINDEX` operations for GIN indexes on frequently updated tsvector columns, causing index bloat and degraded query performance over time.
### Why It Happens
GIN indexes on tsvector columns bloat under write-heavy workloads. Developers don't plan for index maintenance.
### Warning Signs
- GIN index size grows faster than table size
- Search query time increases gradually over weeks
- `REINDEX` dramatically shrinks the index size
- High write table with GIN index on tsvector
### Why Harmful
Bloat makes GIN indexes larger and slower. Insert performance degrades. Query performance degrades as the index tree becomes unbalanced. Disk usage grows unnecessarily.
### Consequences
- Gradually increasing search latency
- Disk space wasted on bloat
- Eventual need for emergency maintenance window REINDEX
### Alternative
Schedule periodic `REINDEX CONCURRENTLY` during low-traffic periods for GIN indexes on high-write tables.
### Refactoring Strategy
1. Monitor GIN index size vs table size ratio
2. Add REINDEX to maintenance schedule: weekly for high-write tables, monthly for low-write
3. Use `REINDEX INDEX CONCURRENTLY` to avoid locking
4. Set auto-vacuum settings for frequent updates
5. Track reindex effectiveness over time
### Detection Checklist
- [ ] REINDEX scheduled for GIN indexes
- [ ] Index size stable relative to table size
- [ ] Search query latency stable over time
- [ ] Critical indexes monitored for bloat
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search

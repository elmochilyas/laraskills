# ECC Anti-Patterns — Scout Database Engine
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | Scout Database Engine | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No FULLTEXT Index Created (LIKE Fallback)
2. Using Natural Language Mode (50% Threshold)
3. Expecting Dedicated Engine Features from Database Engine
4. Missing SearchUsingFullText/SearchUsingPrefix Attributes
5. Unoptimized MySQL/PostgreSQL FTS Configuration
---
## Repository-Wide Anti-Patterns
- Searching without FULLTEXT/GIN indexes
- Not setting SCOUT_DRIVER=database explicitly per environment
- Assuming database engine provides same features as dedicated engines
---
## Anti-Pattern 1: No FULLTEXT Index Created
### Category
Performance
### Description
Using Scout's database engine without creating FULLTEXT (MySQL) or GIN (PostgreSQL) indexes, causing Scout to fall back to `LIKE` queries that are 100-1000x slower.
### Why It Happens
Developers set `SCOUT_DRIVER=database` but forget the migration step for FULLTEXT indexes. The engine "works" — just slowly.
### Warning Signs
- EXPLAIN shows full table scan on search queries
- Search gets slower as data grows
- Query log shows `LIKE` instead of `MATCH...AGAINST`
- No `$table->fullText(...)` migration exists
### Why Harmful
LIKE queries with leading wildcards (`%term%`) cannot use B-tree indexes. Every search scans the entire table. Performance degrades linearly with table size.
### Consequences
- 1-10 second search latency on 50K+ record tables
- Database CPU spikes during search traffic
- Poor user experience: slow or timing out search
### Alternative
Create FULLTEXT (MySQL) or GIN (PostgreSQL) indexes via migrations: `$table->fullText(['title', 'body'])`.
### Refactoring Strategy
1. Create FULLTEXT/GIN indexes in a migration
2. Apply the `SearchUsingFullText` attribute to the model
3. Verify with EXPLAIN that indexes are used
4. Measure query time before and after
### Detection Checklist
- [ ] FULLTEXT/GIN index exists on search columns
- [ ] EXPLAIN shows index usage (not table scan)
- [ ] No LIKE queries in search query log
- [ ] Search latency <100ms for typical queries
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Using Natural Language Mode
### Category
Reliability
### Description
Using MySQL FULLTEXT's Natural Language Mode (default) instead of Boolean Mode, causing searches for terms appearing in >50% of rows to return zero results.
### Why It Happens
MySQL's default search mode is Natural Language. Developers don't configure Scout to use Boolean Mode explicitly.
### Warning Signs
- Common terms return zero results
- Search for "published" returns nothing when 60% of records are published
- Rare terms work fine, common terms don't
- No error or warning for zero results
### Why Harmful
The 50% threshold is a well-known MySQL trap. Users type common terms and see "no results." Critical, broad searches fail silently.
### Consequences
- Users can't find content with common search terms
- Support tickets: "search doesn't work for basic terms"
- Frustrated users who think content is missing
### Alternative
Use Boolean Mode which has no 50% threshold. Scout's database engine uses Boolean Mode by default.
### Refactoring Strategy
1. Verify Scout database engine uses Boolean Mode (check config)
2. If using raw SQL: add `IN BOOLEAN MODE` to MATCH...AGAINST
3. Test search with common terms
4. Verify results appear for terms in >50% of records
### Detection Checklist
- [ ] Boolean Mode active (not Natural Language)
- [ ] Common terms return expected results
- [ ] No 50% threshold issues
- [ ] Scout database engine properly configured
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Expecting Dedicated Engine Features
### Category
Design | Reliability
### Description
Building search UX that depends on features the database engine cannot provide: typo tolerance, faceted search, fuzzy matching, synonym expansion, personalized ranking.
### Why It Happens
Scout's API is the same regardless of engine. Developers design interactions around features they've seen in other search implementations without checking engine capabilities.
### Warning Signs
- Search UX expects "did you mean" suggestions
- Faceted search with counts required
- Typo tolerance expected in search results
- Autocomplete/search-as-you-type expected to be instantaneous
- Personalized ranking based on user history
### Why Harmful
The database engine cannot provide these features. UX expectations will not be met. Complex application-level workarounds are slow and unreliable compared to native engine features.
### Consequences
- Poor search UX compared to applications with dedicated engines
- Complex PHP-level workarounds for missing features
- Late, expensive migration to dedicated engine
### Alternative
Match search UX design to database engine capabilities. If advanced features are required, use a dedicated engine from the start.
### Refactoring Strategy
1. Document required search features
2. Compare against database engine capabilities
3. If gaps exist: plan migration to dedicated engine
4. If staying with database: simplify UX to match capabilities
5. Test UX assumptions with actual engine behavior
### Detection Checklist
- [ ] Search UX matches database engine capabilities
- [ ] No application-level workarounds for missing features
- [ ] Feature requirements documented
- [ ] Engine choice matches feature requirements
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Missing SearchUsingFullText/SearchUsingPrefix Attributes
### Category
Performance
### Description
Using the database engine without applying `SearchUsingFullText` or `SearchUsingPrefix` attributes, causing Scout to use slow default `LIKE` queries even when FULLTEXT indexes exist.
### Why It Happens
The attributes are an optional Scout feature. Developers create FULLTEXT indexes but don't tell Scout about them via the attributes.
### Warning Signs
- FULLTEXT index exists but Scout queries don't use it
- EXPLAIN shows LIKE query despite FULLTEXT index
- No `#[SearchUsingFullText]` attribute on the model
- Slow search despite having the right indexes
### Why Harmful
The effort of creating FULLTEXT indexes is wasted. Scout generates `LIKE` queries instead of `MATCH...AGAINST`. Performance is 100-1000x slower than it should be.
### Consequences
- FULLTEXT indexes created but unused
- Search performance degrades with data growth
- Developers confused: "I created the index, why is search slow?"
### Alternative
Apply `SearchUsingFullText` for text columns and `SearchUsingPrefix` for identifier columns to the model.
### Refactoring Strategy
1. Add `#[SearchUsingFullText(['title', 'body'])]` to the model
2. Add `#[SearchUsingPrefix(['email', 'sku'])]` for identifier fields
3. Verify EXPLAIN shows FULLTEXT index usage after attribute addition
4. Measure performance improvement
5. Add CI check for models with FULLTEXT indexes but missing attributes
### Detection Checklist
- [ ] SearchUsingFullText attribute applied to text columns
- [ ] SearchUsingPrefix attribute applied to identifier columns
- [ ] EXPLAIN shows index usage
- [ ] Query time within expected range
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Unoptimized MySQL/PostgreSQL FTS Configuration
### Category
Performance | Reliability
### Description
Using default database FTS configuration (MySQL's `innodb_ft_min_token_size=3`, PostgreSQL's English-only config) without tuning for specific content needs, causing poor search quality.
### Why It Happens
Default settings work for typical English content. Teams don't tune for their specific data: short codes, multilingual content, or domain-specific vocabulary.
### Warning Signs
- Short terms (SKUs, IDs, AI, 2FA) not searchable (MySQL)
- Non-English content returns poor results (PostgreSQL)
- Domain-specific terms incorrectly stemmed
- Stop words filter meaningful search terms
### Why Harmful
Search silently misses content that should be findable. Terms that users expect to work return no results. Non-English users have degraded search experience.
### Consequences
- Technical identifiers unsearchable
- Poor multilingual search quality
- Domain-specific vocabulary not indexed
- Users can't find content by important short terms
### Alternative
Tune database FTS configuration for content type: minimum token size, text search configuration, custom dictionaries.
### Refactoring Strategy
1. MySQL: review `innodb_ft_min_token_size` (default 3), set to 2 for technical content
2. PostgreSQL: set `default_text_search_config` per column language
3. Create custom text search dictionaries for domain-specific terms
4. Rebuild FULLTEXT/GIN indexes after configuration changes
5. Test search quality with actual content types
### Detection Checklist
- [ ] FTS configuration tuned for content type
- [ ] Short terms searchable if needed
- [ ] Multilingual configuration correct
- [ ] Domain-specific terms handled properly
- [ ] FULLTEXT/GIN indexes rebuilt after config change
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search

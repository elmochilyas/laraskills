# ECC Anti-Patterns — SQLite FTS5
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Database Full-Text Search | Knowledge Unit | SQLite FTS5 | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Using FTS5 Without External Content Tables
2. No Sync Triggers for FTS Index
3. Wrong Tokenizer for Content Language
4. Re-creating FTS Table on Every Deploy
5. Using FTS5 for Large Production Laravel Apps on MySQL/PostgreSQL
---
## Repository-Wide Anti-Patterns
- Building FTS5 without understanding virtual table limitations
- Not having backup strategy for FTS indexes
- Assuming FTS5 auto-syncs with source data
---
## Anti-Pattern 1: Using FTS5 Without External Content Tables
### Category
Maintainability | Reliability
### Description
Creating an FTS5 virtual table without the `content=` parameter, causing data duplication and sync complexity between the source table and the FTS index.
### Why It Happens
Basic FTS5 examples don't include the content= parameter. Developers create standalone FTS tables without linking to source data.
### Warning Signs
- FTS5 table created without `content=` parameter
- Source data duplicated in FTS table
- Manual INSERT/UPDATE/COPY needed to populate FTS
- Data drift between source and FTS index
### Why Harmful
Without external content reference, developers must manually keep the FTS index in sync with the source table. Any data change requires a separate update to the FTS table. Duplicate storage wastes space.
### Consequences
- Stale FTS index after data changes
- Complex sync code needed for data consistency
- Duplicate storage of indexed content
- Data drift bugs in production
### Alternative
Use `content=` parameter to link FTS5 to the source table, enabling automatic content synchronization.
### Refactoring Strategy
1. Recreate FTS5 table with `content=source_table` parameter
2. Set up triggers for INSERT/UPDATE/DELETE sync
3. Populate FTS index from source data
4. Remove manual sync code
5. Test data consistency between source and FTS
### Detection Checklist
- [ ] FTS5 created with content= parameter
- [ ] Sync triggers configured (INSERT/UPDATE/DELETE)
- [ ] No manual sync code needed
- [ ] Source and FTS data consistent
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: No Sync Triggers for FTS Index
### Category
Reliability
### Description
Not creating SQLite triggers to keep the FTS5 index synchronized with source data changes, causing the search index to become stale after inserts, updates, or deletes.
### Why It Happens
Developers create the FTS5 table and populate it once. They don't realize the index doesn't auto-sync.
### Warning Signs
- FTS5 returns stale results after data changes
- No INSERT/UPDATE/DELETE triggers in schema
- Manual rebuild needed to refresh search data
- New records missing from search results
### Why Harmful
Search results become increasingly out of date. Users can't find recently added content. Deleted content remains searchable.
### Consequences
- Stale search results
- Deleted data findable in search
- Manual rebuild needed after every data change
### Alternative
Create AFTER INSERT, AFTER UPDATE, and AFTER DELETE triggers on the source table to update the FTS5 index.
### Refactoring Strategy
1. Create trigger: `CREATE TRIGGER posts_ai AFTER INSERT ON posts BEGIN INSERT INTO posts_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body); END;`
2. Create UPDATE trigger
3. Create DELETE trigger
4. Test triggers with data modifications
5. Verify index stays in sync in real-time
### Detection Checklist
- [ ] INSERT trigger created for FTS sync
- [ ] UPDATE trigger created for FTS sync
- [ ] DELETE trigger created for FTS sync
- [ ] FTS index matches source data after modifications
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Wrong Tokenizer for Content Language
### Category
Reliability
### Description
Using the default FTS5 tokenizer for multilingual content, causing poor tokenization for non-English text, missing word boundaries, or incorrect stemming.
### Why It Happens
Default tokenizer works for English. Developers don't configure tokenizer explicitly, or choose one without testing with actual content.
### Warning Signs
- Non-English words not correctly tokenized
- Compound words split incorrectly
- Search misses results for inflected forms
- Unicode characters not handled properly
### Why Harmful
Non-English content becomes unsearchable or returns poor results. Users searching in their native language can't find relevant content.
### Consequences
- Poor search quality for non-English content
- Lost users from multilingual markets
- Incorrect search results for international content
### Alternative
Configure the appropriate tokenizer: `porter` for English stemming, `unicode61` for Unicode support, or a custom tokenizer for specific needs.
### Refactoring Strategy
1. Identify content languages
2. Choose tokenizer: `tokenize='porter unicode61'` for English Unicode, custom for others
3. Recreate FTS5 table with new tokenizer
4. Repopulate FTS index
5. Test search quality per language
### Detection Checklist
- [ ] Tokenizer configured for content language
- [ ] Non-English content correctly indexed
- [ ] Unicode text handled properly
- [ ] Search returns relevant results for all content languages
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Re-creating FTS Table on Every Deploy
### Category
Operations | Performance
### Description
Dropping and recreating the FTS5 virtual table on every deployment, causing unnecessary index rebuilds and temporary search downtime.
### Why It Happens
Developers treat FTS5 tables like application cache — flush and rebuild on deploy. They don't realize the index is persistent data that takes time to rebuild.
### Warning Signs
- Deployment script drops and recreates FTS tables
- Search unavailable during deploy
- FTS rebuild takes longer as data grows
- No incremental update strategy for FTS
### Why Harmful
Full FTS rebuild takes significant time on large datasets. Search is unavailable during rebuild. The index is rebuilt even when no schema changes occurred.
### Consequences
- Extended search downtime during deployments
- Wasted compute on unnecessary index rebuilds
- Growing deployment time as data grows
### Alternative
Only rebuild FTS when the schema changes. Use triggers for incremental updates during normal operation.
### Refactoring Strategy
1. Remove FTS rebuild from deployment script
2. Keep triggers for real-time sync
3. Only rebuild FTS when schema changes (new columns, tokenizer change)
4. For schema changes: plan maintenance window for rebuild
5. Monitor rebuild time trend
### Detection Checklist
- [ ] FTS table not dropped on deploy
- [ ] Triggers handle incremental updates
- [ ] Rebuilds only when schema changes
- [ ] No unnecessary search downtime during deploys
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: Using FTS5 for Large Production Laravel Apps on MySQL/PostgreSQL
### Category
Architecture | Performance
### Description
Using SQLite FTS5 (via SQLite database) for a production Laravel application that should be using MySQL or PostgreSQL, bypassing the main database's superior FTS capabilities.
### Why It Happens
Developers prototype with SQLite and FTS5, then don't migrate to a production database. Or they add FTS5 to an existing SQLite-based app without considering scale.
### Warning Signs
- Production app running on SQLite database
- Large dataset (>100K records) indexed in FTS5
- High-concurrency writes struggling with SQLite's single-writer limitation
- No MySQL/PostgreSQL with better FTS features
### Why Harmful
SQLite is a single-writer database. At production scale with concurrent users, write contention causes failures and timeouts. FTS5 on SQLite cannot match MySQL FULLTEXT or PostgreSQL tsvector performance at scale.
### Consequences
- Write contention and database lock errors
- Poor concurrent search performance
- Missing features: no GIN indexes, no Boolean Mode, no text search configurations
### Alternative
Use MySQL FULLTEXT or PostgreSQL tsvector for production Laravel applications. Keep SQLite FTS5 for development and testing only.
### Refactoring Strategy
1. Migrate from SQLite to MySQL/PostgreSQL
2. Create FULLTEXT/GIN indexes for search columns
3. Use Scout database engine with SearchUsingFullText attribute
4. Test search performance at scale with new database
5. Decommission SQLite FTS5 search
### Detection Checklist
- [ ] Production database is MySQL or PostgreSQL
- [ ] FULLTEXT or GIN indexes used for search
- [ ] SQLite not used in production
- [ ] Search performance acceptable at current scale
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design

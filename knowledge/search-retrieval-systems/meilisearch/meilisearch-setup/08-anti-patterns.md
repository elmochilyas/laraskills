# ECC Anti-Patterns — Meilisearch Setup
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Meilisearch | Knowledge Unit | Meilisearch Setup | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Authentication in Production
2. Treating Meilisearch as a Primary Database
3. Re-indexing Every Deployment
4. Over-declaring Filterable Attributes
5. Ignoring LMDB Corruption Risk (No Backups)
---
## Repository-Wide Anti-Patterns
- Running Meilisearch without authentication in production
- Not version-pinning the Meilisearch Docker image
- Not configuring dump/snapshot backups
---
## Anti-Pattern 1: No Authentication in Production
### Category
Security
### Description
Running a Meilisearch instance in production without setting `MEILI_MASTER_KEY`, leaving the search API completely unauthenticated and accessible to anyone who can reach the server.
### Why It Happens
Meilisearch works without authentication out of the box. Developers deploy the default Docker image without configuring the master key.
### Warning Signs
- No `MEILI_MASTER_KEY` set in production environment
- Anyone can access `http://meilisearch:7700/` and read/manage indexes
- Search API key endpoints exposed to the internet
- No authentication required for admin operations
### Why Harmful
Without authentication, anyone can read, modify, or delete all search indexes. Attackers can extract all indexed data (potentially containing PII), delete indexes, or inject malicious documents.
### Consequences
- Complete data exposure: all indexed data publicly accessible
- Index deletion: permanent data loss
- Document injection: malicious content in search results
- Compliance violation: GDPR/SOC 2 audit failure
### Alternative
Always set `MEILI_MASTER_KEY` in production. Use search-only API keys for frontend requests.
### Refactoring Strategy
1. Generate a strong master key: `openssl rand -base64 32`
2. Set `MEILI_MASTER_KEY=your-generated-key` in production .env
3. Restart Meilisearch with authentication enabled
4. Generate search-only API key for frontend use
5. Update Scout config: `'key' => env('MEILISEARCH_KEY')`
6. Test that unauthenticated requests are rejected
### Detection Checklist
- [ ] MEILI_MASTER_KEY set in production
- [ ] Search-only API key used for frontend
- [ ] Unauthenticated API requests rejected
- [ ] Master key never exposed in client-side code
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Treating Meilisearch as a Primary Database
### Category
Architecture | Reliability
### Description
Using Meilisearch as the primary data store instead of a search index, relying on it for data persistence and authority without backups or a source-of-truth database.
### Why It Happens
Meilisearch's auto-indexing and instant search make it tempting to query directly. Developers store data only in Meilisearch and skip the primary database.
### Warning Signs
- Data not stored in a primary database (MySQL/PostgreSQL)
- Application reads data exclusively from Meilisearch
- No data recovery path if Meilisearch is lost
- CRUD operations go through Meilisearch API, not Eloquent
### Why Harmful
Meilisearch is a search index, not a transactional database. It lacks ACID transactions, relational integrity, complex querying, and data durability guarantees. Index corruption or data loss means complete application data loss.
### Consequences
- Permanent data loss on index corruption
- No relational querying capability
- Data inconsistency from lack of transactions
- Difficult data migration and backup restore
### Alternative
Always store source data in a primary database (MySQL/PostgreSQL). Use Meilisearch exclusively for search indexing, synchronizing from the database via Scout.
### Refactoring Strategy
1. Identify all data stored only in Meilisearch
2. Migrate source data to primary database
3. Configure Scout to sync from database to Meilisearch
4. Update application reads to use Eloquent, not direct Meilisearch queries
5. Implement data recovery runbook using database backups
### Detection Checklist
- [ ] Primary database is the source of truth
- [ ] Meilisearch used only for search indexing
- [ ] Data can be recovered from database if Meilisearch is lost
- [ ] No CRUD operations depend solely on Meilisearch
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: Re-indexing Every Deployment
### Category
Operations | Performance
### Description
Running a full re-index (scout:import) on every deployment to Meilisearch, causing unnecessary search downtime and resource consumption when only incremental sync is needed.
### Why It Happens
Deployment scripts include scout:import as a safety measure. Teams don't distinguish between schema changes (need re-index) and code changes (no re-index needed).
### Warning Signs
- scout:import in every deployment step
- Search briefly unavailable during deploy
- Re-index takes growing time as dataset expands
- Deployments blocked by slow index rebuild
### Why Harmful
Full re-index is expensive. It reads all records from the database and sends them to Meilisearch. For 500K records, this takes 5-30 minutes, tying up deployment pipeline and potentially causing index downtime.
### Consequences
- Extended deployment windows (30+ minutes for re-index)
- Potential search downtime during index rebuild
- Unnecessary load on database and Meilisearch server
### Alternative
Only re-index when schema changes. For routine deploys, rely on incremental sync. Use scout:sync-index-settings separately for configuration changes.
### Refactoring Strategy
1. Remove scout:import from standard deployment pipeline
2. Add scout:sync-index-settings to deploy (settings are version-controlled)
3. Only run scout:import when toSearchableArray() or schema changes
4. For schema changes: use temporary index swap for zero-downtime
5. Document re-index triggers in deployment runbook
### Detection Checklist
- [ ] scout:import not in standard deployment pipeline
- [ ] scout:sync-index-settings in deploy
- [ ] Re-index only on schema changes
- [ ] Incremental sync handles daily operations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Over-declaring Filterable Attributes
### Category
Performance
### Description
Declaring too many filterable attributes in Meilisearch index settings, causing increased index size, slower indexing, and degraded search performance.
### Why It Happens
Developers declare every indexed field as filterable "just in case." Meilisearch builds additional data structures for each filterable attribute.
### Warning Signs
- More than 10-15 filterable attributes declared
- Indexing speed decreases as filterable attributes increase
- Meilisearch memory usage higher than expected for document count
- Most filterable attributes are rarely used in where() clauses
### Why Harmful
Each filterable attribute increases the index size and indexing time. Meilisearch must maintain additional data structures for filtering. Over-declaration wastes resources and slows down the system.
### Consequences
- Slower indexing operations
- Higher memory usage on the Meilisearch server
- Increased index storage requirements
- Slower search queries (less dramatic but measurable)
### Alternative
Only declare attributes that are actually used in `where()` or `whereIn()` clauses. Start minimal and add as needed.
### Refactoring Strategy
1. Audit all where() clauses in the codebase
2. Remove unused filterable attributes from scout.php config
3. Run scout:sync-index-settings to apply changes
4. Monitor index size and indexing speed after reduction
5. Add process: declare filterable only when a where() clause needs it
### Detection Checklist
- [ ] Filterable attributes match actual where() usage
- [ ] Index size appropriate for document count
- [ ] Indexing speed within expected range
- [ ] No unused filterable attributes declared
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Ignoring LMDB Corruption Risk
### Category
Operations | Reliability
### Description
Not configuring Meilisearch snapshots or dumps, leaving the search index without backup and vulnerable to LMDB corruption from unclean shutdowns.
### Why It Happens
Developers rely on Meilisearch's auto-persistence without understanding LMDB's corruption risk on power loss or crashes.
### Warning Signs
- No dump directory configured
- No snapshot schedule in Meilisearch config
- Meilisearch started without `--dump-dir` flag
- Data loss after server restart (LMDB corruption)
- Recovery involves full re-index from database (hours)
### Why Harmful
LMDB can corrupt on unclean shutdown. Without snapshots or dumps, recovery requires a full re-index from the database. For large datasets, this means hours of downtime and reprocessing.
### Consequences
- Hours of search downtime for complete re-index
- Potential data loss if database also has issues
- Emergency recovery procedures needed
- No backup to restore from
### Alternative
Configure automatic Meilisearch dumps and snapshots. Implement backup monitoring.
### Refactoring Strategy
1. Enable Meilisearch dumps: set `--dump-dir` flag or configure in `config.yaml`
2. Schedule automatic dumps: `--schedule-snapshot` or cron job
3. Store dumps in durable storage (S3, network volume)
4. Test restore procedure in staging
5. Monitor dump success/failure in production
### Detection Checklist
- [ ] Dumps enabled and scheduled
- [ ] Dumps stored in durable location
- [ ] Restore procedure tested
- [ ] LMDB corruption recovery plan documented
- [ ] Dump success monitored
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search

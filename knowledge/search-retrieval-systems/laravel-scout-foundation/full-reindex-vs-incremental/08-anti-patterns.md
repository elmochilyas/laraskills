# ECC Anti-Patterns — Full Re-index vs Incremental
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Full Re-index vs Incremental | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Re-index on Every Deploy
2. Never Re-index After Schema Changes
3. Import Without Eager Loading
4. Unmonitored Large-Scale Import
5. Incremental-Only After Bulk Data Migration
---
## Repository-Wide Anti-Patterns
- Confusing full re-index (scout:import) with incremental sync
- Running expensive re-index operations without monitoring progress
- Ignoring import chunk size tuning for large datasets
---
## Anti-Pattern 1: Re-index on Every Deploy
### Category
Performance | Scalability
### Description
Running `php artisan scout:import` as part of every deployment pipeline, unnecessarily rebuilding the entire search index when no schema changes occurred.
### Why It Happens
Deployment scripts copy-paste from tutorials that include scout:import. Teams default to "full rebuild" as the safest option without evaluating whether it's needed.
### Warning Signs
- Deployments take 10+ minutes due to scout:import
- Search index is briefly empty or incomplete during deployment
- CI/CD pipeline has scout:import as a mandatory step
### Why Harmful
Full re-index is expensive — it reads all records from the database, transforms them, and sends them to the search engine. Doing this on every deploy wastes compute, extends deployment windows, and risks search downtime.
### Consequences
- Longer deployment cycles (10-30 minutes for scout:import)
- Higher search engine costs from repeated full re-indexes
- Index downtime or degraded search during re-index
- Developer frustration with slow deployments
### Alternative
Only run full re-index when schema changes occur. For routine deploys, rely on incremental indexing for sync.
### Refactoring Strategy
1. Remove `scout:import` from standard deployment pipeline
2. Add schema-change detection: compare config before/after deploy
3. Create a separate "re-index" job that runs manually or on config change
4. Document when re-index is required (new fields, type changes, data repair)
5. Keep incremental indexing active for daily sync
### Detection Checklist
- [ ] scout:import not in CI/CD pipeline
- [ ] Re-index triggered only on schema change or on-demand
- [ ] Incremental indexing handles day-to-day sync
- [ ] Deployment duration under 5 minutes
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 2: Never Re-index After Schema Changes
### Category
Reliability | Maintainability
### Description
Adding new fields to `toSearchableArray()` or changing field types without running a full re-index, leaving existing index documents with the old schema.
### Why It Happens
Developers assume incremental sync will update existing records. But incremental sync only triggers on model save — existing records with the new schema format are never updated unless modified.
### Warning Signs
- New search fields only appear for newly created records
- After adding a field to toSearchableArray(), half the results are missing that field
- Filtering by a new field returns only recently modified records
### Why Harmful
Search results become inconsistent — some records have the new fields, others don't. Users see partial data. Queries that depend on new fields return incomplete results.
### Consequences
- Broken search filters for older records
- Inconsistent search result display
- Emergency re-index after discovering drift
### Alternative
Always run a full re-index after any schema change (new fields, type changes, field removals).
### Refactoring Strategy
1. Add schema-change detection to deployment checklist
2. After any toSearchableArray() change, run `php artisan scout:import`
3. For zero-downtime: use Meilisearch multi-index swap or Algolia temporary index
4. Verify index schema matches expected fields after re-index
5. Document schema change + re-index in PR template
### Detection Checklist
- [ ] Schema changes trigger re-index step
- [ ] Re-index runbook documented
- [ ] Index consistency verified after schema changes
- [ ] All records have new schema fields after re-index
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 3: Import Without Eager Loading
### Category
Performance
### Description
Running `scout:import` without configuring `makeAllSearchableUsing()`, causing N+1 query explosion when `toSearchableArray()` accesses model relationships during batch import.
### Why It Happens
Developers add relation data to `toSearchableArray()` but forget to eager-load those relations during batch import. The relation queries fire individually for every record.
### Warning Signs
- `scout:import` generates thousands of SQL queries
- Database CPU spikes during import
- Import time proportional to (records * relations) instead of records
- MySQL slow query log fills with relation queries during import
### Why Harmful
A 100K-record import with 3 relations generates 300K+ queries instead of 100K+3. Import that should take 5 minutes takes 2 hours. Database server is overwhelmed.
### Consequences
- Import timeout from exceeding PHP max execution time
- Database connection pool exhaustion during import
- Import failure mid-way through, requiring manual cleanup
### Alternative
Implement `makeAllSearchableUsing()` on the model to eager-load all relations needed by `toSearchableArray()`.
### Refactoring Strategy
1. Identify all relations accessed in `toSearchableArray()`
2. Add `makeAllSearchableUsing()` method returning query with `->with()` calls
3. Verify eager loading with `DB::enableQueryLog()` during import
4. Reduce chunk size in scout config if still too many queries
5. Monitor query count during test import
### Detection Checklist
- [ ] `makeAllSearchableUsing()` implemented on Searchable models
- [ ] No lazy-loaded relation queries during import
- [ ] Query count verified during batch import
- [ ] Import duration within acceptable range for dataset size
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Unmonitored Large-Scale Import
### Category
Reliability | Operations
### Description
Running a full re-index on a large dataset (millions of records) without monitoring progress, configuring appropriate chunk sizes, or planning for failure recovery.
### Why It Happens
scout:import works out of the box. Teams run it without considering that a 2M-record import takes hours, consumes significant memory, and can fail partway through.
### Warning Signs
- scout:import runs for hours without progress indicators
- PHP memory limit exhausted during import
- Import fails at 60% with no resume capability
- Search engine shows partial data during import
### Why Harmful
Failed imports leave the index in an inconsistent state. Restarting from scratch wastes hours. Unmonitored imports silently fail, leaving stale indexes.
### Consequences
- Hours of lost work from failed mid-way imports
- Search downtime during import (empty or partial results)
- Out-of-memory crashes on smaller servers
### Alternative
Configure appropriate chunk size (e.g., 100-200 for large records), monitor import progress, and use engines that support atomic index swaps for zero-downtime re-indexing.
### Refactoring Strategy
1. Set `scout.chunk.searchable` to 200 (or lower for large records)
2. Run import with output: `php artisan scout:import --output`
3. For engines supporting index swaps (Algolia, Meilisearch): import to temp index, swap
4. Monitor import progress via Scout events or custom logging
5. Implement resume logic or use engine snapshot feature
### Detection Checklist
- [ ] Chunk size tuned for dataset
- [ ] Import progress monitored (logging or CLI output)
- [ ] Failure recovery strategy documented
- [ ] Zero-downtime re-index strategy for production
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: Incremental-Only After Bulk Data Migration
### Category
Reliability
### Description
Running a large data migration (importing 100K+ records, bulk updating many models) without triggering a full re-index afterward, relying solely on incremental sync to catch up.
### Why It Happens
Teams run data migrations directly on the database or via Eloquent without considering search index consistency. They assume model events fire for all updated records.
### Warning Signs
- After a data migration, search results don't reflect changes
- Record count in search index doesn't match database after import
- Manual intervention required to fix index drift
### Why Harmful
Data migrations bypass normal model event flows when using raw queries or chunked updates. Even with model events, the queue backlog from thousands of updates creates an unacceptable delay.
### Consequences
- Stale search results for hours after migration
- Manual re-index needed to fix drift
- User-facing inconsistency between app and search
### Alternative
After any bulk data migration, disable incremental sync for the operation and run a targeted full re-index when done.
### Refactoring Strategy
1. Wrap bulk migration in `withoutSyncingToSearch()`
2. After migration completes, run `php artisan scout:import` for affected models
3. Verify record counts match between DB and search index
4. Document migration procedures in runbook
### Detection Checklist
- [ ] Bulk migrations use withoutSyncingToSearch()
- [ ] Post-migration re-index scheduled or triggered
- [ ] Index consistency verified after migration
- [ ] Runbook updated for data migration procedures
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
- Decision Tree: Indexing Strategy Selection

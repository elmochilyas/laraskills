# ECC Anti-Patterns — scout:import / scout:flush
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | scout:import / scout:flush | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Flush Without Import (Empty Index)
2. Import Without Queue on Large Datasets
3. No Periodic Full Re-index Schedule
4. Import Without Relation Eager Loading
5. Destructive Import on Production Without Maintenance Mode
---
## Repository-Wide Anti-Patterns
- Using scout:import as a cure-all for index problems
- Not monitoring import duration and success rate
- Confusing the role of import vs incremental sync
---
## Anti-Pattern 1: Flush Without Import
### Category
Reliability | Operations
### Description
Running `scout:flush` to clear the search index without immediately following up with `scout:import`, leaving the index empty and search broken for users.
### Why It Happens
Developers run flush to "reset" the index for testing. In production, flush is used before a schema change and the import is delayed or forgotten.
### Warning Signs
- Search returns zero results after recent deployment
- `scout:flush` command in deployment script without paired `scout:import`
- Import scheduled hours after flush in separate CRON job
- Manual flush in production runbook without automated re-import
### Why Harmful
Every second between flush and import is search downtime. Users see empty search results. If import fails, search stays down indefinitely. E-commerce sites lose revenue during search downtime.
### Consequences
- Search completely unavailable to users
- Lost sales/revenue during search downtime
- Emergency manual import to restore service
- Extended incident duration if import fails
### Alternative
Never run flush without immediately following with import. Use atomic index swaps for zero-downtime re-indexing.
### Refactoring Strategy
1. Chain flush+import: `php artisan scout:flush && php artisan scout:import`
2. For production: use temporary index + swap pattern instead of flush
3. Remove flush from deployment scripts (use incremental sync)
4. If flush is necessary: run as atomic operation with import
### Detection Checklist
- [ ] No flush without immediately paired import
- [ ] Temporary index + swap pattern for production re-indexes
- [ ] No flush in deployment scripts
- [ ] Search availability monitored during index operations
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Import Without Queue on Large Datasets
### Category
Performance | Scalability
### Description
Running `scout:import` synchronously on large datasets (100K+ records) without queue integration, causing the command to block, potentially time out, and consume excessive memory.
### Why It Happens
Default import behavior is synchronous. Teams don't configure queue integration or use the `--queue` flag.
### Warning Signs
- scout:import takes >30 minutes
- CLI shows "memory exhausted" during import
- Import fails at 80% and must be restarted from scratch
- No SCOUT_QUEUE or --queue used during import
### Why Harmful
Synchronous import ties up the CLI or deployment process for the entire duration. Memory limits cause mid-import failures with no resume capability. Each failure wastes all previous progress.
### Consequences
- Deployment pipeline blocked by slow import
- Import restart from scratch after failure
- Increased server costs from long-running processes
- Ops team manually chunking import as workaround
### Alternative
Enable queue integration or use `--queue` flag for all production imports.
### Refactoring Strategy
1. Set SCOUT_QUEUE=true in production
2. Use `php artisan scout:import --queue App\Models\Post`
3. Start queue worker for Scout jobs
4. Monitor import job progress via Horizon dashboard
5. Configure appropriate chunk size (default 500)
### Detection Checklist
- [ ] Queue enabled for production imports
- [ ] --queue flag used for large imports
- [ ] Queue worker running for Scout jobs
- [ ] No timeout or memory failures during imports
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: No Periodic Full Re-index Schedule
### Category
Reliability
### Description
Relying solely on incremental indexing without ever scheduling periodic full re-indexes, allowing index drift to accumulate silently over time.
### Why It Happens
Incremental indexing works well and teams assume it's sufficient. They don't anticipate drift from missed events, queue failures, or buggy withoutSyncingToSearch() calls.
### Warning Signs
- Index record count diverges from database over time
- No scheduled scout:import in task scheduler
- Incremental sync is the only indexing strategy
- Index health check never compares DB vs search counts
### Why Harmful
Index drift accumulates silently. Records go missing from search, old records persist after deletion, and schema mismatches go undetected until users report problems.
### Consequences
- Gradually degrading search quality unnoticed
- Missing records discovered by user complaints
- Emergency full re-index needed (search downtime)
### Alternative
Schedule periodic full re-indexes (weekly or monthly) during low-traffic windows to repair any accumulated drift.
### Refactoring Strategy
1. Add `$schedule->command('scout:import App\Models\Post')->weekly()->sundays()->at('02:00')`
2. Configure index health check comparing DB and search record counts
3. Set up alert if index drift exceeds threshold (5%)
4. Document re-index schedule and purpose
5. Monitor re-index duration trend over time
### Detection Checklist
- [ ] Periodic full re-index scheduled
- [ ] Index health check monitoring drift
- [ ] Alert configured for excessive drift
- [ ] Re-index duration stable or improving
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
- Decision Tree: Indexing Strategy Selection
---
## Anti-Pattern 4: Import Without Relation Eager Loading
### Category
Performance
### Description
Running `scout:import` on models with relation data in `toSearchableArray()` without implementing `makeAllSearchableUsing()`, causing N+1 query explosion during import.
### Why It Happens
Developers index relation data but forget to configure the eager loading. The import fires individual relation queries for each record.
### Warning Signs
- Import generates thousands of queries for a moderate dataset
- Database CPU spikes during import
- No makeAllSearchableUsing() on models with relation data
- Import slower than expected for the dataset size
### Why Harmful
Import time scales with (records * relations) instead of records. A 100K record import with 3 relations generates 300K+ queries. Import becomes unusably slow for production datasets.
### Consequences
- Import duration measured in hours, not minutes
- Database performance degradation during import
- Import failures from query timeouts
### Alternative
Implement `makeAllSearchableUsing()` with eager loading for all relations used in `toSearchableArray()`.
### Refactoring Strategy
1. Audit toSearchableArray() for relation access patterns
2. Add makeAllSearchableUsing($query) { return $query->with([...]); }
3. Measure query count reduction
4. Test import performance with realistic data volume
### Detection Checklist
- [ ] makeAllSearchableUsing() on all models with relation data
- [ ] Import query count = chunks + relation queries, not records * relations
- [ ] Import duration acceptable
- [ ] Relation data present in all indexed records
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 5: Destructive Import on Production Without Maintenance Mode
### Category
Operations | Reliability
### Description
Running `scout:import` (which often includes an implicit flush for some engines) on production during active use without maintenance mode, causing temporarily incomplete or empty search results during the import.
### Why It Happens
Developers run import as a standard deploy step. They don't realize that for some engines, import replaces the entire index, making search unavailable during the operation.
### Warning Signs
- Search returns partial or empty results during deploy
- scout:import used without temporary index swap
- No maintenance mode during re-index operations
- Users report search issues during deployment windows
### Why Harmful
Users see broken search during every deployment that includes re-index. E-commerce sites lose sales. Content sites lose engagement. Search-dependent features fail during the window.
### Consequences
- Revenue loss during search downtime
- Poor user experience during deployments
- Pressure to skip necessary re-indexes to avoid downtime
### Alternative
Use maintenance mode, index swap patterns, or zero-downtime re-index strategies.
### Refactoring Strategy
1. For Algolia: use temporary index, import to it, then swap with alias
2. For Meilisearch: use multi-index with swap or atomic operations
3. For simple setups: enable maintenance mode during import
4. Schedule imports during absolute lowest traffic
5. Monitor search availability during import windows
### Detection Checklist
- [ ] Zero-downtime re-index strategy in use
- [ ] Index swap or maintenance mode during import
- [ ] No search errors during deployment
- [ ] Users unaffected by re-index operations
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search

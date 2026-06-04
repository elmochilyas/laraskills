# ECC Anti-Patterns — Scout Import Commands
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Laravel Scout Foundation | Knowledge Unit | Scout Import Commands | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Import Without Queue on Large Datasets
2. Forgetting scout:sync-index-settings in Deploy
3. scout:flush Without scout:import (Empty Index)
4. Running Import During Peak Traffic
5. Import Without makeAllSearchableUsing
---
## Repository-Wide Anti-Patterns
- Running scout:import manually instead of automating in deployments
- Not scheduling periodic scout:sync-index-settings
- Confusing scout:flush with scout:delete-all-indexes
---
## Anti-Pattern 1: Import Without Queue on Large Datasets
### Category
Performance | Scalability
### Description
Running `scout:import` without queue integration on a dataset with 50K+ records, causing the CLI command to block for hours or time out.
### Why It Happens
Developers run import locally with small datasets (seconds). They deploy to production with 500K records and the command never finishes.
### Warning Signs
- scout:import runs for >30 minutes
- Import times out or hangs
- CLI shows memory limit errors
- No `--queue` flag used in production import
- SCOUT_QUEUE is false during import
### Why Harmful
Blocking import blocks deployment pipelines, causes infrastructure costs (server time), and fails semi-randomly on memory limits. Failed imports leave the index in partial state.
### Consequences
- Deployment failures from import timeout
- Mid-way import failures requiring manual cleanup
- Ops team manually chunking imports as workaround
### Alternative
Use `php artisan scout:import --queue` or set `SCOUT_QUEUE=true` for production imports so the import is processed as background jobs.
### Refactoring Strategy
1. Enable queue for Scout: set SCOUT_QUEUE=true
2. Use `--queue` flag on scout:import for large datasets
3. Configure queue worker for Scout import jobs
4. Monitor import job progress via Horizon or queue monitoring
5. Set chunk size appropriately for model complexity
### Detection Checklist
- [ ] scout:import uses queue in production
- [ ] Queue worker configured for Scout jobs
- [ ] Import progress monitored
- [ ] No timeout or memory failures on large imports
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 2: Forgetting scout:sync-index-settings in Deploy
### Category
Reliability
### Description
Deploying changes to engine index settings (filterable attributes, ranking rules) without running `scout:sync-index-settings`, leaving the engine with stale configuration.
### Why It Happens
Developers add filterable attributes to `toSearchableArray()` and update `index-settings` in `config/scout.php` but forget the sync command. The settings are never applied to the engine.
### Warning Signs
- New filterable attributes don't work after deploy
- Index settings in code differ from engine dashboard
- No `scout:sync-index-settings` in CI/CD pipeline
- Developers manually update settings in engine dashboard
### Why Harmful
Code and engine configuration diverge. Filter/sort queries fail despite correct code. Manual dashboard configuration is lost on re-index. Team members assume code config is active when it isn't.
### Consequences
- Broken search filters after deploy
- Manual debugging of "code is correct but filters don't work"
- Dashboard configuration drift between environments
### Alternative
Always run `scout:sync-index-settings` as part of the deployment pipeline after code changes.
### Refactoring Strategy
1. Add `php artisan scout:sync-index-settings` to deployment script
2. Place it after `php artisan migrate` so index settings reflect current code
3. Verify sync completes without errors in CI
4. Add post-deploy verification that settings match code config
### Detection Checklist
- [ ] scout:sync-index-settings in deployment pipeline
- [ ] Index settings match code configuration after deploy
- [ ] No manual dashboard configuration needed
- [ ] Post-deploy smoke test verifies filters work
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 3: scout:flush Without scout:import
### Category
Reliability
### Description
Running `scout:flush App\Models\Post` to clear the index without immediately running `scout:import` to repopulate it, leaving the index empty and search broken until the import runs.
### Why It Happens
Developers think flushing is a "reset" and they'll remember to import later. Or they flush to test something and forget to repopulate.
### Warning Signs
- scout:flush run without immediate scout:import
- Search returns empty results after flush
- CRON job or manual process flushes but import is scheduled hours later
- No automated import after flush in deployment scripts
### Why Harmful
Search is completely down between flush and import. Users see "no results" for all queries. If the import fails or is delayed, search stays broken indefinitely.
### Consequences
- Search downtime from flush-without-import
- User-facing "no results" errors
- Emergency manual import to restore search
### Alternative
Always pair flush with an immediate import, or use index swap patterns for zero-downtime re-indexing.
### Refactoring Strategy
1. Chain commands: `scout:flush && scout:import` in a single script
2. For zero-downtime: import to temporary index, then swap
3. If flush is necessary, ensure import runs immediately after
4. Remove manual flush operations from production runbooks
### Detection Checklist
- [ ] Flush always paired with immediate import
- [ ] No manual flush operations in production
- [ ] Zero-downtime re-index strategy documented
- [ ] Search availability monitored during re-index
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design
---
## Anti-Pattern 4: Running Import During Peak Traffic
### Category
Performance | Operations
### Description
Running `scout:import` during peak traffic hours, causing increased load on the database, search engine, and queue workers during business-critical periods.
### Why It Happens
Imports are triggered by deploys or scheduled tasks without considering traffic patterns. The import runs whenever the deploy happens.
### Warning Signs
- scout:import in deployment pipeline runs any time, day or night
- No scheduling for import operations
- Import coincides with highest traffic hours
- Performance alerts during import times
### Why Harmful
Import reads all records from the database (DB load), sends data to search engine (API rate limits), and competes with user-facing queue jobs for worker resources.
### Consequences
- Slow database performance during peak hours
- Search engine rate limits hit during import
- User-facing job delays from worker competition
- Higher infrastructure costs from peak-hour resource usage
### Alternative
Schedule large imports during low-traffic windows. Use queued imports that respect worker priorities.
### Refactoring Strategy
1. Schedule scout:import for low-traffic periods (e.g., 2 AM)
2. Use Laravel's task scheduler: `$schedule->command('scout:import ...')->dailyAt('02:00')`
3. For deploy-triggered imports: run as queued job with low priority
4. Monitor queue length during scheduled imports
5. Alert if import exceeds expected duration window
### Detection Checklist
- [ ] Imports scheduled during low-traffic periods
- [ ] Queue priority configured for import jobs
- [ ] Worker allocation adjusted during import windows
- [ ] No performance alerts during scheduled imports
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Index Schema Design Production Search
---
## Anti-Pattern 5: Import Without makeAllSearchableUsing
### Category
Performance
### Description
Running `scout:import` without implementing `makeAllSearchableUsing()` for models that index related data, causing N+1 queries during the import.
### Why It Happens
Developers add relation data to `toSearchableArray()` but don't realize the import query needs explicit eager loading.
### Warning Signs
- scout:import slow for models with relations
- Database query count far exceeds record count during import
- No makeAllSearchableUsing() implementation
- Relation data present in some index entries but not others
### Why Harmful
Import performance degrades linearly with relation count. A 50K record import with 3 relations generates 150K+ unnecessary queries, turning a 2-minute import into a 2-hour operation.
### Consequences
- Import timeout or excessive duration
- Database resource exhaustion during import
- Inconsistent relation data in search results
### Alternative
Implement `makeAllSearchableUsing()` with eager loading for every model that indexes relation data.
### Refactoring Strategy
1. Add makeAllSearchableUsing() with with() for all indexed relations
2. Test import performance before and after
3. Verify relation data is present and consistent in search results
4. Document the eager loading strategy
### Detection Checklist
- [ ] makeAllSearchableUsing() implemented for all models with relations
- [ ] Import query count within expected range
- [ ] Import duration acceptable for dataset size
- [ ] Relation data consistent across all indexed records
### Related Rules/Skills/Trees
- Skill: Configure and Implement Index Schema Design

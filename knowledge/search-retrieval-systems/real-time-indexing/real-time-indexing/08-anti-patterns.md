# ECC Anti-Patterns — Real-Time Indexing (Observer-Based)
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Real-Time Indexing | Knowledge Unit | Real-Time Indexing (Observer-Based) | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Synchronous Indexing in Production
2. Blind Indexing Without searchIndexShouldBeUpdated
3. Not Understanding Observer Bypass Paths
4. No Queue Backlog Monitoring
5. Observer-Triggered Infinite Loops
---
## Repository-Wide Anti-Patterns
- Using real-time indexing without understanding its implications for all model operations
- Not distinguishing between synchronous and queued modes per environment
- Assuming observers handle direct DB modifications or raw SQL
---
## Anti-Pattern 1: Synchronous Indexing in Production
### Category
Performance | Reliability
### Description
Using Scout's default synchronous indexing in production, blocking HTTP response on search engine latency for every model save.
### Why It Happens
Default configuration is synchronous. Developers don't explicitly enable queue for production.
### Warning Signs
- Slow model save operations correlate with search engine latency
- No `'queue' => true` in config/scout.php
- HTTP response times include indexing delays
- Application slows down when search engine is under load
### Why Harmful
Every model save waits for the search engine to acknowledge indexing. This makes request latency dependent on search engine performance and availability.
### Consequences
- Increased page load times from indexing
- Application performance coupled to search engine health
- Poor UX from slow save operations
- Search engine latency directly impacts user experience
### Alternative
Always enable queue for production: `'queue' => true` in Scout config.
### Refactoring Strategy
1. Set `'queue' => true` in production scout config
2. Start queue worker for scout queue
3. Test: model save no longer blocks on search
4. Verify indexing completes via queue worker
5. Keep sync mode for development only
### Detection Checklist
- [ ] queue = true in production
- [ ] Queue worker running
- [ ] Model saves decoupled from search latency
- [ ] Dev environment uses sync mode
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Blind Indexing Without searchIndexShouldBeUpdated
### Category
Performance | Data Quality
### Description
Indexing models on every save regardless of which attributes changed, wasting resources on non-searchable field updates.
### Why It Happens
Scout 10+ provides `searchIndexShouldBeUpdated()` but default behavior indexes every save.
### Warning Signs
- View counters, timestamps, logs trigger index updates
- Frequent saves to non-searchable fields cause excessive indexing
- Queue backlog from non-searchable field updates
- Server resources wasted on unnecessary indexing
### Why Harmful
Every save triggers an index operation, even if only non-searchable fields changed (e.g., `updated_at`, view_count). For frequently updated records, this creates massive unnecessary load.
### Consequences
- 10x more indexing operations than necessary
- Queue workers busy with no-op index operations
- Higher search engine costs from redundant requests
- Wasted server CPU and memory
### Alternative
Implement `searchIndexShouldBeUpdated()` to only index when searchable fields change.
### Refactoring Strategy
1. Add `searchIndexShouldBeUpdated(array $changes): bool` to model
2. Compare $changes keys against searchable field list
3. Return true only when searchable fields changed
4. Test: save with timestamp-only change skips index
5. Test: save with title change triggers index
### Detection Checklist
- [ ] searchIndexShouldBeUpdated implemented
- [ ] Non-searchable field saves skip indexing
- [ ] Indexing operations reduced significantly
- [ ] Queue backlog decreased
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Not Understanding Observer Bypass Paths
### Category
Reliability | Data Quality
### Description
Assuming Scout observers catch all data changes, not realizing that direct DB updates, raw SQL, and certain Eloquent methods (e.g., `updateQuietly`) bypass observers.
### Why It Happens
Developers test with Eloquent `save()` and assume all data modification paths trigger observers.
### Warning Signs
- Direct DB updates not reflected in search
- `update()` queries without model instantiation miss observers
- Raw SQL modifications not indexed
- Bulk updates missing from search index
### Why Harmful
Data modified through non-observer paths silently creates index drift. Some records are updated in the database but not in the search index, causing inconsistencies.
### Consequences
- Incomplete search index coverage
- Updates missing for data modified outside Eloquent
- Hard-to-diagnose index inconsistencies
- Trust in real-time indexing eroded
### Alternative
Audit all data modification paths. Supplement observers with explicit indexing for non-observer paths.
### Refactoring Strategy
1. Identify all data modification paths in the application
2. For direct DB updates: add explicit `Model::searchable()` after update
3. For raw SQL: add event or hook to trigger indexing
4. Implement a facade or service that wraps all write operations
5. Test: verify all write paths produce index updates
### Detection Checklist
- [ ] All data modification paths identified
- [ ] Non-observer paths have explicit indexing
- [ ] Bulk operations followed by re-index
- [ ] No silent index drift from bypass paths
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: No Queue Backlog Monitoring
### Category
Operations | Reliability
### Description
Using queue-based indexing but not monitoring the queue backlog, allowing index lag to grow without detection.
### Why It Happens
Queue is set up and working. Backlog monitoring is treated as a separate concern.
### Warning Signs
- Queue backlog grows during peak traffic
- Index freshness decreasing without team awareness
- Scout queue size not tracked
- User reports of stale search results
### Why Harmful
A growing queue backlog means the index falls further behind the database. New records appear minutes or hours late. Updates and deletes are delayed.
### Consequences
- Stale search results during peak times
- New content invisible for extended periods
- Deleted records remain in search
- User trust in search freshness eroded
### Alternative
Monitor queue backlog size for the scout queue. Alert on significant growth.
### Refactoring Strategy
1. Add scout queue size to monitoring dashboard
2. Set alert threshold for queue backlog (e.g., > 1000 pending jobs)
3. Track index lag: time since last successful index of each model
4. Scale queue workers when backlog exceeds threshold
5. Investigate and resolve persistent backlog causes
### Detection Checklist
- [ ] Scout queue backlog monitored
- [ ] Alert threshold configured
- [ ] Index lag tracked
- [ ] Worker scaling plan for backlog
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Observer-Triggered Infinite Loops
### Category
Reliability | Performance
### Description
Creating infinite save-index-save loops when model observers or `toSearchableArray()` trigger additional model saves.
### Why It Happens
When `toSearchableArray()` computes data that modifies the model (touch counters, computed fields), or observers call `save()` on the observed model.
### Warning Signs
- Single model save produces multiple index operations
- Endless queue jobs for single record
- Server CPU spikes during model saves
- Recursive save behavior detected in logs
### Why Harmful
Infinite loops exhaust queue workers, crash servers, and waste resources. Each iteration may add to the queue faster than workers can process.
### Consequences
- Queue worker exhaustion
- Application performance collapse
- Search engine overwhelmed with identical requests
- Cascading failure from looping operations
### Alternative
Use `saveQuietly()` for internal model updates. Implement loop detection.
### Refactoring Strategy
1. Audit `toSearchableArray()` for `save()` calls
2. Replace with `saveQuietly()` for internal state updates
3. Implement max iteration guard in observer
4. Add logging: detect when model indexed > 3 times per save
5. Test: single save produces exactly one index operation
### Detection Checklist
- [ ] No save() calls in observer or toSearchableArray
- [ ] Internal updates use saveQuietly
- [ ] Loop detection implemented
- [ ] One model save = one index operation
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy

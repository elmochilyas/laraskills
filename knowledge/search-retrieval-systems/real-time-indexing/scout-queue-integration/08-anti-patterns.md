# ECC Anti-Patterns — Scout Queue Integration
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Real-Time Indexing | Knowledge Unit | Scout Queue Integration | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Workerless Queue Configuration
2. Mixing Scout Jobs on Default Queue
3. No Failed Job Handling
4. Not Using scout:queue-import for Large Imports
5. Not Testing Async Indexing Behavior
---
## Repository-Wide Anti-Patterns
- Using same queue config for all environments (queue in dev)
- Not separating scout queue from other job types
- Not monitoring scout queue health and throughput
---
## Anti-Pattern 1: Workerless Queue Configuration
### Category
Reliability | Operations
### Description
Setting `'queue' => true` in Scout config but failing to run a queue worker, causing indexing jobs to accumulate without processing.
### Why It Happens
Queue configuration is code-level. Worker management is an operational concern that's overlooked.
### Warning Signs
- Queue jobs never processed
- Model saves don't update search index
- Queue table growing indefinitely
- No queue worker process running
### Why Harmful
Indexing never happens. All model changes since queue enablement are missing from search. The search index becomes progressively more stale until someone notices.
### Consequences
- Complete index staleness
- All new, updated, and deleted records missing from search
- No obvious error or alert
- Full re-index required to recover
### Alternative
Ensure queue worker is configured in Supervisor and starts on deployment.
### Refactoring Strategy
1. Add Supervisor configuration for scout queue worker
2. Start worker: `php artisan queue:work redis --queue=scout --tries=3 --max-time=3600`
3. Verify worker processes scout queue
4. Add worker health monitoring
5. Include worker restart in deployment script
### Detection Checklist
- [ ] Queue worker configured and running
- [ ] Worker processes scout queue
- [ ] Worker health monitored
- [ ] Deployment includes worker restart
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Mixing Scout Jobs on Default Queue
### Category
Reliability | Performance
### Description
Running Scout indexing jobs on the default queue shared with other job types, causing indexing delays when other jobs are queued.
### Why It Happens
Default configuration uses the default queue. No dedicated queue is configured.
### Warning Signs
- Scout indexing delayed by other jobs
- Index lag correlates with email or report jobs
- No scout-specific queue configuration
- Queue backlog contains mixed job types
### Why Harmful
Long-running jobs (email, reports, file processing) block Scout indexing jobs behind them. Search freshness depends on other jobs completing.
### Consequences
- Unpredictable index freshness
- Indexing delays during peak job processing
- Search lag when other systems are busy
- Hard to diagnose indexing delay causes
### Alternative
Configure a dedicated queue for Scout operations.
### Refactoring Strategy
1. Set `'queue' => 'scout'` in Scout config
2. Create dedicated queue worker: `php artisan queue:work redis --queue=scout,default`
3. Monitor scout queue as separate dimension
4. Prioritize scout queue in worker configuration
5. Document queue architecture
### Detection Checklist
- [ ] Dedicated scout queue configured
- [ ] Scout queue separated from other jobs
- [ ] Scout backlog monitored independently
- [ ] Indexing not blocked by other job types
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: No Failed Job Handling
### Category
Operations | Reliability
### Description
Not monitoring or handling failed Scout indexing jobs, allowing permanent indexing failures to go undetected.
### Why It Happens
Teams set up queue and assume it works. Failed jobs are an afterthought.
### Warning Signs
- Failed_jobs table accumulates scout failures
- Some records permanently missing from index
- No alerting for failed indexing jobs
- No process to retry failed indexing operations
### Why Harmful
Failed indexing jobs are retried (default 3 times) and then discarded. Without handling, records that fail to index are permanently missing from search.
### Consequences
- Permanent gaps in search index
- Users cannot find certain records
- Deleted records remain in index if delete job fails
- Manual re-index needed to recover
### Alternative
Monitor failed jobs, set up alerts, and implement retry mechanisms.
### Refactoring Strategy
1. Monitor failed_jobs table for scout failures
2. Configure alert on failed scout job threshold
3. Create retry command for failed scout jobs
4. Consider automatic re-queue with exponential backoff
5. Review and fix root causes of persistent failures
### Detection Checklist
- [ ] Failed scout jobs monitored
- [ ] Alerts configured for failures
- [ ] Retry mechanism implemented
- [ ] Root causes addressed
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Not Using scout:queue-import for Large Imports
### Category
Performance | Operations
### Description
Using `scout:import` (synchronous batch import) instead of `scout:queue-import` for large datasets, blocking the CLI until import completes.
### Why It Happens
Developers know `scout:import` and don't discover `scout:queue-import` for async chunked imports.
### Warning Signs
- scout:import takes hours for large datasets
- CLI blocked during entire import
- No parallel processing of chunks
- Import progress not visible
### Why Harmful
Synchronous import ties up the CLI process for the entire duration. Large imports block deployments and long-running CLI sessions may timeout.
### Consequences
- Imports taking hours instead of minutes
- CLI sessions timing out on large imports
- No deploy during import (blocks other operations)
- Inefficient use of server resources (single-threaded)
### Alternative
Use `scout:queue-import` with appropriate chunk size and workers for large imports.
### Refactoring Strategy
1. Switch to `scout:queue-import` for datasets > 10K records
2. Configure chunk size based on record complexity
3. Run multiple queue workers for parallel processing
4. Monitor import progress via job batches (Scout 10+)
5. Keep `scout:import` for small datasets
### Detection Checklist
- [ ] scout:queue-import used for large datasets
- [ ] Chunk size configured appropriately
- [ ] Parallel workers processing import
- [ ] Import progress monitored
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Testing Async Indexing Behavior
### Category
Testing | Reliability
### Description
Not writing tests that verify asynchronous indexing behavior, allowing queue-related bugs to pass unnoticed.
### Why It Happens
Tests use synchronous mode. Async behavior differences are not tested.
### Warning Signs
- No tests for queued indexing
- Tests pass in sync mode but indexing fails async
- Queue dispatch not asserted in tests
- Async-specific bugs (timeouts, serialization) caught in production
### Why Harmful
Async indexing behaves differently from sync: serialization may fail, timeouts differ, model state at dispatch time vs execution time may differ. Without async tests, these issues reach production.
### Consequences
- Production indexing failures not caught by tests
- Serialization errors on complex models
- Model state changes between dispatch and execution cause issues
- Queue-specific bugs discovered by users
### Alternative
Test async indexing behavior using `Queue::fake()` and asserting job dispatch.
### Refactoring Strategy
1. Use `Queue::fake()` in tests to capture dispatched jobs
2. Assert that MakeSearchable/RemoveFromSearch jobs are dispatched on save/delete
3. Test job serialization for complex models
4. Test async behavior with `Scout::fake()` for full pipeline tests
5. Include queue dispatch tests in CI
### Detection Checklist
- [ ] Queue dispatch asserted in tests
- [ ] Job serialization tested for complex models
- [ ] Async behavior included in test coverage
- [ ] CI catches indexing regressions
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy

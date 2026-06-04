# ECC Anti-Patterns — Queue Indexing
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Real-Time Indexing | Knowledge Unit | Queue Indexing | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. Enabling Queue Without Running Queue Worker
2. Using Default Queue for Scout Operations
3. No Failed Job Monitoring
4. Not Setting Appropriate Timeout for Indexing Jobs
5. Not Tuning scout:queue-import Chunk Size
---
## Repository-Wide Anti-Patterns
- Using synchronous indexing in production despite having queue infrastructure
- Not using dedicated queue per environment
- Not testing async indexing behavior
---
## Anti-Pattern 1: Enabling Queue Without Running Queue Worker
### Category
Reliability | Operations
### Description
Setting `'queue' => true` in Scout config but not running a queue worker, causing indexing operations to never execute.
### Why It Happens
Developers enable queue but forget to configure and run the queue worker as part of deployment.
### Warning Signs
- Model saves don't appear in search engine
- Queue jobs accumulating but not processed
- Queue worker process not running on server
- scout:queue-import shows jobs started but never completing
### Why Harmful
The queue silently swallows indexing jobs. Models are never indexed. The search index becomes completely stale. Users see no new content. No error is raised because the queue is working "correctly" — there's just no worker.
### Consequences
- Search index never updates
- All new records missing from search
- All updates and deletes not reflected
- Complete search data failure with no obvious error
### Alternative
Ensure queue worker is running and configured as part of the deployment process.
### Refactoring Strategy
1. Add queue worker to Supervisor configuration
2. Ensure worker starts on deployment
3. Verify worker is processing the scout queue
4. Set up monitoring for worker process health
5. Add deployment checklist: verify queue worker running
### Detection Checklist
- [ ] Queue worker running for scout queue
- [ ] Supervisor process configured for worker
- [ ] Worker health monitored
- [ ] Deployment includes worker restart
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: Using Default Queue for Scout Operations
### Category
Reliability | Performance
### Description
Using the default Laravel queue for Scout indexing jobs, mixing them with email, notifications, and other jobs, causing Scout operations to be blocked by unrelated long-running jobs.
### Why It Happens
Developers don't configure a dedicated queue for Scout. The default queue handles all job types.
### Warning Signs
- Scout indexing delayed when other jobs are queued
- Email sending blocks model indexing
- Queue backlogged with mixed job types
- Index lag correlates with other job queues
### Why Harmful
When Scout jobs share a queue with long-running jobs (email, report generation, file processing), they get stuck behind those jobs. Indexing delays accumulate and search becomes stale.
### Consequences
- Indexing delays during peak job processing
- Unpredictable index freshness
- Search lag correlates with other system activities
- Hard to diagnose indexing delays
### Alternative
Configure a dedicated queue for Scout operations.
### Refactoring Strategy
1. Set `'queue' => 'scout'` in Scout config
2. Create dedicated worker: `php artisan queue:work redis --queue=scout,default`
3. Prioritize scout queue over default in worker config
4. Monitor scout queue backlog separately
5. Document queue configuration
### Detection Checklist
- [ ] Dedicated scout queue configured
- [ ] Scout queue prioritized in worker
- [ ] Scout backlog monitored separately
- [ ] Indexing not blocked by other job types
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: No Failed Job Monitoring
### Category
Operations | Reliability
### Description
Not checking the failed_jobs table after enabling queue indexing, allowing permanent indexing failures to go undetected.
### Why It Happens
Queue is set up and working. Monitoring is a separate operational concern.
### Warning Signs
- Failed_jobs table never checked
- Index gradually out of sync
- Same records fail to index repeatedly
- No alerting for failed indexing jobs
### Why Harmful
When indexing jobs fail (network error, schema mismatch, timeout), they are retried and eventually discarded. Without monitoring, you never know which records failed to index.
### Consequences
- Permanent gaps in search index
- Some records never appear in search
- Some deletes never removed from index
- Full re-index needed periodically to fix drift
### Alternative
Monitor the failed_jobs table and set up alerts for failed indexing operations.
### Refactoring Strategy
1. Review failed_jobs table for scout-related failures
2. Set up Horizon or Laravel failed job monitoring
3. Configure alert on failed job threshold
4. Create Artisan command to retry failed scout jobs
5. Add failed job monitoring to deployment checklist
### Detection Checklist
- [ ] Failed indexing jobs monitored
- [ ] Alerts configured for failure thresholds
- [ ] Retry mechanism for failed jobs
- [ ] Failed job monitoring in operations runbook
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: Not Setting Appropriate Timeout for Indexing Jobs
### Category
Reliability | Performance
### Description
Using default queue timeout for Scout indexing jobs that process complex models with many relationships, causing jobs to be killed before completion.
### Why It Happens
Default queue timeout (60 seconds) works for most jobs. Developers don't consider that complex model indexing may take longer.
### Warning Signs
- Indexing jobs consistently fail with "MaxAttemptsExceededException"
- Complex models fail to index while simple models succeed
- Job timeout settings at default values
- Failed jobs show timeout-related errors
### Why Harmful
Jobs that time out are retried and eventually discarded. Complex models with many relationships are permanently unindexed. Search is missing important records.
### Consequences
- Complex records never indexed
- Records with many relationships missing from search
- Wasteful retry attempts consuming queue resources
- Inconsistent search coverage
### Alternative
Set an appropriate timeout for Scout indexing jobs based on the most complex model.
### Refactoring Strategy
1. Identify the most complex Searchable model
2. Measure indexing time for that model
3. Set timeout to 2x the measured max time
4. Configure timeout in queue config or job class
5. Monitor for timeout failures after change
### Detection Checklist
- [ ] Timeout configured for scout jobs
- [ ] Timeout based on complex model indexing time
- [ ] No timeout-related failures in failed_jobs
- [ ] Complex models indexed successfully
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: Not Tuning scout:queue-import Chunk Size
### Category
Performance | Operations
### Description
Using default chunk size for `scout:queue-import` without tuning, causing either too many small jobs or jobs that exceed memory limits.
### Why It Happens
Default chunk size (100) works for most datasets. Developers don't adjust based on record size.
### Warning Signs
- scout:queue-import dispatches thousands of tiny jobs for small tables
- Memory errors during queue-import for records with large searchable arrays
- Import takes much longer than expected
- Default chunk size of 100 never adjusted
### Why Harmful
Too-small chunks create excessive job overhead. Too-large chunks cause memory exhaustion when loading records with many relationships. Both slow down the import process.
### Consequences
- Imports take longer than necessary
- Excessive job dispatch overhead
- Memory errors on complex models
- Queue backlog from inefficient chunking
### Alternative
Tune chunk size based on record complexity: smaller for complex models, larger for simple ones.
### Refactoring Strategy
1. Measure average record size in searchable array
2. For simple records (small array): chunk=500-1000
3. For complex records (large array, many relations): chunk=50-200
4. Monitor memory usage during queue-import
5. Adjust chunk size based on observed performance
### Detection Checklist
- [ ] Chunk size tuned per model complexity
- [ ] Memory usage monitored during import
- [ ] Import performance benchmarked
- [ ] No memory errors during queue-import
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy

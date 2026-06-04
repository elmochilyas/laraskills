# ECC Anti-Patterns — Index Failure Handling
---
## Metadata
| Domain | Search & Retrieval Systems | Subdomain | Real-Time Indexing | Knowledge Unit | Index Failure Handling | Generated | 2026-06-03 |
---
## Anti-Pattern Inventory
1. No Monitoring for Failed Indexing Jobs
2. No Graceful Degradation When Search Engine Is Down
3. Missing Health Checks for Search Engine
4. No Dead Letter Queue for Persistent Failures
5. No Periodic Data Consistency Checks
---
## Repository-Wide Anti-Patterns
- Assuming indexing always succeeds without monitoring
- Only handling failures for new records, ignoring failures for updates and deletes
- Not distinguishing between transient and permanent failures in retry logic
---
## Anti-Pattern 1: No Monitoring for Failed Indexing Jobs
### Category
Operations | Reliability
### Description
Enabling queue-based indexing but not monitoring the failed jobs table, allowing indexing failures to go undetected indefinitely.
### Why It Happens
Queue setup is done. Failed job monitoring is a separate operational concern that's often deferred.
### Warning Signs
- Failed jobs table never checked
- Search index gradually out of sync with database
- Index consistency issues discovered from user reports
- No alerting for failed indexing jobs
### Why Harmful
When indexing jobs fail silently, the search index diverges from the database. Products go unindexed, updates don't appear, deletes remain. Users see stale or missing results.
### Consequences
- Search index gradually diverges from database
- New records missing from search
- Deleted records still appearing in results
- Index drift detected only when users complain
### Alternative
Monitor failed jobs table. Set up alerts for indexing failures.
### Refactoring Strategy
1. Add failed job monitoring (Horizon dashboard or Laravel's queue:failed)
2. Set up alerting for failed job thresholds (e.g., > 5 failures in 10 minutes)
3. Create process for reviewing and re-running failed indexing jobs
4. Implement automatic retry with backoff
5. Document runbook for failed indexing job handling
### Detection Checklist
- [ ] Failed indexing jobs monitored
- [ ] Alerts configured for failure thresholds
- [ ] Process for handling failed jobs documented
- [ ] Automatic retry with backoff implemented
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 2: No Graceful Degradation When Search Engine Is Down
### Category
Reliability | User Experience
### Description
Not implementing a fallback to database search when the search engine is unavailable, resulting in 500 errors for all search features.
### Why It Happens
Developers assume the search engine is always available. Graceful degradation requires additional implementation.
### Warning Signs
- Search returns 500 errors when engine is down
- No fallback to database query
- Users cannot search during engine outages
- No monitoring for engine availability
### Why Harmful
Search engine downtime becomes application downtime. Users cannot use any feature that depends on search. A search engine failure breaks the entire application.
### Consequences
- Complete search outage during engine downtime
- Lost revenue from broken search
- Emergency hotfix required to bypass engine
- Users cannot find any content during outage
### Alternative
Implement circuit breaker pattern: detect engine failure, fall back to database search (LIKE or full-text), retry engine periodically.
### Refactoring Strategy
1. Add health check for search engine
2. Implement circuit breaker: after N failures, use database fallback
3. Implement database search fallback (WHERE LIKE or full-text)
4. Restore engine search when health check passes
5. Log fallback activations to monitor engine reliability
### Detection Checklist
- [ ] Graceful degradation to database search
- [ ] Circuit breaker implemented
- [ ] Fallback search returns reasonable results
- [ ] Engine restoration on health check pass
- [ ] Fallback events logged
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 3: Missing Health Checks for Search Engine
### Category
Operations | Reliability
### Description
Not monitoring the search engine's health status, failing to detect availability issues before they affect users.
### Why It Happens
Health checks require additional infrastructure. Teams rely on the search engine's own status page.
### Warning Signs
- Search engine availability unknown
- Engine outages detected from user complaints
- No health check endpoint monitoring
- No automated recovery procedures
### Why Harmful
Without health checks, you don't know the search engine is down until users report it. Minutes or hours of downtime may pass before detection.
### Consequences
- Extended search downtime
- Reactive instead of proactive issue detection
- No data to correlate with other monitoring signals
- Harder to diagnose search performance issues
### Alternative
Implement automated health checks that ping the search engine and alert on failure.
### Refactoring Strategy
1. Add health check endpoint monitoring (every 60 seconds)
2. Check: search engine responds, index is available, basic query works
3. Alert on health check failure
4. Integrate with application health dashboard
5. Implement auto-recovery (restart connection, re-index if needed)
### Detection Checklist
- [ ] Health checks implemented
- [ ] Alerting on health check failure
- [ ] Health check endpoint in app health dashboard
- [ ] Auto-recovery or notification for failures
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 4: No Dead Letter Queue for Persistent Failures
### Category
Operations | Reliability
### Description
Not storing permanently failed indexing operations in a dead letter queue, losing records that cannot be indexed and never knowing about them.
### Why It Happens
Queue retries eventually exhaust and jobs are discarded. Teams don't configure a dead letter destination.
### Warning Signs
- Failed indexing jobs disappear from queue after max retries
- Some records permanently missing from search index
- No persistent record of which records failed to index
- Manual re-indexing needed to recover failed records
### Why Harmful
Once retries are exhausted, the indexing operation is lost. The record is permanently out of sync until a full re-index occurs. You have no record of what failed or why.
### Consequences
- Permanent data-inconsistency between DB and index
- Records that cannot be indexed are silently dropped
- Full re-index required to fix, which is expensive
- No audit trail of indexing failures
### Alternative
Store permanently failed indexing operations in a failed_jobs table or dead letter queue with full context.
### Refactoring Strategy
1. Configure queue to store failed jobs in failed_jobs table
2. Include model ID, action, error, and timestamp in failure record
3. Create Artisan command to retry failed indexing operations
4. Set up periodic review of dead letter queue
5. Consider automatic re-queue with exponential backoff
### Detection Checklist
- [ ] Dead letter queue for failed indexing
- [ ] Failure records include model ID, action, error
- [ ] Retry mechanism for dead letter items
- [ ] Periodic review process established
### Related Rules/Skills/Trees
- Skill: Configure and Implement Relevance Tuning Workflow
- Decision: Relevance Tuning Strategy
---
## Anti-Pattern 5: No Periodic Data Consistency Checks
### Category
Operations | Data Quality
### Description
Not running periodic checks comparing database record counts with search index document counts, allowing index drift to go undetected.
### Why It Happens
Teams assume real-time indexing keeps everything in sync. Verification isn't built into operations.
### Warning Signs
- Database and index record counts never compared
- Index drift discovered when someone manually notices
- No scheduled consistency check job
- Users find missing search results
### Why Harmful
Index drift accumulates over time. Records go missing from search, deleted records remain, and updates don't propagate. Without consistency checks, this goes unnoticed until users complain.
### Consequences
- Unnoticed index degradation
- Accumulated drift affects increasing numbers of records
- Full re-index required for recovery
- User trust eroded by inconsistent search results
### Alternative
Run periodic consistency checks comparing DB and index counts. Alert on significant discrepancies.
### Refactoring Strategy
1. Schedule daily cron job for consistency check
2. Compare record count by model: DB count vs index count
3. Alert if discrepancy > 1% or > 100 records
4. Implement spot-check: verify random sample of records exist in both
5. Auto-trigger partial re-index on significant discrepancies
### Detection Checklist
- [ ] Consistency checks scheduled
- [ ] Count comparison thresholds defined
- [ ] Alerting on discrepancies
- [ ] Auto-remediation for detected drift
### Related Rules/Skills/Trees
- Skill: Optimize and Monitor Relevance Tuning Workflow Production Search
- Decision: Relevance Tuning Strategy

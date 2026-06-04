# ECC Anti-Patterns — Pagination Plugin for SaloonPHP

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 02-saloonphp |
| **Knowledge Unit** | Pagination Plugin for SaloonPHP |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Page Pagination for Production Data Syncs (Concurrent Write Drift)
2. No Maximum Page Limit — Infinite Loop Risk
3. Loading All Pages into Memory (Memory God Collection)
4. Deep Pagination Without Rate Limiting
5. No Checkpointing for Long-Running Pagination

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Hidden Database Queries

---

## Anti-Pattern 1: Page Pagination for Production Data Syncs (Concurrent Write Drift)

### Category
Reliability | Architecture

### Description
Using page-based pagination for data synchronization jobs where concurrent writes occur. New records shift page boundaries, causing duplicates or missed records.

### Why It Happens
Page pagination is the default and most familiar pattern. Developers don't consider the stability implications of concurrent writes.

### Warning Signs
- Data sync jobs report different total counts on each run
- Duplicate records in the target system
- Missed records during synchronization
- Page-based pagination used in ETL/replication jobs

### Why It Is Harmful
Page-based pagination uses positional offsets (page 1 = records 1-20). A new record inserted at position 1 shifts all subsequent records by one. Page 2 now shows records 21-40 instead of 20-40 — record 20 is missed. The sync is silently inconsistent.

### Real-World Consequences
An order sync job uses page pagination. New orders are created during sync. Record 20 on page 1 shifts to page 2. Page 2 shows the shifted record plus one new record. Record 20 is processed twice. The downstream system has duplicate orders.

### Preferred Alternative
Use cursor-based pagination for data synchronization jobs.

### Refactoring Strategy
1. Identify sync jobs using page pagination
2. Switch to cursor pagination if the API supports it
3. If cursor is not available, use offset with timestamp-based filtering (WHERE created_at > last_sync)
4. Add idempotency keys to handle any remaining duplicates
5. Validate sync consistency with record counts

### Detection Checklist
- [ ] Page pagination used in ETL/sync jobs
- [ ] Concurrent writes during sync operations
- [ ] Duplicate or missed records in target system

### Related Rules
Prefer Cursor Pagination for Production Data Syncs (05-rules.md)

### Related Skills
Handle Paginated API Responses with SaloonPHP (06-skills.md)

### Related Decision Trees
Pagination Strategy Selection (07-decision-trees.md)

---

## Anti-Pattern 2: No Maximum Page Limit — Infinite Loop Risk

### Category
Reliability | Performance

### Description
Paginating without a maximum page cap. If the API incorrectly reports `hasNext=true` for an empty result set, pagination loops indefinitely.

### Why It Happens
Developers assume the API always correctly terminates pagination. `while ($paginated->hasNext())` is written with no safety limit.

### Warning Signs
- Pagination loop with no `maxPages` parameter
- Paginated requests that run for hours
- Unexpected API costs from runaway pagination

### Why It Is Harmful
An API bug returns `has_next: true` with an empty data array. The pagination loop continues forever, making infinite API calls. Costs accumulate. Rate limits are exhausted. The worker is stuck indefinitely.

### Real-World Consequences
A sync job paginates through 500,000 "orders." At page 10,000 (200,000 records), the API returns `has_more: true` with an empty data array. The loop continues for 3 more days, making 430,000 additional API calls. The monthly Stripe API bill increases by $2,000.

### Preferred Alternative
Always set `maxPages` parameter and validate pagination termination.

### Refactoring Strategy
1. Add `maxPages` to all `paginate()` calls (start with 1000)
2. Add a loop iteration counter with hard limit
3. Monitor pagination depth in logs
4. Alert on pagination exceeding 90% of maxPages

### Detection Checklist
- [ ] No max pages limit on pagination calls
- [ ] Pagination loop without safety cutoff
- [ ] Runaway pagination in production incidents

### Related Rules
Always Set Maximum Page Limits (05-rules.md)

### Related Skills
Handle Paginated API Responses with SaloonPHP (06-skills.md)

### Related Decision Trees
Memory and Performance Management Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Loading All Pages into Memory (Memory God Collection)

### Category
Performance | Reliability

### Description
Collecting all paginated results into an array or collection in memory instead of using LazyCollection for streaming. Large data sets cause out-of-memory errors.

### Why It Happens
`$allItems = $paginated->collect()` is the simplest API call. Developers don't consider memory usage for small result sets that grow over time.

### Warning Signs
- `collect()` or `toArray()` on paginated results
- Manual `$items[] = ...` accumulation in pagination loop
- OOM errors during data sync jobs
- PHP memory limit exceeded for pagination tasks

### Why It Is Harmful
All pages are fetched and stored in memory simultaneously. A 500-page result set at 20KB/page = 10MB — manageable. But 5000 pages at 100KB/page = 500MB. PHP memory limit (128MB default) is exceeded. The worker crashes.

### Real-World Consequences
A monthly invoice sync pulls all invoices. In month 1: 100 invoices, fine. Month 12: 1200 invoices. The worker crashes with an OOM error at page 800. Invoices from the last 4 months are never synced.

### Preferred Alternative
Use `LazyCollection` wrapping with yield-per-item for streaming one page at a time.

### Refactoring Strategy
1. Replace `collect()` with `LazyCollection::make()` wrapping
2. Use `yield from $paginated->items()` to stream items
3. Process items in the loop, don't accumulate them
4. If accumulation is required, use a temporary file or database

### Detection Checklist
- [ ] `collect()` on paginated results
- [ ] Manual array accumulation in pagination loop
- [ ] OOM errors during pagination

### Related Rules
Use LazyCollection for Large Paginated Data Sets (05-rules.md)

### Related Skills
Handle Paginated API Responses with SaloonPHP (06-skills.md)

### Related Decision Trees
Memory and Performance Management Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: Deep Pagination Without Rate Limiting

### Category
Reliability | Scalability

### Description
Performing deep pagination (100+ pages) without enabling the rate limiting plugin on the connector. Rapid sequential requests trigger upstream rate limits.

### Why It Happens
Rate limiting is configured for the connector's general use, but pagination generates requests much faster than normal usage.

### Warning Signs
- 429 errors during pagination (but not during normal API calls)
- Pagination slows down or stops midway through
- Rate limit headers show exhausted capacity during pagination

### Why It Is Harmful
Deep pagination sends requests back-to-back with no delay. 200 pages = 200 rapid requests. The upstream rate limit is hit at page 50. All remaining 150 pages get 429 errors. The sync is incomplete.

### Real-World Consequences
A GitHub issue export job paginates through 500 pages of issues. At page 60 (60 requests in 60 seconds), GitHub returns 429 (60 req/min limit). The remaining 440 pages fail. The export has only 12% of the data.

### Preferred Alternative
Enable the rate limiting plugin on the connector before performing pagination.

### Refactoring Strategy
1. Add `HasRateLimitPlugin` trait to the connector
2. Configure rate limit matching upstream documented limits
3. Reduce concurrency if using parallel page fetching
4. Monitor 429 rate during pagination
5. Implement retry with backoff for rate-limited pages

### Detection Checklist
- [ ] Deep pagination without rate limiting
- [ ] 429 errors during pagination
- [ ] Rate limits only triggered during pagination (not normal use)

### Related Rules
Combine Pagination with Rate Limiting Plugin (05-rules.md)

### Related Skills
Handle Paginated API Responses with SaloonPHP (06-skills.md)

### Related Decision Trees
Memory and Performance Management Strategy (07-decision-trees.md)

---

## Anti-Pattern 5: No Checkpointing for Long-Running Pagination

### Category
Reliability | Performance

### Description
Starting pagination from the beginning on every retry instead of saving the last successful cursor/page for resume.

### Why It Happens
Implementing checkpointing requires persistent storage and recovery logic. Simple while-loops are much easier to write.

### Warning Signs
- Pagination retries always start from page 1
- Long sync jobs restart from scratch on failure
- Same records processed thousands of times

### Why It Is Harmful
If a pagination job fails at page 500 (out of 1000), the next retry fetches pages 1-500 again. 500 API calls are wasted. If the API is slow or the rate limit is low, this wastes hours of processing time and consumes API quota.

### Real-World Consequences
A 10000-page customer sync fails at page 8000 due to a transient network error. The retry starts from page 1. After 8000 pages, it fails again at page 8000. This repeats 3 times. 24000 wasted API calls. The sync takes 4 hours instead of 1.

### Preferred Alternative
Save the last cursor/page after each page. On retry, resume from the checkpoint.

### Refactoring Strategy
1. Identify pagination loops in sync jobs
2. Before pagination, check for saved checkpoint
3. After each page, save current cursor to cache with TTL
4. On failure, restart from the saved checkpoint
5. Clear checkpoint on successful completion

### Detection Checklist
- [ ] Pagination restarts from page 1 on retry
- [ ] No checkpoint storage mechanism
- [ ] Long pagination jobs waste API calls on retry

### Related Rules
Implement Checkpointing for Long-Running Pagination (05-rules.md)

### Related Skills
Handle Paginated API Responses with SaloonPHP (06-skills.md)

### Related Decision Trees
Paginator Implementation Approach (07-decision-trees.md)

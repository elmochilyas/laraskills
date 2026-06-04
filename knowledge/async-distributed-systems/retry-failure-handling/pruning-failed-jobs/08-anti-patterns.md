# Anti-Patterns: Pruning Failed Jobs

## Metadata

| Attribute | Value |
|---|---|
| Domain | Async & Distributed Systems |
| Subdomain | Retry & Failure Handling |
| Knowledge Unit | K086 — Pruning Failed Jobs |
| Classification | Foundation |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Never Pruning Failed Jobs | Performance | High |
| 2 | Pruning Too Aggressively (1-Hour Retention) | Operations | High |
| 3 | Pruning During Peak Traffic | Performance | Medium |
| 4 | Single Large DELETE on Huge Tables | Reliability | Medium |

## Repository-Wide Anti-Patterns

| Anti-Pattern | Affected KUs | Severity |
|---|---|---|
| No Automated Pruning Schedule | pruning-failed-jobs, failed-jobs-storage | High |
| Pruning Without Compliance Review | pruning-failed-jobs | Medium |

---

## Anti-Pattern 1: Never Pruning Failed Jobs

### Category
Performance — Unbounded Table Growth

### Description
Never scheduling `queue:prune-failed` to run. The `failed_jobs` table grows with every failure, accumulating kilobyte-sized payloads and stack traces. An unpruned table with 100K+ rows slows queries, increases backup size, and degrades `queue:retry` performance.

### Why It Happens
The `queue:prune-failed` command exists but must be explicitly scheduled. Teams set up the queue but forget maintenance tasks.

### Warning Signs
- `failed_jobs` table has >10K rows
- `queue:retry` takes seconds to execute (full table scan)
- Horizon failure view is slow to load
- Database backup file is inflated by failed_jobs data
- Team has never run `queue:prune-failed`

### Why Harmful
An unpruned table means every `SELECT * FROM failed_jobs` scans hundreds of thousands of rows. The `exception` column stores 2-10KB per row — 100K rows = 200MB-1GB of unnecessary storage. Database backups take longer and cost more.

### Real-World Consequences
A production system accumulates 200K `failed_jobs` rows over 18 months. The team needs to retry all jobs from a specific queue: `queue:retry --queue=emails` takes 45 seconds because it scans all 200K rows. The database backup is 3GB instead of 1GB. A developer queries for recent failures: `SELECT * FROM failed_jobs ORDER BY failed_at DESC LIMIT 10` takes 5 seconds on the unindexed table.

### Preferred Alternative
Schedule `queue:prune-failed` to run daily, retaining 7-30 days of history.

### Refactoring Strategy
1. Add to `schedule()`: `$schedule->command('queue:prune-failed --hours=168')->daily()`
2. Set retention window based on investigation needs (7 days minimum, 30 typical)
3. Run initial manual prune to clean existing backlog
4. Monitor `failed_jobs` table size after pruning stabilizes
5. Add alert on table size >10K rows

### Detection Checklist
- [ ] No pruning scheduled
- [ ] `failed_jobs` table >10K rows
- [ ] `queue:retry` is slow
- [ ] Backup size inflated by failure data

### Related Rules/Skills/Decision Trees
- **Rule 1**: schedule-daily-pruning (`05-rules.md`)
- **Skill**: Schedule Pruning of Failed Jobs (`06-skills.md`)
- **Decision**: Pruning Frequency and Retention Period (`07-decision-trees.md`)

---

## Anti-Pattern 2: Pruning Too Aggressively (1-Hour Retention)

### Category
Operations — Lost Incident Evidence

### Description
Setting retention to 1 hour (or other very short period). Incident evidence is deleted before the team can investigate the root cause. A production incident at 2 AM is pruned by 3 AM — on-call engineer investigating at 3:30 AM finds no data.

### Why It Happens
Developers focus on keeping the table small and set aggressive pruning without considering the investigation window.

### Warning Signs
- `queue:prune-failed --hours=1` or similar short retention
- Failed jobs from a few hours ago are already deleted
- Incident investigation yields no failure data
- Team must reproduce issues to see error details
- `failed_jobs` table always has <100 rows

### Why Harmful
When a production incident occurs, the `failed_jobs` table is the primary source of diagnostic information — exception messages, stack traces, payloads, and timestamps. With 1-hour retention, an incident at 2 AM may have all evidence pruned by 4 AM when the on-call engineer investigates.

### Real-World Consequences
A bug causes 10,000 job failures starting at 3 AM. The aggressive pruning schedule runs at 4 AM with `--hours=1`, deleting all failures older than 3 AM. The on-call engineer investigates at 5 AM — only the last hour's failures remain (1,000 of 10,000). The engineer can't see the failure pattern over time. Root cause analysis takes twice as long.

### Preferred Alternative
Retain at least 7 days of failure history. Adjust based on team investigation cadence.

### Refactoring Strategy
1. Change retention to `--hours=168` (7 days) at minimum
2. For regulated environments: use `--hours=720` (30 days)
3. Set separate archival for audit compliance (don't rely on failed_jobs table)
4. Document retention policy and investigation window
5. Verify after incident that failure data is available for the full retention window

### Detection Checklist
- [ ] Retention < 24 hours
- [ ] Recent failure data unavailable
- [ ] Incident investigation hindered by missing data
- [ ] No documented retention policy

### Related Rules/Skills/Decision Trees
- **Rule 4**: no-overly-aggressive-pruning (`05-rules.md`)
- **Decision**: Pruning Frequency and Retention Period (`07-decision-trees.md`)

---

## Anti-Pattern 3: Pruning During Peak Traffic

### Category
Performance — DB Contention

### Description
Running `queue:prune-failed` during peak job processing hours. The `DELETE` operation competes with `INSERT INTO failed_jobs` and other database queries — potentially causing contention, lock waits, and degraded performance.

### Why It Happens
Teams schedule pruning at a convenient time (during work hours) without considering database load patterns.

### Warning Signs
- `queue:prune-failed` scheduled at noon or during peak business hours
- Pruning execution coincides with high failure rates
- DB CPU/IO spikes during prune execution
- `INSERT INTO failed_jobs` times out during large deletes
- Pruning takes longer than expected due to contention

### Why Harmful
A large `DELETE` operation locks rows or blocks writes to the `failed_jobs` table. If a job fails during the prune, the `INSERT INTO failed_jobs` may time out or queue behind the delete. The failure record may be lost. Application queries on the same connection may also be affected.

### Real-World Consequences
A daily prune runs at 12 PM sharp. At 12:05 PM, a transient network issue causes 200 jobs to fail. The `INSERT INTO failed_jobs` for each failure queues behind the large `DELETE` transaction. Each insert takes 200ms instead of 5ms. The workers block on the slow inserts. New jobs wait behind the blocked workers. Queue backlog grows during the 12:00-12:05 window.

### Preferred Alternative
Schedule pruning during low-traffic periods — typically between 2 AM and 5 AM.

### Refactoring Strategy
1. Move pruning schedule to off-peak hours: `->dailyAt('03:00')`
2. Check application traffic patterns to identify low-traffic windows
3. Monitor DB load during prune execution to confirm minimal impact
4. For multi-timezone applications: coordinate with global traffic patterns
5. Add logging to track prune duration for performance monitoring

### Detection Checklist
- [ ] Pruning during peak business hours
- [ ] Pruning overlaps with high failure rate periods
- [ ] DB contention during prune execution
- [ ] Workers slow during prune window

### Related Rules/Skills/Decision Trees
- **Rule 2**: prune-during-low-traffic (`05-rules.md`)
- **Skill**: Schedule Pruning of Failed Jobs (`06-skills.md`)

---

## Anti-Pattern 4: Single Large DELETE on Huge Tables

### Category
Reliability — Long-Running Lock

### Description
Running a single `DELETE FROM failed_jobs WHERE failed_at < ?` on a table with 100K+ rows. The single large delete can take minutes, holding row locks and blocking other operations on the `failed_jobs` table.

### Why It Happens
The default `queue:prune-failed` issues a single `DELETE` statement. Teams don't customize it for large tables.

### Warning Signs
- `failed_jobs` table has 100K+ rows
- Prune command takes >30 seconds to complete
- DB monitoring shows long-running delete transactions
- Other queries on `failed_jobs` time out during pruning
- Workers report "deadlock" or "lock wait timeout" errors during prune window

### Why Harmful
A single `DELETE` on 1M rows can hold locks for minutes. During this time, `INSERT INTO failed_jobs` (on job failure) blocks behind the delete. Other queries on the same table or connection also wait. Under high failure rates, the blocked inserts compound — workers can't record failures, and the failure handling pipeline stalls.

### Real-World Consequences
A `failed_jobs` table has 500K rows. `queue:prune-failed --hours=168` runs and issues a single `DELETE WHERE failed_at < '2026-05-27'`. The delete takes 90 seconds to find and remove 400K matching rows. During those 90 seconds, 50 job failures occur — the `INSERT INTO failed_jobs` statements all block behind the delete. Workers wait for the inserts to complete. The queue backlog grows. After the prune finishes, the backlog takes 5 minutes to clear.

### Preferred Alternative
For large tables, implement chunked deletion: `DELETE ... LIMIT 1000` in a loop.

### Refactoring Strategy
1. Check `failed_jobs` table size — consider chunking if >100K rows
2. Implement custom chunked prune:
   ```php
   $schedule->call(function () {
       do {
           $deleted = DB::delete("DELETE FROM failed_jobs WHERE failed_at < ? LIMIT 1000", [now()->subDays(7)]);
           usleep(100000);
       } while ($deleted > 0);
   })->dailyAt('03:00');
   ```
3. Monitor prune duration and adjust chunk size if needed
4. Consider keeping `queue:prune-failed` for smaller tables
5. Document the chunking strategy and threshold

### Detection Checklist
- [ ] `failed_jobs` table >100K rows
- [ ] Prune command takes >30 seconds
- [ ] Long-running delete transactions
- [ ] Lock contention during pruning

### Related Rules/Skills/Decision Trees
- **Rule 3**: chunked-pruning-for-large-tables (`05-rules.md`)
- **Skill**: Schedule Pruning of Failed Jobs (`06-skills.md`)

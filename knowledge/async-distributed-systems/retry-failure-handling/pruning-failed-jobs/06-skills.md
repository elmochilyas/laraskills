# Skill: Schedule Pruning of Failed Jobs

## Purpose
Configure regular pruning of the `failed_jobs` table so it stays bounded, queries remain fast, and storage costs are controlled.

## When To Use
Every production application with queue jobs. Recommended retention: 7-30 days.

## When NOT To Use
Regulated environments needing audit trails (custom archival instead); pruning without reviewing retention needs first.

## Prerequisites
- `failed_jobs` table configured
- Understanding of application SLA for failure investigation window

## Inputs
- Retention period (hours) — typically 168 (7 days)
- Low-traffic schedule window
- Table size estimate for chunking decision

## Workflow
1. Schedule `queue:prune-failed --hours=168` daily in console kernel
2. Set retention to 168 hours (7 days) by default — adjust for compliance
3. Run during low-traffic period: `$schedule->command(...)->dailyAt('03:00')`
4. For tables > 100K rows: implement chunked deletion with `LIMIT 1000`
5. Never use retention < 24 hours — incident evidence lost
6. For very large tables: add `usleep(100000)` between chunks
7. Monitor pruning execution in logs

## Validation Checklist
- [ ] `queue:prune-failed` scheduled daily
- [ ] Retention period set (7-30 days)
- [ ] Runs during low-traffic period
- [ ] Chunked delete for large tables (> 100K rows)
- [ ] Not pruned too aggressively (< 24h retention)
- [ ] Pruning execution logged and monitored
- [ ] Retention matches compliance requirements

## Common Failures
- No pruning — table grows unbounded, slow queries
- Pruning too aggressively (1h retention) — incident evidence lost
- Pruning during peak hours — DB contention
- Single DELETE on 1M-row table — long lock time

## Decision Points
- 7-day retention: standard for most applications
- 30-day retention: financial/regulated apps
- Chunked pruning: tables > 100K rows
- Off-peak schedule: 3 AM typical

## Related Rules
- Rule 1: schedule-daily-pruning
- Rule 2: prune-during-low-traffic
- Rule 3: chunked-pruning-for-large-tables
- Rule 4: no-overly-aggressive-pruning

## Related Skills
- Configure `failed_jobs` Storage for Production
- Implement `failed()` Method for Job-Specific Cleanup
- Implement Idempotency for Side-Effect Jobs

## Success Criteria
`failed_jobs` table is pruned daily during low traffic, retention period is appropriate for the application, large tables use chunked deletion, and no incident evidence is lost.

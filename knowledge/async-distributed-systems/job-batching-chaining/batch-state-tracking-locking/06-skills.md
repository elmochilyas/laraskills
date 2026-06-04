# Skill: Monitor and Mitigate Batch Row-Level Lock Contention

## Purpose
Track batch state update overhead from row-level locking (`SELECT ... FOR UPDATE`) and mitigate contention by sizing batches appropriately and using InnoDB/PostgreSQL.

## When To Use
When running large batches (> 1,000 jobs) with high worker concurrency; when batch completion times are unexpectedly slow; when monitoring shows DB lock waits.

## When NOT To Use
Small batches (< 100 jobs) where lock contention is negligible; applications using flat batches with no high concurrency.

## Prerequisites
- InnoDB (MySQL) or PostgreSQL database
- Access to DB metrics (Innodb_row_lock_current_waits)

## Inputs
- Batch size (number of jobs)
- Expected worker concurrency for the batch
- Job execution time distribution

## Workflow
1. Keep batch sizes under 1,000 jobs for low lock contention
2. Use InnoDB (MySQL) or PostgreSQL — not SQLite or MyISAM
3. Monitor lock waits: `SHOW STATUS LIKE 'Innodb_row_lock_current_waits'`
4. If lock contention detected, split large batches: `collect($jobs)->chunk(1000)->each(fn($chunk) => Bus::batch($chunk)->dispatch())`
5. Ensure `innodb_lock_wait_timeout` is set appropriately (default 50s)
6. Track batch completion time vs. sum of job processing times to detect serialization overhead

## Validation Checklist
- [ ] Batch sizes under 1,000 for high-concurrency scenarios
- [ ] Database engine is InnoDB or PostgreSQL (not SQLite/MyISAM)
- [ ] Lock wait metrics monitored during batch operations
- [ ] Large jobs chunked into multiple smaller batches
- [ ] `innodb_lock_wait_timeout` configured appropriately
- [ ] Batch completion time vs job processing time gap accounted for

## Common Failures
- Assuming parallel batch updates — all workers serialize on the batch row lock
- Lock timeout under high load — transaction rolled back, job retried
- SQLite/MyISAM — table-level locking blocks all batch operations

## Decision Points
- < 100 jobs: no concern
- 100-1,000 jobs: monitor lock waits
- > 1,000 jobs: chunk into smaller batches
- > 10,000 jobs: redesign approach (chunk aggressively)

## Performance Considerations
- Each job completion: 1 DB txn + 1 SELECT FOR UPDATE + 1 UPDATE
- 10K jobs = 10K sequential DB round-trips (serialized on lock)
- Lock wait increases with concurrency — more workers = more contention

## Related Rules
- Rule 1: keep-batch-sizes-under-1k
- Rule 2: use-innodb-or-postgresql
- Rule 3: monitor-lock-waits-during-batches

## Related Skills
- Orchestrate Parallel Job Execution with Bus::batch
- Use Batch Callbacks for Post-Batch Processing

## Success Criteria
Batch completion time is predictable and proportional to job processing time, lock waits are minimal, and large workloads are chunked into manageable batches.

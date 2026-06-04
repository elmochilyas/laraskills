# Skill: Run Schema Migrations on Replicated Databases

## Purpose

Execute DDL operations (ALTER TABLE, CREATE INDEX, etc.) in a replicated database environment while minimizing replication lag, avoiding replica lock, and preventing application downtime.

## When To Use

- Running Laravel migrations on a production database with replicas
- Executing any ALTER TABLE, CREATE INDEX, or DDL on a primary with active replicas
- Performing schema changes during business hours

## When NOT To Use

- Non-replicated single database (DDL impact is direct on that node only)
- Schema changes that can be performed offline during maintenance window
- Very small tables (<1M rows) where DDL completes instantly

## Prerequisites

- Replication health confirmed (lag near zero)
- Knowledge of target table size (rows, data volume)
- MySQL DDL algorithm awareness (INSTANT, INPLACE, COPY)
- Rollback plan documented

## Inputs

- DDL statement to execute
- Table size (approximate row count and data size)
- Peak traffic hours to avoid
- Replication lag current value

## Workflow (numbered steps)

1. Check current replication lag — must be near zero before starting
2. Review DDL statement: choose `ALGORITHM=INSTANT` (add column, set default) or `ALGORITHM=INPLACE` (add index, rename column) if possible
3. If `ALGORITHM=COPY` is required (change column type, drop primary key):
   - Schedule during low-traffic window
   - Use pt-online-schema-change (Percona Toolkit) for zero-downtime DDL
   - Or use `gh-ost` (GitHub's online schema migration tool)
4. For Laravel migrations: use `Schema::create()`/`Schema::table()` with explicit algorithm:
   ```php
   Schema::table('users', function (Blueprint $table) {
       $table->string('email')->nullable(false)->change();
   })->withAlgorithm('inplace');
   ```
5. Monitor replica lag during DDL execution — if lag exceeds threshold, pause or cancel
6. After DDL completes, verify replicas have applied the change (same schema on all nodes)

## Validation Checklist

- [ ] DDL executed using safest algorithm (INSTANT > INPLACE > COPY)
- [ ] Replica lag remained below threshold during DDL
- [ ] Schema is identical on primary and all replicas after DDL
- [ ] No application errors related to schema mismatch during DDL
- [ ] Rollback plan documented (commented-out DDL for revert)

## Common Failures

- `ALGORITHM=COPY` locks tables on primary, blocks writes, and delays replication
- DDL replication is single-threaded on replica — replica falls behind while applying
- Laravel migration runs during peak hours → replica lag spike → stale reads
- Column type change forces table rebuild (COPY) on large tables (hours of lag)
- Renaming columns breaks replication if replicas use column names in queries

## Decision Points

- Online DDL tool: pt-online-schema-change (MySQL) vs gh-ost (MySQL) vs pgroll (PostgreSQL)
- Algorithm selection: INSTANT (fastest, limited operations) → INPLACE (no full rebuild) → COPY (last resort)
- Migration window: low-traffic for COPY operations, anytime for INSTANT

## Performance Considerations

- INSTANT DDL: completes instantly, no replica lag impact
- INPLACE DDL: allows concurrent reads/writes, but may cause replication delay on replicas
- COPY DDL: full table rebuild, blocks writes, replica lag spike proportional to table size
- pt-online-schema-change: creates shadow table, gradually copies rows, minimal lag impact

## Security Considerations

- DDL changes may affect row-level security or column permissions — verify after migration
- Data type changes may truncate or alter data silently — validate before running

## Related Rules

- 7-20-1: Always Check Replica Lag Before Running DDL
- 7-20-2: Never Use ALGORITHM=COPY During Peak Hours
- 7-20-3: Always Have a Rollback Plan for Schema Migrations

## Related Skills

- Monitor Replica Lag
- Implement Online DDL Strategies
- Run Laravel Migrations in Production

## Success Criteria

- DDL completed without replica lag exceeding threshold
- Schema identical on all nodes post-migration
- Zero application errors during migration
- Zero data loss from schema changes

---

# Skill: Use Online Schema Change Tools with Replication

## Purpose

Use pt-online-schema-change or gh-ost to perform DDL on large tables in replicated environments without locking tables or causing significant replication lag.

## When To Use

- Large tables (millions+ rows) need schema changes
- `ALTER TABLE ... ALGORITHM=COPY` would lock the table for minutes/hours
- Zero-downtime DDL is required
- Replica lag must be minimized during schema changes

## When NOT To Use

- Small tables where DDL completes in seconds
- Schema changes that support INSTANT algorithm (no need for online tools)
- Database engine doesn't support triggers (some managed services)

## Prerequisites

- pt-online-schema-change (Percona Toolkit) or gh-ost installed
- Database user with ALTER, CREATE, INSERT, UPDATE, DELETE, DROP, INDEX permissions
- Sufficient disk space for shadow table (double the target table size)
- Low replication lag before starting

## Inputs

- Target database and table name
- Desired DDL statement (e.g., `ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL`)
- Chunk size for incremental data copy (default: 1000 rows)
- Maximum replication lag threshold (default: 1 second)

## Workflow (numbered steps)

1. Verify disk space: shadow table needs ~2x target table size temporarily
2. Run pt-online-schema-change:
   ```
   pt-online-schema-change --alter "ADD COLUMN last_login_at TIMESTAMP NULL" \
     D=my_database,t=users \
     --chunk-size=1000 \
     --max-lag=1 \
     --check-slave-lag \
     --alter-foreign-keys-method=auto \
     --execute
   ```
3. Monitor progress: chunk-by-chunk copy, trigger-based sync of new changes
4. On completion: tool swaps shadow table for original atomically
5. Verify schema change applied on primary and all replicas
6. Drop old table (tool handles this or leaves for manual cleanup)

## Validation Checklist

- [ ] Schema change applied without table lock
- [ ] Replica lag remained below threshold throughout
- [ ] All foreign keys and triggers preserved
- [ ] Application had zero downtime during migration
- [ ] Disk space usage returned to normal after completion

## Common Failures

- Disk space exhaustion: shadow table doubles storage requirements during migration
- Trigger conflicts: existing triggers on table may conflict with tool's triggers
- Foreign key handling: tool may fail if FK relationships are complex
- Aborting mid-migration: leaves shadow table and triggers, requires manual cleanup
- `--check-slave-lag` not set: tool continues even if replicas fall far behind

## Decision Points

- pt-online-schema-change vs gh-ost: pt-osc (mature, triggers-based, more features) vs gh-ost (binlog-based, less impact on replica, newer)
- Chunk size: smaller (100) for busy tables, larger (1000-5000) for quiet periods
- Max lag threshold: 1s for strict, 5-10s for tolerant workloads

## Performance Considerations

- Online DDL tools add load to both primary (shadow table writes) and replicas (trigger/row copy)
- Chunk copy is I/O intensive — monitor disk IOPS during migration
- Replicas apply changes from triggers sequentially — lag increases proportionally to write rate

## Security Considerations

- Tool requires elevated database permissions — restrict to migration-specific user
- Shadow tables contain same data as original — ensure consistent encryption
- Clean up triggers and shadow tables after migration

## Related Rules

- 7-20-4: Always Check Disk Space Before Online DDL
- 7-20-5: Always Set --max-lag When Using Online DDL Tools

## Related Skills

- Run Schema Migrations on Replicated Databases
- Monitor Replica Lag
- Manage Database Disk Usage

## Success Criteria

- Schema change completed without application downtime
- Replica lag below threshold (<1s) throughout migration
- Disk usage returned to normal post-migration
- Zero data loss

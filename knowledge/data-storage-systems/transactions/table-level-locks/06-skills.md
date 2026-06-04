# Skill: Avoid Table-Level Locks in InnoDB

## Purpose

Understand that InnoDB uses row-level locking and explicit `LOCK TABLES` should be avoided in favor of transactions with row locks (`SELECT ... FOR UPDATE`).

## When To Use

- InnoDB storage engine (row-level locking is sufficient)
- Need to prevent all concurrent access during rare bulk operations
- MyISAM tables (where row locks don't exist)
- DDL operations that require exclusive metadata locks

## When NOT To Use

- Most InnoDB operations (use transactions + row locks)
- Routine read/write operations (row-level locking provides better concurrency)
- Any operation where concurrent access is acceptable

## Prerequisites

- InnoDB storage engine
- Understanding of row-level locking alternatives

## Inputs

- Operation requiring exclusive access
- Alternative row-level locking strategy

## Workflow (numbered steps)

1. Evaluate whether table lock is truly needed:
   - InnoDB row locks handle most cases
   - Table locks block ALL access (reads + writes) — extreme measure
   - Most "lock the whole table" needs can be solved with `SELECT ... FOR UPDATE` on specific rows

2. For bulk operations requiring exclusive access:
   - Instead of `LOCK TABLES orders WRITE`, use a transaction:
   ```php
   DB::transaction(function () {
       // Acquire an advisory lock or use a specific row as a mutex
       DB::table('table_locks')->where('name', 'orders_bulk')->lockForUpdate()->first();
       // Perform bulk operations
       Order::where('status', 'pending')->update(['status' => 'processing']);
   });
   ```

3. For DDL operations (ALTER TABLE, DROP TABLE):
   - MySQL handles metadata locks implicitly — no need for LOCK TABLES
   - Online DDL (MySQL 5.6+, 8.0 improvements) allows concurrent DML during most ALTER operations
   - Use `ALGORITHM=INPLACE` or `ALGORITHM=INSTANT` where possible

4. If you must use `LOCK TABLES` (MyISAM or rare InnoDB case):
   ```sql
   LOCK TABLES orders WRITE, users READ;
   -- perform operations
   UNLOCK TABLES;
   ```
   - Must lock all tables you use
   - UNLOCK TABLES implicitly commits the current transaction
   - Not compatible with InnoDB transactions (causes implicit commit)

## Validation Checklist

- [ ] `LOCK TABLES` not used in application code (InnoDB)
- [ ] Bulk operations use row-level or advisory locks instead
- [ ] DDL operations use online DDL where possible
- [ ] No implicit commits from mixing LOCK TABLES and transactions
- [ ] MyISAM tables migrated to InnoDB (if feasible)

## Common Failures

- `LOCK TABLES` inside a transaction — implicit commit before LOCK
- Mixing `LOCK TABLES` with `SELECT ... FOR UPDATE` — deadlock risk
- Table lock held during long operation — application downtime
- `LOCK TABLES` with InnoDB when row locks suffice — unnecessary blocking
- Forgetting to `UNLOCK TABLES` — tables inaccessible

## Decision Points

- Table lock vs row lock vs advisory lock
- InnoDB vs MyISAM storage engine choice
- Online DDL vs offline maintenance window

## Performance Considerations

- Table lock: blocks ALL other sessions (reads + writes)
- Row lock: blocks only conflicting row operations
- Table lock duration = LOCK to UNLOCK period
- Row lock duration = transaction scope

## Security Considerations

- Table locks may cause denial of service (block all access)
- Audit LOCK TABLE usage carefully
- Consider maintenance window for table-level operations

## Related Rules

- 9-6-1: Never Use LOCK TABLES in InnoDB
- 9-6-2: Always Use Row-Level Locking Instead of Table Locks

## Related Skills

- Use Row-Level Locks
- Implement Advisory Locks
- Perform Online DDL Operations

## Success Criteria

- No `LOCK TABLES` used in application code
- Row-level locks or advisory locks used for exclusive access
- DDL operations use online DDL
- No blocking of concurrent access from table-level locks

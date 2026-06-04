# Skill: Implement Serializable Snapshot Isolation (SSI)

## Purpose

Use PostgreSQL's SSI (SERIALIZABLE) for true serializability without blocking reads, detecting conflicts via predicate locking and aborting one transaction.

## When To Use

- PostgreSQL only (SSI is not available in MySQL)
- Need true serializability (prevent write skew and all other anomalies)
- Can tolerate occasional transaction aborts (serialization_failure 40001)
- Financial or inventory systems where concurrent invariants must be guaranteed
- Read-heavy workloads where pessimistic SERIALIZABLE would block too much

## When NOT To Use

- MySQL (uses pessimistic locking for SERIALIZABLE, not SSI)
- High conflict rate (SSI aborts become too frequent)
- Application cannot implement retry logic
- READ COMMITTED or REPEATABLE READ is sufficient for the workload
- Long transactions (longer transactions increase conflict probability)

## Prerequisites

- PostgreSQL 9.1+ (SSI available)
- Retry logic for serialization_failure (40001)
- Monitoring for serialization failure rate

## Inputs

- Transaction to run
- Retry configuration (max attempts, backoff)

## Workflow (numbered steps)

1. Set isolation level to SERIALIZABLE (SSI):
   ```sql
   BEGIN;
   SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
   -- transaction operations
   COMMIT;
   ```

2. Implement retry wrapper in Laravel:
   ```php
   function serializableTransaction(callable $callback, int $maxRetries = 5): mixed
   {
       for ($attempt = 0; $attempt < $maxRetries; $attempt++) {
           try {
               return DB::transaction(function () use ($callback) {
                   DB::statement('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
                   return $callback();
               });
           } catch (QueryException $e) {
               if ($e->getCode() !== '40001') throw;
               // SSI conflict — retry
               if ($attempt === $maxRetries - 1) throw;
               usleep(50_000 * pow(2, $attempt)); // exponential backoff
           }
       }
   }
   ```

3. Use for write-skew-prone operations:
   ```php
   serializableTransaction(function () {
       // Both transactions would pass individually, but SSI catches the conflict
       $onCallCount = Doctor::where('on_call', true)->count();
       if ($onCallCount === 0) {
           Doctor::where('id', $doctorId)->update(['on_call' => true]);
       }
   });
   ```

4. Monitor serialization failures:
   ```sql
   SELECT * FROM pg_stat_database WHERE datname = 'your_database';
   -- Check `serialization_failures` counter
   ```

5. Keep transactions short — SSI conflict probability increases with transaction duration

## Validation Checklist

- [ ] SERIALIZABLE isolation set on the transaction
- [ ] Retry logic handles serialization_failure (40001)
- [ ] Exponential backoff between retries
- [ ] Transaction is short (< 100ms)
- [ ] SSI conflict rate monitored (< 5% abort rate)
- [ ] Application behavior correct under serialization (no data loss or inconsistent state)

## Common Failures

- SSI without retry — transaction silently fails, data not persisted
- Long transactions under SSI — high abort rate (conflict window larger)
- Confusing MySQL SERIALIZABLE (pessimistic, blocking) with PostgreSQL SSI (optimistic)
- Not monitoring `serialization_failures` — cannot detect high conflict rate
- Using SSI globally when only specific transactions need it

## Decision Points

- SSI vs pessimistic locking with SERIALIZABLE (MySQL vs PostgreSQL)
- SSI vs explicit FOR UPDATE: SSI simpler but with retry overhead; FOR UPDATE requires manual lock management
- SSI scope: global vs per-transaction
- Retry count: 5 (conservative) vs 3 (standard)

## Performance Considerations

- SSI: optimistic, no blocking, but retries on conflict
- SIREAD locks: memory overhead for predicate tracking
- Conflict rate proportional to overlap between concurrent transactions
- Long transactions exponentially increase conflict probability
- PostgreSQL SSI overhead: 5-15% compared to READ COMMITTED

## Security Considerations

- SSI doesn't bypass access controls or RLS policies
- Serialization failure rate may indicate design issue (not security issue)

## Related Rules

- 9-17-1: Always Retry on SSI Serialization Failure (40001)
- 9-17-2: Never Use SSI Without Monitoring Conflict Rate

## Related Skills

- Prevent Write Skew
- Use PostgreSQL Isolation Features
- Implement Transaction Retry Logic

## Success Criteria

- SSI prevents all serialization anomalies without blocking reads
- Retry logic handles serialization failures gracefully
- Serialization failure rate < 5% (acceptable)
- Transactions with SSI are short (< 100ms)
- SSI used only where needed (not globally)

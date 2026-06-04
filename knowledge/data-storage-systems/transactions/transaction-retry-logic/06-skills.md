# Skill: Implement Transaction Retry Logic

## Purpose

Implement retry logic with exponential backoff for serialization failures (deadlocks, SSI conflicts, lock wait timeouts) to make transactions resilient to transient conflicts.

## When To Use

- All transactions that may encounter deadlocks or serialization failures
- SERIALIZABLE isolation level (conflicts expected)
- High-contention resources where lock conflicts occur
- Any application that cannot tolerate transaction failure

## When NOT To Use

- READ ONLY transactions (no write conflicts)
- Single-statement operations (database auto-retries internally)
- Non-retryable errors (syntax errors, constraint violations)
- Operations with destructive side effects on retry (e.g., email sending)

## Prerequisites

- Understanding of retryable error codes
- Transaction scope identified

## Inputs

- Transaction callback
- Retry configuration (max attempts, backoff strategy)

## Workflow (numbered steps)

1. Identify retryable error codes:
   - MySQL: 1213 (deadlock), 1205 (lock wait timeout)
   - PostgreSQL: 40001 (serialization failure), 40P01 (deadlock detected)
   - SQL Server: 1205 (deadlock)

2. Implement a reusable retry wrapper:
   ```php
   class TransactionHelper
   {
       public static function retry(
           callable $callback,
           int $maxAttempts = 3,
           int $baseDelayMs = 100
       ): mixed {
           for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
               try {
                   return DB::transaction($callback);
               } catch (QueryException $e) {
                   if (!self::isRetryable($e)) throw $e;
                   if ($attempt === $maxAttempts - 1) throw $e;
                   $delay = $baseDelayMs * pow(2, $attempt);
                   $jitter = random_int(0, (int)($delay * 0.2));
                   usleep(($delay + $jitter) * 1000);
               }
           }
       }

       private static function isRetryable(QueryException $e): bool
       {
           $code = $e->getCode();
           return in_array($code, ['1213', '1205', '40001', '40P01']);
       }
   }
   ```

3. Use the wrapper in production code:
   ```php
   TransactionHelper::retry(function () use ($orderId, $amount) {
       $account = Account::where('id', $orderId)->lockForUpdate()->first();
       $account->balance += $amount;
       $account->save();
   });
   ```

4. Add jitter (±20%) to prevent thundering herd:
   - Multiple clients retrying simultaneously all wait the same time
   - Jitter randomizes the delay to spread retries

5. Log retry attempts for monitoring:
   ```php
   Log::warning("Transaction retry attempt {$attempt} for query: ...");
   ```

## Validation Checklist

- [ ] Retry wrapper implemented for serialization failures
- [ ] Max retry count limited (3-5 attempts)
- [ ] Exponential backoff with jitter
- [ ] Non-retryable errors re-thrown immediately
- [ ] Retry attempts logged for monitoring
- [ ] After max retries, error propagated to caller
- [ ] No side effects from retry (idempotent operations)

## Common Failures

- Infinite retry loop — always set max retry count
- Retrying non-retryable errors (syntax error retries forever)
- No backoff — immediate retry fails again immediately
- No jitter — thundering herd on all retries
- Retrying operations with side effects (e.g., payment charged twice)
- `DB::transaction($attempts)` not used (Laravel's built-in retry is limited)

## Decision Points

- Retry count: 3 (standard) vs 5 (conservative)
- Backoff: exponential vs fixed vs immediate
- Jitter: ±20% vs ±50% (more jitter = more spread)
- Log level: warning vs debug for retry attempts

## Performance Considerations

- Exponential backoff: 100ms → 200ms → 400ms (total ~700ms for 3 retries)
- Jitter adds randomness to prevent thundering herd
- Retry increases latency for conflicting transactions
- High retry rate indicates design issue (lock contention too high)

## Security Considerations

- Retry does not bypass access controls
- Idempotency: ensure retried operations can be safely repeated
- Payment or decrement operations must be idempotent

## Related Rules

- 9-20-1: Always Retry on Serialization Failures
- 9-20-2: Never Retry Non-Retryable Errors

## Related Skills

- Detect and Resolve Deadlocks
- Implement Serializable Snapshot Isolation
- Prevent Write Skew

## Success Criteria

- Retry wrapper handles all serialization failures
- Exponential backoff with jitter prevents thundering herd
- Non-retryable errors propagate immediately
- Retry rate monitored and below acceptable threshold
- All retried transactions eventually succeed

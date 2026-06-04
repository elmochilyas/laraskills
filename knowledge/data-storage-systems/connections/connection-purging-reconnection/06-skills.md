# Skill: Purge and Reconnect Connections

## Purpose

Use `DB::purge()` and `DB::reconnect()` to force Laravel to create new database connections after runtime config changes, ensuring stale PDO objects are not reused.

## When To Use

- After `config()->set()` changes to connection parameters
- During database failover (update config to new primary, purge, reconnect)
- During credential rotation
- After a connection becomes stale ("gone away" error)
- In multi-tenant middleware switching to a different tenant database

## When NOT To Use

- On every request for shared-table tenancy (unnecessary overhead)
- When no config change has been made
- Inside tight loops (purge + reconnect is ~1–50ms per call)
- On the default connection without considering model resolution

## Prerequisites

- Understanding of connection lifecycle (10-1)
- Understanding of dynamic connection config (10-5)
- Laravel DatabaseManager internals

## Inputs

- Connection name to purge/reconnect
- New config parameters (if changed)
- Existing Eloquent model instances (need re-hydration after purge)

## Workflow (numbered steps)

1. Change config parameters if needed:
   ```php
   config(['database.connections.mysql.host' => $newHost]);
   ```

2. Purge the stale connection from the resolver:
   ```php
   DB::purge('mysql');
   ```

3. Reconnect using either method:
   - **Recommended**: `DB::reconnect('mysql')` — atomic purge + connect
   - **Manual**: `DB::connection('mysql')` — lazy reconnect on next query

4. Handle purge failure gracefully — wrap in try-catch:
   ```php
   try {
       DB::reconnect('mysql');
   } catch (QueryException $e) {
       Log::critical('Reconnect failed', ['error' => $e->getMessage()]);
       throw $e;
   }
   ```

5. Re-hydrate any model instances loaded before the purge:
   - Models cache their connection in `$connection` property
   - Re-query or use `$model->fresh()` after switching

6. Ensure no active transactions before purging:
   - Purge inside a transaction silently rolls back uncommitted work

7. For failover scenarios, combine with retry loop:
   ```php
   function executeWithFailover(callable $query, int $retries = 3): mixed
   {
       for ($attempt = 0; $attempt < $retries; $attempt++) {
           try {
               return $query();
           } catch (QueryException $e) {
               if (connectionError($e)) {
                   config(['database.connections.mysql.host' => ConfigService::getPrimaryHost()]);
                   DB::reconnect('mysql');
                   usleep(100_000);
                   continue;
               }
               throw $e;
           }
       }
   }
   ```

## Validation Checklist

- [ ] Every `config()->set()` on database config is followed by purge or reconnect
- [ ] Purge/reconnect calls are wrapped in try-catch
- [ ] No active transactions when purge is called
- [ ] Models loaded before purge are re-queried after switching
- [ ] Log entries show connection switches with identifiers
- [ ] Failover retry logic successfully reconnects to new primary

## Common Failures

- Config change without purge — stale PDO reused silently
- Purge without reconnect — first query after purge pays connection latency
- Purging wrong connection name — stale connection remains cached
- Purge inside transaction — uncommitted work silently rolled back
- Not re-hydrating models after purge — model queries use stale connection

## Decision Points

- DB::purge() + lazy connect vs DB::reconnect() eager connect
- Try-catch with fallback vs fail-closed
- Logging level on purge events (info vs debug)
- Octane: per-worker purge vs broadcast to all workers

## Performance Considerations

- DB::purge() itself: <0.01ms (array key removal)
- DB::reconnect(): 1–50ms (full TCP + auth + SSL)
- Frequent purge/reconnect in Octane creates connection churn
- On PHP-FPM, purge/reconnect is per-request anyway — negligible

## Security Considerations

- Purging removes PDO from scope — credentials eligible for GC
- After credential rotation, purge ensures new creds are used immediately
- If purge fails, fail closed (reject requests) rather than using stale cached creds

## Related Rules

- 10-6-1: Always Pair config()->set() with purge()
- 10-6-2: Use DB::reconnect() for Simplicity

## Related Skills

- Implement Dynamic Connection Config
- Handle Connection Failover
- Manage Credential Rotation

## Success Criteria

- All config changes are immediately reflected in new connections
- No stale connection errors after switches
- Failover retry logic recovers from connection failures
- Purge/reconnect is never called inside active transactions
- Models correctly use the new connection after re-hydration

# Skill: Calculate and Manage Connection Budgets for Octane Workers

## Purpose
Size database and Redis connection pools for Octane's persistent-worker model by computing per-worker connection requirements, applying safety margins, configuring read/write splitting, and establishing monitoring to prevent connection exhaustion.

## When To Use
- Deploying Octane to production for the first time
- Adding more Octane workers and recalculating connection budgets
- After database migration or configuration changes
- When troubleshooting connection exhaustion errors under Octane
- When migrating from PHP-FPM to Octane

## When NOT To Use
- For PHP-FPM deployments (connection-per-request model differs fundamentally)
- When using a database proxy (PgBouncer, ProxySQL) that manages the pool independently — monitor the proxy instead
- For serverless deployments (Vapor, etc.) where the runtime manages connections
- For read-only databases with no connection pool limit concerns

## Prerequisites
- Octane installed and configured with chosen driver
- Worker count determined (from worker configuration tuning)
- Database server `max_connections` value (or access to increase it)
- Redis `maxclients` value if Redis connections are a concern
- List of all services each worker connects to (MySQL, Redis, Elasticsearch, etc.)
- Access to database monitoring (connection count, active queries)

## Inputs
- Octane worker count (current or planned)
- List of persistent connections per worker (MySQL read, MySQL write, Redis, other services)
- Database `max_connections` limit
- Redis `maxclients` limit
- Average and peak queries per second
- Read/write query ratio (percentage of SELECT vs INSERT/UPDATE/DELETE)
- Current connection utilization (number of active connections)

## Workflow

### 1. Enumerate Connections Per Worker
- List every persistent external connection each Octane worker maintains:
  - MySQL (or PostgreSQL) primary connection: 1 per worker
  - MySQL read replica connection: 1 per worker (if read/write splitting configured)
  - Redis connection (cache, session): 1-2 per worker (session + cache)
  - Redis connection (Horizon, queues): 1 per worker if queue worker runs in-process
  - Other services: Elasticsearch, MongoDB, etc.
- Default: count 2-3 connections per worker (1 DB + 1-2 Redis)
- Document: service, connection count per worker, purpose

### 2. Calculate Total Connection Budget
- Formula: `total_connections = worker_count × connections_per_worker`
- Apply 80% safety margin: `max_safe_connections = database_max_connections × 0.8`
- Verify: `total_connections ≤ max_safe_connections`
- Example: 8 workers × 2 connections each = 16 connections. Database max_connections = 40. 16 ≤ 40 × 0.8 (32) → OK
- If budget is exceeded, options:
  - Reduce worker count (primary lever)
  - Increase database max_connections (if infrastructure permits)
  - Use a connection pooler (PgBouncer, ProxySQL) to share connections across workers
  - For Redis: increase maxclients in redis.conf

### 3. Configure Read/Write Splitting
- Set up distinct read and write database hosts in `config/database.php`
- Configure read replicas: `'read' => ['host' => ['replica1.host', 'replica2.host']]`
- Configure write primary: `'write' => ['host' => ['primary.host']]`
- Verify read queries (SELECT) route to replicas, write queries (INSERT, UPDATE, DELETE) route to primary
- This preserves write-primary connection pool for mutations while reads use separate capacity
- Monitor replica lag to ensure read-after-write consistency is acceptable

### 4. Configure Connection Timeouts
- Set `PDO::ATTR_TIMEOUT` to 5 seconds in database configuration
- This prevents workers from hanging indefinitely when the pool is exhausted
- Configuration: `'options' => [PDO::ATTR_TIMEOUT => 5, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]`
- For Redis: set `read_write_timeout` to 5 seconds
- For custom connections (Guzzle HTTP, Elasticsearch): configure timeouts explicitly

### 5. Implement Safe Transaction Handling
- Audit all custom database transactions (DB::beginTransaction() calls)
- Ensure every transaction has a `try { ... DB::commit() } catch { DB::rollBack() }` pattern
- Verify no raw PDO queries bypass Eloquent's transaction management
- Octane sandbox resets Eloquent connections, but custom PDO usage bypasses this
- Add a CI linter rule: flag `DB::beginTransaction()` without corresponding `DB::commit()` or `DB::rollBack()`

### 6. Set Up Connection Utilization Monitoring
- Monitor database connection count: `SHOW PROCESSLIST` or equivalent
- Track connection utilization percentage: `(current_connections / max_connections) × 100`
- Set warning alert at 60% utilization
- Set critical alert at 80% utilization
- Monitor trend over hours/days — gradual upward creep indicates a connection leak
- For Redis: `INFO clients` shows connected_clients vs maxclients

### 7. Test Connection Pool Behavior Under Load
- Run load test with peak expected traffic
- Monitor connection count during the test — should plateau at calculated budget
- If connections continue growing beyond budget: investigate connection leak
- Test connection exhaustion scenario: simulate by temporarily lowering max_connections
- Verify connection timeout fires: workers return 503 instead of hanging
- Verify connections recover when pool pressure reduces

### 8. Document Connection Budget and Monitoring
- Record: worker count, connections per worker, total budget, max_connections, safety margin
- Document the connection budget calculation for future capacity planning
- Create runbook entries for connection exhaustion incident response
- Include steps: verify worker count, check for connection leaks, increase max_connections or reduce workers

## Validation Checklist
- [ ] All persistent connections per worker enumerated
- [ ] Total connection budget calculated: `worker_count × connections_per_worker`
- [ ] Budget within 80% of database max_connections: `total ≤ max_connections × 0.8`
- [ ] Read/write splitting configured (read replicas for SELECT, primary for writes)
- [ ] Connection timeouts configured (PDO::ATTR_TIMEOUT = 5s or equivalent)
- [ ] All transaction handling uses try/catch/finally with commit/rollback
- [ ] Connection utilization monitoring configured at 60% warning, 80% critical
- [ ] Load test confirms connections plateau at calculated budget
- [ ] Connection exhaustion test passes (503 returned, workers don't hang)
- [ ] Connection budget documented for capacity planning

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Connection exhaustion | Connection refused errors under load | Too many workers × connections exceeding max_connections | Reduce workers or increase max_connections |
| Transaction leak | Stale data or deadlocks | Missing commit/rollback in custom query code | Audit all DB::beginTransaction calls, enforce try/catch pattern |
| Worker hang on exhaustion | Workers unresponsive but alive | No connection timeout configured | Set PDO::ATTR_TIMEOUT and Redis read_write_timeout |
| Connection count creep | Connections slowly increase over hours | Connection leak (connections opened but not returned) | Audit for `new PDO()` or `new Redis()` that bypasses container |
| Write-primary pool exhaustion | Writes fail, reads still work | No read/write splitting — all queries hit primary | Configure read replicas in config/database.php |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Reduce workers vs increase max_connections | Reduce workers if memory is the constraint. Increase max_connections if database can handle more |
| Use connection pooler vs not | Use pooler (PgBouncer, ProxySQL) if workers > 20 or max_connections cannot be increased |
| Read/write splitting vs single endpoint | Use splitting if read query proportion > 80% AND replica lag is acceptable for read-after-write |
| Connection timeout value | 5s for most applications. Increase to 10-15s for latency-sensitive apps. Decrease to 2-3s for fast-fail patterns |
| Transaction auto-rollback vs manual | Prefer auto-rollback via Octane's sandbox for Eloquent; require manual try/catch for raw PDO |

## Performance Considerations
- Persistent connections eliminate 0.5-2ms TCP handshake per request per connection
- Read/write splitting offloads 80%+ of queries to replicas, preserving primary connections for writes
- Connection poolers add ~0.1-0.5ms latency per connection acquisition but reduce total connection count
- Octane sandbox automatically rolls back Eloquent transactions — custom PDO queries may bypass this
- Each persistent connection consumes ~1-5MB OS memory in addition to the database-side connection

## Security Considerations
- Persistent connections authenticate once at worker start — ensure the database user has minimal required privileges
- Connection pool timeouts prevent DoS attacks from connection-hungry requests
- Read replicas should have the same security posture as the write primary (same credentials, encryption)
- Transaction leakage across requests can cause data corruption or expose stale data
- When a worker recycles (max_requests reached), its connections close — ensure no in-flight queries are lost

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Calculate Octane connection budget before deploying: workers × connections ≤ max_connections × 0.8 | `05-rules.md:1` | Step 2: connection budget calculation |
| Always commit or rollback transactions in a finally block | `05-rules.md:27` | Step 5: safe transaction handling |
| Set connection pool timeout in database configuration | `05-rules.md:60` | Step 4: connection timeout configuration |
| Monitor database connection utilization and alert at 80% | `05-rules.md:92` | Step 6: monitoring setup |
| Separate read and write database connections | `05-rules.md:118` | Step 3: read/write splitting |

## Related Skills

| Skill | Relation |
|-------|----------|
| Configure Octane Workers by Driver | Worker count tuning directly affects connection budget |
| Perform FPM-to-Octane Migration | Connection budget recalculation is required during migration |
| Manage and Prevent Octane State Leaks | Transaction leaks are a form of state leak |
| Monitor and Debug Octane Workers | Connection monitoring feeds into worker health monitoring |
| Select the Optimal Octane Driver | Swoole coroutines share connections differently than RoadRunner processes |

## Success Criteria
- Total persistent connections within 80% of database max_connections
- Connection timeouts configured and verified (workers return 503 on pool exhaustion)
- Read/write splitting configured and routing correctly
- All transaction code uses try/catch/finally for proper commit/rollback
- Connection utilization monitoring alerts at 60% (warning) and 80% (critical)
- Load test confirms connections plateau at calculated budget
- Connection exhaustion scenario handled gracefully (no application hang)
- Connection budget documented with rationale for capacity planning

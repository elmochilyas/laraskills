# Skill: Implement Tenant Connection Caching and Pooling

## Purpose

Reduce connection overhead in multi-tenant architectures by caching PDO connections per tenant and deploying connection pooling infrastructure.

## When To Use

- Schema-per-tenant or DB-per-tenant with frequent tenant switching
- PHP-FPM deployments with many concurrent workers
- Octane deployments with persistent workers needing connection reuse

## When NOT To Use

- Shared-table architecture (single connection for all tenants)
- Very low traffic (< 10 requests/second)
- Each worker handles only one tenant (rare)

## Prerequisites

- Understanding of PDO connection lifecycle
- Connection pooler (PgBouncer, ProxySQL) or Octane connection pool config
- Tenant resolution and dynamic connection config

## Inputs

- Tenant database connection details
- Pool configuration (min, max, TTL)
- Cache driver for connection factory

## Workflow (numbered steps)

1. For PHP-FPM: deploy PgBouncer (PostgreSQL) or ProxySQL (MySQL) as server-side pooler
2. Configure pooler with max backend connections = expected concurrent queries × 1.5
3. For Octane: configure `pool.min` and `pool.max` per tenant connection
4. Implement connection factory caching: cache resolved PDO instance keyed by tenant ID
5. Flush connection cache when credentials rotate
6. Monitor connection count per tenant and total pool utilization

## Validation Checklist

- [ ] Connection pooler deployed and configured
- [ ] Connection count stays below database `max_connections`
- [ ] No connection timeout errors under peak load
- [ ] Connection caching reduces per-request connection overhead

## Common Failures

- Pooler not configured for PHP-FPM — each worker opens a new connection
- Connection cache not flushed on credential rotation — stale connections fail
- Pool too small — requests queue and time out

## Decision Points

- Server-side (PgBouncer/ProxySQL) vs client-side (Octane pool) pooling
- Transaction pooling vs session pooling
- Shared pool for all tenants vs per-tenant pools

## Performance Considerations

- Pool sizing: N workers × connections per worker / multiplexing ratio
- Connection handshake: 50-200ms without pool, near zero with pool
- Each connection uses 2-10MB DB server RAM

## Security Considerations

- Pooler must enforce TLS between app and database
- Connection credentials must be rotated without application restart
- Pooler logs must not contain credentials

## Related Rules

- 5-13-1: Always Pool Tenant Connections
- 5-13-2: Never Cache Connections Across Credential Rotation

## Related Skills

- Implement Dynamic Connection Configuration
- Implement Connection Purging and Reconnection
- Implement Pool Architecture

## Success Criteria

- Connection pool utilization > 70% under load
- Zero connection exhaustion errors in production
- Connection caching reduces per-request overhead to < 1ms

---

# Skill: Configure Octane Connection Pool Per Tenant

## Purpose

Optimize Octane's connection pool configuration for multi-tenant workloads with per-worker persistent connections.

## When To Use

- Laravel Octane with multi-tenant architecture
- Schema-per-tenant or DB-per-tenant isolation models
- High-traffic applications needing maximum connection efficiency

## When NOT To Use

- PHP-FPM deployments (use server-side pooler instead)
- Shared-table architecture (single pool is sufficient)
- Very low traffic (< 10 requests/second)

## Prerequisites

- Laravel Octane installed and configured
- Multi-tenant connection switching implementation
- Understanding of Octane worker lifecycle

## Inputs

- Octane worker count
- Expected concurrent requests per worker
- Tenant isolation model (impacts pool design)

## Workflow (numbered steps)

1. Configure connection pool in database config: `'pool' => ['min' => 2, 'max' => 10]`
2. Set `pool.min` to expected baseline concurrent requests per worker
3. Set `pool.max` to peak concurrent requests per worker
4. Set `pool.ttl` to close idle connections above min after inactivity
5. For DB-per-tenant: pool size per tenant must account for active tenants per worker
6. Monitor total connections = workers × pool.max against database max_connections

## Validation Checklist

- [ ] Pool config present on all tenant connections
- [ ] Pool.min pre-warms connections at worker boot
- [ ] Pool.max prevents connection exhaustion
- [ ] Total connection count within database limits

## Common Failures

- Pool config missing — Octane creates new connection per request (defeats purpose)
- Pool.max too high — connection exhaustion when many workers
- Pool.min too high — idle connections waste resources
- Pool config not applied to read replica connections

## Decision Points

- Single pool vs separate pools per connection name
- Pool sizing based on expected concurrency per worker

## Performance Considerations

- Total DB connections = workers × pool.max
- With 10 workers and pool.max=10, maximum connections = 100
- Pre-warmed connections: pool.min connections created at boot, no first-request latency

## Security Considerations

- Pool connections persist across requests — ensure no state leakage
- Tenant credentials in pool config must be dynamically set

## Related Rules

- 5-13-1: Always Pool Tenant Connections

## Related Skills

- Implement Tenant Connection Caching and Pooling
- Configure Laravel Octane Connections
- Manage Connection Count

## Success Criteria

- Zero connection handshake overhead after pool pre-warming
- No connection exhaustion under peak load
- Pool utilization > 60% during normal traffic

# Skill: Configure Pool Architecture (Client-Side vs Server-Side)

## Purpose

Choose and configure between client-side pooling (Octane's built-in PDO pool) and server-side pooling (PgBouncer, ProxySQL, RDS Proxy) based on runtime, traffic, and infrastructure.

## When To Use

- Designing database connection architecture for a Laravel app
- Choosing between external pooler and built-in pool
- Migrating from PHP-FPM to Octane (pool architecture changes)
- Scaling to handle more concurrent connections
- AWS RDS/Aurora (RDS Proxy option)

## When NOT To Use

- Single-worker CLI scripts (no pooling needed)
- Development environment with minimal traffic
- Already have a working pool configuration

## Prerequisites

- Understanding of connection lifecycle (10-1)
- Runtime decision (PHP-FPM vs Octane vs Swoole)
- Database type (MySQL vs PostgreSQL)

## Inputs

- Application runtime
- Expected peak concurrent requests
- Database max_connections
- Infrastructure budget

## Workflow (numbered steps)

1. Choose pool architecture based on runtime:
   - **PHP-FPM**: Must use server-side pool (PgBouncer for PG, ProxySQL for MySQL)
   - **Octane**: Client-side built-in pool is sufficient (simpler, no extra infra)
   - **Swoole**: Built-in coroutine pool or server-side pool
   - **AWS RDS/Aurora**: RDS Proxy (serverless, IAM auth)

2. For server-side pool (PHP-FPM):
   - Deploy PgBouncer (PostgreSQL) or ProxySQL (MySQL)
   - Configure pool sizes: `default_pool_size = 50` for PgBouncer
   - Point application to pooler host/port instead of database directly

3. For client-side pool (Octane):
   ```php
   'pgsql' => [
       'pool' => [
           'min' => 2,
           'max' => 10,
       ],
   ],
   ```

4. Right-size pool using formulas:
   - Backend pool = (peak concurrent requests × connections per request) / multiplexing ratio
   - Transaction pooling multiplexing: 5-10×
   - Read pool: larger (more tolerant of failure)
   - Write pool: smaller (strict consistency, health checks)

5. Monitor pool utilization: alert at >80% active connections

## Validation Checklist

- [ ] Pool architecture matches runtime
- [ ] PHP-FPM: server-side pooler deployed
- [ ] Octane: pool config present in database.php
- [ ] Pool size formula applied
- [ ] Read/write pools sized asymmetrically
- [ ] Pool utilization monitored
- [ ] No connection exhaustion under peak

## Common Failures

- PHP-FPM without pooler — connection exhaustion
- Octane without pool config — same overhead as PHP-FPM
- Single huge pool for all environments — wastes resources in dev
- Nested poolers (PgBouncer behind RDS Proxy) — unnecessary latency
- Pooler as single point of failure — deploy in pairs

## Decision Points

- Server-side vs client-side pooling
- PgBouncer vs ProxySQL vs RDS Proxy
- Same pool for read/write vs separate pools
- Pool size: 50 vs 100 vs 200 backend connections

## Performance Considerations

- Server-side pool: <1ms proxy latency per query
- Client-side pool: no extra hop, slightly faster
- Transaction pooling: 5-10× multiplexing
- Session pooling: ~1× (no multiplexing for web)
- Each backend connection: 2-10MB RAM on DB

## Security Considerations

- TLS between app and pooler, and pooler and database
- PgBouncer SCRAM authentication
- ProxySQL TLS configuration
- RDS Proxy IAM authentication (credentials never reach app)

## Related Rules

- 10-2-1: Deploy Server-Side Pooler for PHP-FPM
- 10-2-2: Configure Octane Connection Pool

## Related Skills

- Manage Connection Lifecycle
- Use PgBouncer Pooling Modes
- Configure Read/Write Connection Separation

## Success Criteria

- Pool architecture matches runtime and traffic profile
- Pool size handles peak traffic without exhaustion
- Pool utilization stays below 80%
- Pooler health checks pass

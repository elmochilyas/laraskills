# Skill: Manage Connection Count

## Purpose

Calculate and configure database `max_connections`, pool sizing, and connection storm prevention based on available server memory and traffic patterns.

## When To Use

- Every production database deployment
- Auto-scaling environments where application server count varies
- Multi-tenant deployments with per-tenant connection consumption
- Any application using PHP-FPM (one connection per worker per request)

## When NOT To Use

- Single-worker CLI scripts
- Serverless databases (RDS Proxy, Aurora Serverless)
- Embedded databases (SQLite)

## Prerequisites

- Understanding of pool architecture (10-2)
- Knowledge of database server RAM
- Understanding of connection tags (10-8)

## Inputs

- Database server total RAM
- Buffer pool / shared buffers size
- Connection memory per process (2–10MB)
- Number of application servers and workers per server
- Pooler multiplexing ratio (transaction mode: 5–10×)

## Workflow (numbered steps)

1. Calculate `max_connections` from available memory:
   `max_connections = (total_ram - OS_overhead - buffer_pool) / connection_memory_per_process`
   - MySQL default: 151, PostgreSQL default: 100
   - Each connection: 2–10MB RAM

2. Configure reserved admin connections:
   - MySQL: `reserved_connections = 5`
   - PostgreSQL: `superuser_reserved_connections = 3`
   - Always reserve slots for admin access and monitoring tools

3. Calculate pool sizing based on runtime:
   - PHP-FPM without pooler: `connections = workers × servers`
   - PHP-FPM with PgBouncer: `connections = default_pool_size`
   - Octane: `connections = workers × pool.max`
   - Swoole: `connections = shared_pool_size`

4. Apply multiplexing ratio for pooler:
   - Transaction mode: 5–10× multiplexing
   - 800 workers / 10 = 80 backend connections

5. Prevent connection storms during deployments:
   - Stagger worker startup with 100–500ms random delay
   - Use rolling deployments (not simultaneous restarts)

6. Monitor connection utilization:
   - Track `active_connections / max_connections` as percentage
   - Alert at >80% utilization
   - Monitor connection churn rate (connections created/second)

## Validation Checklist

- [ ] Database `max_connections` is set based on available RAM calculation
- [ ] Reserved/superuser connections are configured
- [ ] Pooler is deployed if using PHP-FPM (or Octane pool is configured)
- [ ] Worker startup is staggered
- [ ] Total potential connections < max_connections - reserved
- [ ] Connection utilization is monitored with alerts at >80%
- [ ] No "too many connections" errors during peak traffic or deployments

## Common Failures

- max_connections set too high — OOM crash on DB server
- No reserved admin connections — connection storm locks everyone out
- Simultaneous worker startup — 300+ connections in 1 second
- No pooler for PHP-FPM — connection count = worker count
- Octane pool.max too high — 8 workers × 100 = 800 connections

## Decision Points

- Pooler deployment (PgBouncer/ProxySQL) vs direct connections
- Admin reserved connections: 3 vs 5 vs 10
- Connection storm prevention: random delay vs gradual ramp-up
- Octane pool sizing: workers × pool.max calculation

## Performance Considerations

- Each connection consumes 2–10MB on the database server
- More connections = more context switching on DB CPU
- Pooling reduces database-side memory by 5–10×
- Setting max_connections too low = "too many connections" errors
- Setting max_connections too high = OOM crashes

## Security Considerations

- superuser_reserved_connections prevents lockout but needs protected creds
- Connection storms can be DDoS — rate-limit new connection attempts
- Monitor sudden connection spikes as security incident indicator
- High connection churn increases authentication event surface area

## Related Rules

- 10-7-1: Always Reserve Admin Connections
- 10-7-2: Calculate Pool Size from Server Memory

## Related Skills

- Configure Pool Architecture
- Configure Octane Connection Pool
- Use PgBouncer Pooling Modes

## Success Criteria

- max_connections correctly calculated from available RAM
- Admin reserved connections prevent lockout
- Pool sizing matches runtime and traffic profile
- No connection storms during deployments
- Connection utilization monitored and alerted

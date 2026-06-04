# Skill: Configure ProxySQL Query Rules

## Purpose

Configure ProxySQL query rules for read/write splitting, connection multiplexing, query caching, and query rewriting to centralize database routing logic at the proxy level.

## When To Use

- MySQL/MariaDB deployments needing connection pooling
- Read/write splitting at the proxy level (eliminates Laravel read/write config)
- Environments requiring query-level control (cache, rewrite, route by regex)
- Multi-tenant or sharded MySQL deployments with complex routing
- Gradual migration between database schemas

## When NOT To Use

- PostgreSQL deployments (use PgBouncer)
- Simple single-database MySQL deployments
- Environments where proxy-level query manipulation is not needed
- Serverless or managed DB services with built-in pooling

## Prerequisites

- ProxySQL installed and running
- MySQL/MariaDB with read replicas
- Access to ProxySQL admin interface (port 6032)

## Inputs

- Primary host and replicas configuration
- Query patterns to route (SELECT, SELECT FOR UPDATE, writes)
- Cache TTL requirements
- Multiplexing requirements

## Workflow (numbered steps)

1. Connect to ProxySQL admin interface:
   ```bash
   mysql -h127.0.0.1 -P6032 -uadmin -padmin
   ```

2. Configure hostgroups:
   - Hostgroup 0: primary (writes)
   - Hostgroup 1: replicas (reads)

3. Insert query rules (lower rule_id = higher priority):
   ```sql
   -- Rule 1: SELECT ... FOR UPDATE → primary (hostgroup 0)
   INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup, apply)
   VALUES (1, 1, '^SELECT.*FOR UPDATE', 0, 1);

   -- Rule 2: Regular SELECT → replicas (hostgroup 1)
   INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup, apply)
   VALUES (2, 1, '^SELECT ', 1, 1);

   -- Rule 3: Everything else → primary (hostgroup 0)
   INSERT INTO mysql_query_rules (rule_id, active, apply, destination_hostgroup)
   VALUES (3, 1, 1, 0);
   ```

4. Load rules to runtime and save to disk:
   ```sql
   LOAD MYSQL QUERY RULES TO RUNTIME;
   SAVE MYSQL QUERY RULES TO DISK;
   ```

5. Configure query caching for frequent low-cardinality queries:
   ```sql
   INSERT INTO mysql_query_rules (rule_id, active, match_pattern, cache_ttl, apply)
   VALUES (10, 1, 'SELECT COUNT\(\*\) FROM orders WHERE status = ', 1000, 1);
   ```

6. Configure connection multiplexing:
   - Default `multiplexing = 1` (enabled)
   - Disable if Laravel uses session state (SET SESSION, temp tables)

7. Configure health monitoring:
   ```ini
   mysql-monitor_connect_interval=60000
   mysql-monitor_ping_interval=10000
   ```

8. Point Laravel to ProxySQL:
   ```php
   'mysql' => [
       'host' => env('PROXYSQL_HOST'),
       'port' => env('PROXYSQL_PORT', '6033'),
       // No read/write arrays — ProxySQL handles routing
   ],
   ```

## Validation Checklist

- [ ] Query rules configured for read/write splitting
- [ ] FOR UPDATE queries correctly routed to primary
- [ ] Multiplexing disabled or tested with Laravel
- [ ] Query cache configured with appropriate TTLs
- [ ] Admin interface credentials changed from defaults
- [ ] TLS configured between app and ProxySQL
- [ ] Monitoring intervals configured
- [ ] Dead backend detection and removal verified
- [ ] Rules loaded to RUNTIME and saved to DISK

## Common Failures

- Multiplexing enabled with session-state app — session leaks between clients
- No FOR UPDATE rule — write-lock SELECTs fail on read-only replicas
- Default admin credentials unchanged — anyone can reconfigure ProxySQL
- Cache without invalidation — stale data served indefinitely
- Monitor not configured — dead backends not detected

## Decision Points

- Query routing at proxy vs Laravel config level
- Multiplexing enabled vs disabled
- Query cache TTL: 1s vs 5s vs 60s
- Single vs clustered ProxySQL (HA)

## Performance Considerations

- ProxySQL adds <0.1ms per query in proxy mode
- Query caching reduces DB load 50–90% for read-heavy workloads
- Multiplexing reduces backend connections 5–10×
- Memory scales with connection count and cache size

## Security Considerations

- ProxySQL enforces query-level access control
- All traffic between Laravel and ProxySQL must use TLS
- Admin interface must be restricted to localhost/internal networks
- Default credentials must be changed immediately
- Query rewriting can redact sensitive data

## Related Rules

- 10-15-1: Use Query Rules for Read/Write Splitting
- 10-15-2: Disable Multiplexing if Session State Used

## Related Skills

- Configure Read/Write Connection Separation
- Configure Pool Architecture
- Handle Connection Failover

## Success Criteria

- Query rules correctly route SELECTs → replicas, writes → primary
- FOR UPDATE queries go to primary (never replicas)
- Admin credentials changed from defaults
- Monitoring detects dead backends automatically
- Laravel connects to ProxySQL without read/write arrays

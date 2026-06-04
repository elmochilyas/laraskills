# 10.15 ProxySQL Query Rules and Connection Handling

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.15 |
| Knowledge Unit Title | ProxySQL query rules and connection handling |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.17 ProxySQL routing, 10.2 Pool architecture |
| Last Updated | 2026-06-02 |

## Overview

ProxySQL provides advanced connection handling beyond basic pooling: query rules (route queries by regex to specific hostgroups), connection multiplexing (backend connections shared across clients), query caching (TTL-based cache for identical queries), and query rewriting. Connection handling includes health checks, idle timeout, max connections per host, and automatic failover. ProxySQL is the primary connection management solution for MySQL/MariaDB and offers functionality that PgBouncer cannot match.

## Core Concepts

- **Connection multiplexing**: When `multiplexing = 1` (default), ProxySQL can send queries from different clients through the same backend connection. This significantly reduces backend connection count. Only safe if no session-state is used (same limitation as PgBouncer transaction pooling).
- **Query rules**: Rules define how queries are routed. Example: `SELECT ^SELECT.* → hostgroup 1 (read replicas)`. `^SELECT ... FOR UPDATE → hostgroup 0 (primary)`. Rules can match by user, schema, query digest, or regex pattern.
- **Hostgroups**: Logical groups of database backends. Hostgroup 0 = writers (primary). Hostgroup 1 = readers (replicas). Each hostgroup can have multiple backends with different weights.
- **Query caching**: ProxySQL can cache SELECT query results with a configurable TTL. The cache is in-memory (ProxySQL RAM). Repeated identical queries return cached results without hitting the database.
- **Query rewriting**: ProxySQL can rewrite queries before sending them to the backend. Useful for migrating query patterns, adding hints, or masking table names.

## When To Use

- MySQL/MariaDB deployments needing connection pooling (alternative to PgBouncer for PostgreSQL)
- Read/write splitting at the proxy level (Laravel doesn't need read/write config — ProxySQL handles it)
- Environments requiring query-level control (cache, rewrite, route by regex)
- Multi-tenant or sharded MySQL deployments with complex routing needs
- Gradual migration between database schemas (query rewriting)

## When NOT To Use

- PostgreSQL deployments (use PgBouncer — ProxySQL's MySQL-only features don't apply)
- Simple single-database MySQL deployments (overkill — use a simpler pooler or Octane's built-in pool)
- Environments where proxy-level query manipulation is not needed (adds complexity without benefit)
- Serverless or managed database services that provide built-in pooling (RDS Proxy, Aurora)

## Best Practices

- **Use query rules for read/write splitting, not Laravel's config**: Let ProxySQL route SELECTs to replicas and everything else to the primary. **Why**: ProxySQL routing works for all applications connecting through it, not just Laravel. It centralizes routing logic and eliminates the need for `read`/`write` arrays in `config/database.php`. The application simply connects to ProxySQL.
- **Disable multiplexing if Laravel uses session state**: Set `mysql-multiplexing = false` if the application uses SET SESSION, temporary tables, or session-level variables. **Why**: Multiplexing has the same limitations as PgBouncer transaction pooling — session state leaks between clients. Laravel's PDO configuration (emulate prepares) may still be compatible, but session-level SET commands are not.
- **Set appropriate query cache TTLs**: Cache results with short TTLs (1–5 seconds) for frequent queries with low write frequency. **Why**: Query caching reduces database load for repeated queries (dashboards, counts, list endpoints). Short TTLs ensure staleness is bounded. Avoid caching per-user queries (high cardinality, low hit rate).
- **Always configure health monitoring**: Set `mysql-monitor_connect_interval` (default 60000ms) and `mysql-monitor_ping_interval` (default 10000ms). **Why**: ProxySQL automatically removes dead backends from hostgroups only if monitoring is configured. Without monitoring, failed backends remain in the pool, causing connection errors.
- **Use `SELECT ... FOR UPDATE` rules to route to primary**: Ensure write-intensive SELECTs go to the primary. **Why**: `SELECT ... FOR UPDATE` acquires write locks and must go to the primary (replicas cannot handle write locks). A specific query rule for `^SELECT.*FOR UPDATE` ensures correctness while still routing regular SELECTs to replicas.

## Architecture Guidelines

- **ProxySQL cluster**: Deploy two ProxySQL instances for high availability. ProxySQL supports native clustering — configuration changes on one node propagate to the other.
- **Admin interface**: ProxySQL has a MySQL-compatible admin interface on port 6032. Use `mysql -h127.0.0.1 -P6032 -uadmin -padmin` for management.
- **Runtime vs. disk config**: ProxySQL has three configuration layers: RUNTIME (active), MAIN (in-memory, can be modified), DISK (persistent). Changes to MAIN must be loaded to RUNTIME and saved to DISK.
- **Application connection**: Laravel connects to ProxySQL on port 6033 (or custom). ProxySQL handles routing. Laravel sees a single database endpoint regardless of the number of backends.
- **For sharded MySQL**: Use ProxySQL's query rules to route queries to different shard hostgroups based on shard key value or query pattern.

## Performance Considerations

- ProxySQL is extremely fast — adds <0.1ms per query in proxy mode.
- Query caching can reduce database load by 50–90% for read-heavy workloads with repeated queries.
- Connection multiplexing reduces backend connections by 5–10×.
- ProxySQL memory usage: scales with connection count and query cache size. Rule processing is constant time (hash-based matching).
- Monitor ProxySQL metrics: `stats_mysql_processlist`, `stats_mysql_query_rules`, `stats_mysql_connection_pool`. Key metrics: `ConnPool_get_conn_latency_us`, `Queries_backend_bytes_recv`.

## Security Considerations

- ProxySQL can enforce query-level access control (some users can only SELECT, others can INSERT/UPDATE/DELETE).
- All traffic between Laravel and ProxySQL must use TLS. ProxySQL supports `mysql-have_ssl=true`.
- ProxySQL's admin interface (port 6032) must be restricted to localhost or internal networks. Default credentials (`admin`/`admin`) must be changed.
- Query rewriting can be used to redact sensitive data from queries before they reach the database or logs.
- ProxySQL can log all queries passing through it — configure selectively (high volume).

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | Multiplexing enabled with session-state app | Default multiplexing = 1 | Session state leaks between clients | Disable multiplexing or test thoroughly with Laravel |
| 2 | No query rule for FOR UPDATE | All SELECTs routed to replicas | FOR UPDATE queries fail on read-only replicas | Add specific rule: SELECT ... FOR UPDATE → hostgroup 0 (primary) |
| 3 | Default admin credentials | `admin`/`admin` unchanged | Anyone with network access can reconfigure ProxySQL | Change admin credentials immediately after install |
| 4 | Cache without invalidation | Cached SELECT results never refreshed | Stale data served indefinitely | Set appropriate TTL or implement cache invalidation rules |
| 5 | Monitor not configured | Default monitoring is off | Dead backends not detected | Configure mysql-monitor_connect_interval and mysql-monitor_ping_interval |

## Anti-Patterns

- **All queries routed to one hostgroup**: Using ProxySQL but routing all traffic to the primary. No read/write splitting benefit.
- **Overly broad query rules**: Rules that match too broadly (e.g., `SELECT` → replicas) may route administrative or reporting SELECTs that need the primary.
- **Rule conflicts without priority**: Multiple rules matching the same query with no priority order. ProxySQL gives priority to lower rule_id. Ensure priority is explicitly assigned.
- **Caching per-user queries**: `SELECT ... WHERE user_id = ?` — each user's query is different, so cache hit rate is near zero. Cache only low-cardinality queries.

## Examples

```sql
-- ProxySQL admin interface — query rules configuration
-- Connect: mysql -h127.0.0.1 -P6032 -uadmin -padmin

-- Insert query rules (lower rule_id = higher priority)
-- Rule 1: SELECT ... FOR UPDATE → hostgroup 0 (primary)
INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup, apply)
VALUES (1, 1, '^SELECT.*FOR UPDATE', 0, 1);

-- Rule 2: Regular SELECT → hostgroup 1 (replicas)
INSERT INTO mysql_query_rules (rule_id, active, match_pattern, destination_hostgroup, apply)
VALUES (2, 1, '^SELECT ', 1, 1);

-- Rule 3: Everything else → hostgroup 0
INSERT INTO mysql_query_rules (rule_id, active, apply, destination_hostgroup)
VALUES (3, 1, 1, 0);

-- Load to runtime and save to disk
LOAD MYSQL QUERY RULES TO RUNTIME;
SAVE MYSQL QUERY RULES TO DISK;

-- Query cache configuration
INSERT INTO mysql_query_rules (rule_id, active, match_pattern, cache_ttl, apply)
VALUES (10, 1, 'SELECT COUNT\(\*\) FROM orders WHERE status = ', 1000, 1);

LOAD MYSQL QUERY RULES TO RUNTIME;
```

```php
// config/database.php — Laravel connects to ProxySQL
'mysql' => [
    'driver' => 'mysql',
    'host' => env('PROXYSQL_HOST', '127.0.0.1'),
    'port' => env('PROXYSQL_PORT', '6033'),
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
    // No read/write arrays — ProxySQL handles routing
],
```

## Related Topics

- **Prerequisites**: 10.2 Pool architecture, MySQL connection fundamentals
- **Closely Related**: 10.9 Read/write connection separation, 7.17 ProxySQL routing
- **Advanced**: ProxySQL clustering, ProxySQL query cache invalidation, ProxySQL sharding rules
- **Cross-Domain**: 7.9 Load balancing across replicas, 6.19 Shard proxy considerations

## AI Agent Notes

- ProxySQL is the MySQL/MariaDB equivalent of PgBouncer but with more features
- For MySQL read/write splitting, ProxySQL is preferred over Laravel's built-in config
- Query rules must prioritize FOR UPDATE → primary before general SELECT → replicas
- Multiplexing has the same session-state limitations as PgBouncer transaction pooling
- Change default admin credentials immediately — this is a common security finding
- ProxySQL monitoring is separate from health check configuration — both must be configured

## Verification

- [ ] Query rules are configured for read/write splitting (FOR UPDATE → primary, SELECT → replicas)
- [ ] Multiplexing is disabled or tested with Laravel's application behavior
- [ ] Query cache is configured with appropriate TTLs for low-cardinality queries
- [ ] Admin interface credentials are changed from defaults
- [ ] TLS is configured between app and ProxySQL
- [ ] Monitoring intervals are configured (connect, ping)
- [ ] Dead backend detection and removal is verified
- [ ] Rules are loaded to RUNTIME and saved to DISK

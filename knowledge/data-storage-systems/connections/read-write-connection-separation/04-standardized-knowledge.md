# 10.9 Read/Write Connection Separation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Connection Management & Pooling |
| Knowledge Unit ID | 10.9 |
| Knowledge Unit Title | Read/write connection separation (dedicated read connections vs. merged) |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 7.2 Read/write config, 7.8 Connection pooling replicas |
| Last Updated | 2026-06-02 |

## Overview

Separate read and write connections have different pool configurations and failover behaviors. Read pool: larger (multiple replicas), tolerant of stale data, more connections. Write pool: smaller (single primary), strict consistency, fewer connections. Pool sizing, health checks, and failover handling must differ per pool. Laravel's `database.php` supports separate `pool` configs for `read` and `write` arrays, enabling asymmetric pool sizing.

## Core Concepts

- **Read pool**: Multiple replica hosts, larger pool size (`min=4, max=16`), tolerant of connection failures (fall back to write pool), application_name tagged as `read`, can tolerate stale data.
- **Write pool**: Single primary host, smaller pool size (`min=2, max=4`), strict connection health checks, fails over to promoted replica on primary failure, requires up-to-date data.
- **Laravel separate config**: `database.php` supports `read` and `write` arrays each with their own `host`, `pool`, and options. Eloquent queries are automatically routed: SELECT → read, INSERT/UPDATE/DELETE → write.
- **Sticky writes**: Laravel's `sticky` option ensures reads after a write go to the write connection for the remainder of the request. Prevents stale-read-after-write when replication lag exists.
- **Asymmetric scaling**: Read traffic is typically 5–10× write traffic. Read pools need more connections. Write pools can be smaller.

## When To Use

- Applications with read replicas deployed
- High-traffic applications where read and write connection requirements differ significantly
- Reporting or analytics workloads that should not impact transactional write connections
- Multi-region deployments with read replicas in each region

## When NOT To Use

- Single-database deployments (no replicas — all queries go to one database)
- Applications where read/write ratio is near 1:1
- Simple applications with low traffic where complexity of separate pools isn't justified

## Best Practices

- **Asymmetric pool sizing**: Read pool: `min=4, max=16`. Write pool: `min=2, max=4`. **Why**: Read traffic typically dominates (5–10× more reads than writes). A write pool sized for reads wastes connections. A read pool sized for writes starves reads. Separate sizing allocates resources proportionally to workload.
- **Enable sticky writes**: Set `'sticky' => true` in the connection config. **Why**: Without sticky writes, a read after a write may go to a replica that hasn't received the update yet (replication lag). Sticky writes ensure the read goes to the primary if a write happened in the same request.
- **Read fallback to write pool**: When all read replicas fail, fall back to the write connection for reads. **Why**: Degraded but functional — the application continues serving read traffic (at higher load on the primary) rather than returning errors.
- **Separate health check thresholds**: Write pool: aggressive health checks (1s timeout, retry 2×). Read pool: lenient health checks (3s timeout, retry 1×). **Why**: Write failures are catastrophic (data loss risk). Read failures are tolerable (fallback to write pool exists). Different thresholds avoid unnecessary failover for read connections.
- **Tag connections by purpose**: Set `application_name` to distinguish read vs write connections in monitoring. **Why**: When diagnosing database performance, knowing whether the load is from reads or writes guides the fix differently.

## Architecture Guidelines

- Laravel routes queries based on `$operation` parameter to `DB::connection()`. SELECT → read pool. INSERT/UPDATE/DELETE → write pool.
- The `read` and `write` arrays in `database.php` are independent. Each can have its own `host`, `pool`, `database`, etc.
- For ProxySQL-based read/write splitting, the proxy handles routing at the SQL level. Laravel still connects to ProxySQL, which then routes to read or write hostgroups.
- For Octane, separate pool configs for read and write connections within the same `mysql` or `pgsql` driver entry.
- Read replicas should be load-balanced (round-robin across hosts in the read array). Laravel cycles through them.

## Performance Considerations

- Read pool should be 2–4× larger than write pool for typical web applications.
- Write pool should be sized for peak write concurrency, not sustained load.
- Sticky writes add overhead (reads go to primary after writes). Acceptable for write-heavy endpoints.
- Read replica lag can be 100ms–10s. Stale read tolerance depends on application requirements.
- Each replica connection consumes DB memory. Total read pool across all replicas should be distributed proportionally to replica sizing.

## Security Considerations

- Read replicas may have different security requirements (e.g., less sensitive data accessible). Ensure the read connection user has appropriate privileges.
- Write connection user should have minimal privileges (INSERT, UPDATE, DELETE on application tables only).
- Sticky writes route reads to the primary after a write, bypassing replicas. This is expected behavior, not a security concern.
- Tag read and write connections separately in audit logs.

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|-------------|-------|-------------|----------------|
| 1 | Same pool config for read and write | Copy-paste between arrays | Write pool wastes connections; read pool starves | Use asymmetric sizing: read larger, write smaller |
| 2 | Sticky writes disabled | `sticky` not set or set to false | Stale reads after writes — user sees old data before replication catches up | Set 'sticky' => true in connection config |
| 3 | No read fallback on replica failure | Read pool with no fallback | All reads fail when replicas are down | Configure read fallback to write connection |
| 4 | Identical health checks for read/write | Same monitor config | Write pool fails too slowly (critical); read pool fails too fast (unnecessary failover) | Write: aggressive (1s timeout). Read: lenient (3s timeout) |
| 5 | Read replicas in different regions with high latency | Multi-region config with no latency awareness | Read queries time out or are slow | Use local read replicas per region, or accept lower consistency |

## Anti-Patterns

- **Single connection pool for read/write merged traffic**: One pool sized for the sum of read+write traffic. Writes queue up behind reads, increasing write latency.
- **Write pool used for reporting queries**: Large reporting queries on the write pool block write transactions. Always route reports to read replicas.
- **No sticky writes in eventually-consistent setups**: Disabling sticky writes for "performance" introduces stale-read bugs that are hard to reproduce and debug.
- **Identical read/write failover procedures**: Promoting a replica for read pool failure is different from promoting for write pool failure. Don't use the same procedure.

## Examples

```php
// config/database.php — Asymmetric read/write pool config
'mysql' => [
    'driver' => 'mysql',
    'read' => [
        'host' => [
            env('DB_HOST_READ_1', '127.0.0.1'),
            env('DB_HOST_READ_2', '127.0.0.1'),
        ],
        'pool' => [
            'min' => 4,
            'max' => 16,
        ],
    ],
    'write' => [
        'host' => env('DB_HOST_WRITE', '127.0.0.1'),
        'pool' => [
            'min' => 2,
            'max' => 4,
        ],
    ],
    'sticky' => true,
    'database' => env('DB_DATABASE'),
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
],

// Read fallback — when all replicas fail
class ReadFallbackConnection extends Illuminate\Database\MySqlConnection
{
    public function select($query, $bindings = [], $useReadPdo = true)
    {
        try {
            return parent::select($query, $bindings, $useReadPdo);
        } catch (QueryException $e) {
            if ($useReadPdo) {
                return parent::select($query, $bindings, false); // fallback to write PDO
            }
            throw $e;
        }
    }
}
```

## Related Topics

- **Prerequisites**: 7.2 Laravel read/write config, 10.2 Pool architecture
- **Closely Related**: 7.4 Sticky writes, 7.9 Load balancing across replicas
- **Advanced**: 7.7 Lag-aware read splitting, 7.15 Read replica for specific workloads
- **Cross-Domain**: 7.1 Replication overview, 10.15 ProxySQL query rules

## AI Agent Notes

- Asymmetric pool sizing is the most impactful configuration for read/write separated systems
- Sticky writes must be enabled to prevent stale-read bugs — this is not optional
- Read fallback to write pool is essential for high availability
- Health check differentiation ensures the right response to different failure modes
- ProxySQL can handle read/write splitting at the proxy level, reducing Laravel config complexity

## Verification

- [ ] Read and write connections have asymmetric pool configurations
- [ ] `sticky` is set to `true` for connections with read/write separation
- [ ] Read fallback to write connection is configured (or ProxySQL handles this)
- [ ] Health check timeouts differ between read (lenient) and write (aggressive) pools
- [ ] Connections are tagged by purpose (read, write) in monitoring
- [ ] Read replica load is distributed across available hosts
- [ ] No stale-read incidents reported after deployment

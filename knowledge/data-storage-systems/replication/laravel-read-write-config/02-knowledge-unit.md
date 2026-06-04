# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.2 Laravel read/write configuration (config/database.php read/write arrays)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's `database.php` connection config supports `read` and `write` host arrays. Writes always go to the first `write` host. Reads are randomly distributed among `read` hosts. Configuration is static — all models on this connection automatically split reads/writes.

---

# Core Concepts

- **Read array**: `'read' => ['host' => ['replica1', 'replica2']]` — Laravel randomly picks one for SELECT queries.
- **Write array**: `'write' => ['host' => ['primary']]` — all INSERT/UPDATE/DELETE go to write hosts.
- **Connection name**: If `read` and `write` are specified, Laravel creates two internal PDO connections (`connection_name::read`, `connection_name::write`).

---

# Patterns

**Simple replica config**: `'mysql' => ['write' => ['host' => env('DB_HOST_WRITE')], 'read' => ['host' => explode(',', env('DB_HOST_READ'))], 'database' => env('DB_DATABASE'), ...]`.

**Database URL with replicas**: Use `DB_REPLICA_URL` environment variables for read hosts. Parse in `config/database.php`.

---

# Common Mistakes

**No read host fallback**: If all read hosts fail, Laravel does not fall back to write host for reads. Implement fallback logic or use a proxy.

---

# Related Knowledge Units

7.3 Automatic query routing | 7.9 Load balancing replicas
## Ecosystem Usage

Laravel supports read/write connections in database config. Managed databases provide read replica endpoints. ProxySQL and pgBouncer route traffic at the proxy level.

## Failure Modes

Read-after-write inconsistency from replication lag. Stale reads from replicas under heavy write loads. Connection pooling with transaction pooling breaks session state.

## Performance Considerations

Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual consistency.

## Production Considerations

Monitor replica lag via seconds_behind_master or pg_stat_replication. Set sticky=true for session consistency. Use lag-aware read splitting. Test failover regularly.

## Research Notes

Aurora's distributed storage reduces replica lag to milliseconds. Group replication provides multi-primary capabilities. pgBouncer transaction pooling limitation is known.

## Internal Mechanics

Primary handles writes, streaming changes via binary log or WAL shipping. Replicas replay changes for consistency. Read/write splitting routes based on statement type.

## Architectural Decisions

Async MySQL binlog replication: zero write impact, seconds of data loss risk. Sync PostgreSQL replication: higher write latency, zero data loss. Aurora storage replication: minimal write impact, zero data loss.

## Tradeoffs

Benefit: Read scaling. Cost: Stale reads possible. Benefit: Write failover. Cost: Replica promotion complexity. Benefit: Connection pooling. Cost: Transaction pooling limitations.

## Mental Models

Primary is the source of truth. Replicas are cached copies that lag slightly. Writes go to primary, reads to any replica. The sticky option forces reads to primary after writes.


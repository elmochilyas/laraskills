# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.4 Sticky writes (reading-after-write consistency issue)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

After a write, a subsequent read may go to a replica that hasn't replicated the write yet. The user sees stale data. Sticky writes ensure that after a write, subsequent reads use the write connection for the same request/session. Laravel does this automatically within a request via `Illuminate\Database\Connection::$recordsModified`.

---

# Core Concepts

- **Read-after-write inconsistency**: User creates a post (write to primary), redirects to post list (read from replica). Replica lag → post not visible.
- **Laravel's $recordsModified**: After any write on a connection, `$recordsModified = true`. All subsequent reads on that connection use the write PDO.
- **Scope**: Applies only within the same request. Next request from the same user may still hit a lagged replica.

---

# Patterns

**Session sticky writes**: Store a `written_at` timestamp in session. On the next request, force read from primary for N seconds (e.g., 5s).

**Redirect with cache bust**: After write, redirect with a unique hash that forces read from primary. Less common.

---

# Common Mistakes

**Disabling $recordsModified globally**: Breaks read-after-write consistency for all users. Only disable if you understand the consistency tradeoff.

---

# Related Knowledge Units

7.3 Query routing | 7.7 Lag-aware read splitting
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


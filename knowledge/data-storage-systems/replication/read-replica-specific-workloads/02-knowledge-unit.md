# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.15 Read replica-specific workloads (reporting, analytics, search)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Dedicate replicas for specific workloads: reporting (heavy aggregation queries), analytics (full table scans), search (Elasticsearch indexing reads). These workloads consume CPU and IOPS that would degrade user-facing query performance. Separation via dedicated read replicas with different sizing.

---

# Core Concepts

- **Reporting replica**: Larger instance (more CPU/RAM). Run heavy aggregation queries, materialized view refreshes, report generation.
- **Analytics replica**: Connected to BI tools (Tableau, Metabase). Accepts high-latency queries. May be significantly behind in replication lag.
- **Search indexing replica**: Elasticsearch/Meilisearch indexing reads. Scans large tables. Separate from user-facing replicas.

---

# Patterns

**Dedicated replica for reporting**: `'mysql_reporting' => ['read' => ['host' => 'reporting-replica'], ...]`. Connect via `DB::connection('mysql_reporting')` for reports.

**Replica sizing per workload**: Reporting replica: 2x CPU, 4x RAM compared to user-facing replicas. Analytics replica: more storage.

---

# Common Mistakes

**Running reports on user-facing replicas**: A heavy report query blocks user requests on the same replica. Dedicate replicas per workload type.

---

# Related Knowledge Units

7.16 Read replica sizing | 7.5 Replica lag
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


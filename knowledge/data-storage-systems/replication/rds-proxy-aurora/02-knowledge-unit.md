# Metadata

Domain: Data & Storage Systems
Subdomain: Replication & Read/Write Splitting
Knowledge Unit: 7.19 RDS Proxy / Aurora (serverless connection multiplexing)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

RDS Proxy (MySQL/PostgreSQL) and Aurora handle connection multiplexing at the AWS infrastructure level. They pool connections, handle failover transparently, and reduce database load from many short-lived connections. Particularly useful for Lambda (cold start connections) and serverless applications.

---

# Core Concepts

- **Connection multiplexing**: RDS Proxy maintains a small pool of persistent connections to the database. Many client connections share these pooled connections.
- **Failover handling**: RDS Proxy detects primary failover, reconnects to new primary transparently. Application doesn't see connection errors during failover.
- **IAM authentication**: RDS Proxy supports AWS IAM authentication. No database passwords in application config.

---

# Patterns

**RDS Proxy + Lambda**: Lambda functions create many short connections. RDS Proxy pools them. Prevents connection storms during traffic spikes.

**Aurora Auto Scaling**: Aurora replicas scale automatically. RDS Proxy distributes read traffic across available replicas.

---

# Common Mistakes

**RDS Proxy cost**: RDS Proxy has ~$15/month cost per instance. For a single small database, direct connection may be cheaper.

---

# Related Knowledge Units

7.8 Connection pooling replicas | 10.5 Serverless connection handling
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


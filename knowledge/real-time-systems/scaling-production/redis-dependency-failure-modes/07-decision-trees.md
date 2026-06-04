# Metadata

**Domain:** Real-Time Systems
**Subdomain:** Scaling & Production Architecture
**Knowledge Unit:** Redis Dependency & Failure Modes
**Generated:** 2026-06-03

---

# Decision Inventory

* Redis Architecture: Dedicated vs Shared Instance
* Persistence Strategy: AOF vs RDB vs None
* High Availability Strategy: Sentinel vs Cluster vs None

---

# Architecture-Level Decision Trees

---

## Redis Architecture: Dedicated vs Shared Instance

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Redis serves multiple roles: cache, queue backend, session store, and Reverb pub/sub backbone. Using a single Redis instance for everything creates contention and cross-component failure cascades. A cache stampede can starve Reverb's pub/sub channel, dropping broadcasts.

---

## Decision Criteria

* performance considerations — contention under load; blast radius of failures
* architectural considerations — deployment complexity; number of Redis instances to manage
* security considerations — isolation of Reverb Redis from other services (CVE-2026-23524)
* maintainability considerations — monitoring and operating multiple Redis instances

---

## Decision Tree

Should Redis be dedicated for Reverb pub/sub?
↓
Is the application running multiple Reverb instances (horizontal scaling)?
YES → [Dedicated Redis instance for Reverb pub/sub (port 6380)]
NO → Is a single server with > 500 concurrent connections?
    YES → [Dedicated Redis for Reverb; shared cache/queue on separate instance]
    NO → [Shared Redis for all roles; monitor for contention]

---

## Rationale

A dedicated Redis instance for Reverb pub/sub is the safest choice for any multi-instance deployment because it prevents cache stampedes, queue backlogs, and session surges from affecting broadcast delivery. The cost of an additional Redis instance (typically $15-50/month on managed services) is negligible compared to the operational risk. For single-server deployments with low traffic, a shared instance is acceptable but should be monitored.

---

## Recommended Default

**Default:** Dedicated Redis instance for Reverb pub/sub on port 6380, separate from cache/queue Redis
**Reason:** Eliminates cross-component failure cascades; limits blast radius of security incidents

---

## Risks Of Wrong Choice

Shared Redis under load causes undetected broadcast drops—events are silently lost when pub/sub messages cannot be processed due to cache/queue contention.

---

## Related Rules

Always Use a Dedicated Redis Instance for Reverb Pub/Sub (05-rules.md)

---

## Related Skills

Manage Redis Dependency and Failure Modes for Reverb (06-skills.md)

---

## Persistence Strategy: AOF vs RDB vs None

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Redis restart loses all in-memory data. If Redis is used as the queue backend for broadcast events, a restart drops queued events permanently. The engineer must choose a persistence strategy that balances data durability with performance.

---

## Decision Criteria

* performance considerations — AOF fsync overhead vs RDB snapshot cost vs no persistence
* architectural considerations — each Redis role has different persistence requirements
* security considerations — event loss compliance implications
* maintainability considerations — disk space for AOF/RDB files

---

## Decision Tree

What persistence strategy should be used?
↓
Is this Redis instance used for the queue backend?
YES → [AOF persistence: appendonly yes, appendfsync everysec]
NO → Is this Redis instance used for Reverb pub/sub?
    YES → [No persistence — pub/sub is fire-and-forget]
    NO → Is this Redis instance used for cache?
        YES → [RDB snapshots or no persistence — cache can reconstruct from DB]
        NO → [No persistence — evaluate if persistence is needed]

---

## Rationale

AOF with `appendfsync everysec` is the recommended tradeoff for queue Redis: it guarantees at most 1 second of data loss on restart with minimal performance impact (typically <5% overhead). Reverb pub/sub does not need persistence because messages are ephemeral—if Redis restarts, Reverb instances reconnect and clients rebuild state via reconnection. Cache Redis can use RDB for occasional snapshots or no persistence since cache misses fall back to the database.

---

## Recommended Default

**Default:** AOF persistence on queue Redis (`appendonly yes`, `appendfsync everysec`), no persistence on Reverb pub/sub Redis
**Reason:** Protects queued broadcast events from loss while avoiding unnecessary I/O on the pub/sub channel

---

## Risks Of Wrong Choice

No persistence on queue Redis permanently loses queued broadcast events on restart. AOF on pub/sub Redis wastes disk I/O with no benefit since messages are ephemeral.

---

## Related Rules

Always Enable AOF Persistence for Queue Redis (05-rules.md)

---

## Related Skills

Manage Redis Dependency and Failure Modes for Reverb (06-skills.md)

---

## High Availability Strategy: Sentinel vs Cluster vs None

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

A single Redis instance is a single point of failure. If it goes down, Reverb instances cannot coordinate, presence state is lost, and queue processing stops. The engineer must choose an HA strategy that matches the application's uptime requirements.

---

## Decision Criteria

* performance considerations — failover time; write overhead for replication
* architectural considerations — number of Redis nodes; deployment complexity
* security considerations — data consistency during failover
* maintainability considerations — operating Sentinel vs Cluster

---

## Decision Tree

How should Redis high availability be configured?
↓
Is the application mission-critical (SLA > 99.9%)?
YES → Number of Redis nodes needed?
    1-3 nodes → [Redis Sentinel — automatic failover, simple setup]
    3+ nodes with sharding → [Redis Cluster — automatic failover + data sharding]
NO → Is uptime important but not critical?
    YES → [Redis Sentinel with single replica]
    NO → [Single Redis instance — acceptable risk for dev/low-traffic]

---

## Rationale

Sentinel is the recommended HA strategy for most Reverb deployments: it provides automatic failover with minimal overhead (one Sentinel process per Redis node). Cluster adds data sharding across nodes, which is unnecessary for Reverb's pub/sub use case (all instances subscribe to the same channel). Sentinel's failover typically completes in 10-30 seconds—during which Reverb connections remain open but events cannot cross instances.

---

## Recommended Default

**Default:** Redis Sentinel with 3 nodes (1 primary, 2 replicas) for production Reverb deployments
**Reason:** Automatic failover within 10-30s; simple configuration; adequate for most uptime requirements

---

## Risks Of Wrong Choice

No HA means a Redis outage causes complete broadcasting failure until manual recovery. Cluster adds operational complexity without benefit for Reverb's simple pub/sub pattern.

---

## Related Rules

Always Use Redis Sentinel or Cluster for High Availability (05-rules.md)

---

## Related Skills

Manage Redis Dependency and Failure Modes for Reverb (06-skills.md)

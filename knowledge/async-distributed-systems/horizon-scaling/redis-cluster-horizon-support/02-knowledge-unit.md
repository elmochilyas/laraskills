# Metadata
Domain: Async & Distributed Systems
Subdomain: Horizon Scaling & Monitoring
Knowledge Unit: Redis Cluster Support in Horizon (v5.46+)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
Horizon v5.46+ added support for Redis Cluster, enabling distributed Redis topologies for high-availability and sharded throughput. Redis Cluster distributes keys across multiple nodes using hash slots, providing automatic failover and horizontal write scaling. However, Horizon's reliance on specific Redis commands and key patterns that assume a single-instance Redis creates compatibility constraints: multi-key operations (tags, metrics) require all keys to be in the same hash slot, and the `BRPOP` blocking pop used for queue polling is not fully supported in cluster mode.

# Core Concepts
- **Redis Cluster**: Data is sharded across 16384 hash slots, distributed across N nodes. Each key belongs to one slot.
- **Hash tags**: `{...}` in key names force slot calculation to use the content inside the braces. Enables multi-key operations: `horizon:tags:{tag}:{id}`.
- **Cross-slot operations**: Commands operating on multiple keys (MGET, DEL with multiple keys) fail if keys are in different slots. Unsupported in cluster mode.
- **`BRPOP` in cluster**: Blocking pop commands work but only pop from a key in the local (connected) node. Cross-node blocking requires client-side routing.
- **Horizon compatibility**: Horizon uses hash tags `{horizon}` for its internal keys to ensure they land in the same slot.

# Mental Models
- **Shared filing cabinet vs distributed shelves**: Single Redis = one filing cabinet. Redis Cluster = multiple shelves across the room. You need to know which shelf has your file (key). Hash tags ensure related files stay on the same shelf.
- **Apartment mailboxes**: Each node is a mailbox cluster. Keys with the same hash tag go to the same mailbox. A single letter (multi-key command) needs all recipients in the same mailbox.

# Internal Mechanics
- Horizon's internal keys use hash tags: `{horizon}:supervisors`, `{horizon}:metrics:throughput:queue`.
- Queue keys (used by `BRPOP`) do NOT use hash tags by default — they're `queues:default`, `queues:high`.
- In cluster mode, `BRPOP` on a queue key may fail if the key is on a different node than the client's connection.
- Horizon's tags index: each tag is stored as a sorted set. With hash tags, tag operations stay within slot.
- Metrics stored with hash tags (`{horizon}:metrics:*`) — cross-slot aggregation queries are avoided.
- Cluster mode requires Predis (which supports cluster) or phpredis with Redis Cluster support.

# Patterns
## Hash-Tagged Queue Keys
- **Purpose**: Ensure queue keys are in the same slot for multi-key operations.
- **Benefit**: Enables `BRPOP` and other multi-key operations across queues.
- **Tradeoff**: Hash tags reduce sharding distribution (all queues go to one node).

## Read-Only Replica for Dashboard
- **Purpose**: Use Redis replica for Horizon dashboard reads.
- **Benefit**: Reduces load on the primary cluster nodes.
- **Tradeoff**: Dashboard data may be slightly stale (replica lag).

## Separate Redis for Queue vs Cache in Cluster
- **Purpose**: Use Redis Cluster for cache scalability but single Redis for queues (or vice versa).
- **Benefit**: Queue operations (BRPOP) work reliably; cache benefits from sharding.
- **Tradeoff**: Two Redis systems to manage.

# Architectural Decisions
- **Use Redis Cluster for Horizon only when**: Single Redis throughput is insufficient (>10K jobs/sec, >100K connections) OR high-availability requirement.
- **Prefer single Redis with replica for most deployments**: Simpler, fully compatible, fewer edge cases.
- **If using Cluster, enable hash tags on queue keys**: Configure `queue_key_hash_tag` to wrap queue keys in `{horizon}` for consistent hashing.
- **Test `BRPOP` behavior in cluster**: Blocking pop across nodes requires client routing. Ensure your Redis client supports this.

# Tradeoffs
Redis Cluster + Horizon | High throughput, automatic failover, horizontal scaling | BRPOP limitations; cross-slot constraints; configuration complexity
Single Redis + Replica | Simple, fully compatible, adequate for 95% of deployments | Vertical scaling limit; manual failover
Separate Redis (queue + cache) | Queue operations isolated; cache can use Cluster | Two systems; higher cost

# Performance Considerations
- Cluster mode adds network hop for cross-node requests. Typical: 1-5ms per cross-node operation.
- `BRPOP` in cluster: the client connects to the node hosting the queue key's slot. Each worker maintains this connection.
- Hash tags force related keys to a single node, reducing sharding benefits for those keyspaces.
- Redis Cluster with many nodes: client-side routing overhead (moved/ask redirections) adds latency.

# Production Considerations
- Upgrade to Horizon v5.46+ before attempting Cluster mode. Earlier versions do not support it.
- Test `BRPOP` blocking behavior in a staging cluster. The client library must handle MOVED/ASK redirections during blocking operations.
- Monitor cluster node CPU/memory to ensure hash-tagged keyspace (Horizon, queue keys) doesn't overload a single node.
- Redis Cluster requires all nodes to be version 7.0+ for full compatibility with Horizon's commands.
- Backup strategy for Cluster differs from single-instance. Use Redis Cluster's native replication.

# Common Mistakes
- **Enabling Cluster without hash tags on Queue keys**: `BRPOP` may connect to a node that doesn't host the queue key, causing "MOVED" redirection errors.
- **Assuming Cluster mode is transparent**: The client library must support Cluster routing. `predis/predis` Cluster support is mature; `phpredis` Cluster support requires specific configuration.
- **Not testing failover behavior**: When a Cluster node fails, Horizon clients must reconnect to the new master. Test this scenario.
- **Using `KEYS` or `SCAN` across the cluster**: `KEYS` blocks all nodes. Use `SCAN` with proper iteration per node.
- **Expecting cross-slot MULTI/EXEC transactions**: Redis Cluster does not support transactions across slots. Horizon avoids this, but custom work may hit this limitation.

# Failure Modes
- **Cluster split-brain**: Redis Cluster has its own split-brain handling. During a network partition, some slots may be served by stale nodes. Horizon may read/write to stale data.
- **BRPOP timeout during failover**: When a Cluster node fails, `BRPOP` connections are interrupted. Workers see a connection error. They must reconnect and re-subscribe.
- **Hash tag slot overload**: If all Horizon keys (tags, metrics, supervisors) share the same hash tag, they all map to one slot on one node. That node becomes a bottleneck.
- **Client redirection storm**: During node failover, many clients simultaneously redirect. This can overwhelm the new master.
- **Lost metrics during node failover**: In-flight metrics writes may be lost if the node fails before replication. Horizon metrics are non-critical but trend data is lost.

# Ecosystem Usage
- **Laravel Horizon**: Cluster support added in v5.46+. Requires `predis/predis` or `phpredis` with Cluster support.
- **Redis**: Redis Cluster requires minimum 3 master nodes (production recommendation: 6 nodes — 3 masters, 3 replicas).
- **Spatie packages**: Not directly affected, but applications using Spatie packages on Horizon + Redis Cluster must test compatibility.

# Related Knowledge Units
- K040 Redis Streams as Queue Backend (alternative to Cluster) | K049 Multi-Server Horizon (scaling strategy comparison)

## Research Notes
- Horizon's auto-balancing mode uses a scoring algorithm that reassigns worker processes between queues every few seconds — the scoring considers queue backlog depth and processing time to determine worker allocation.
- The alance:auto strategy in Horizon implements a "min/max" approach where each supervisor has a configured minProcesses and maxProcesses — the balancer adjusts within this range based on load.
- Horizon v5 (Laravel 11+) improved Redis cluster support by abstracting queue connections through a consistent hashing layer — jobs are distributed across cluster nodes based on job ID hash.
- The Horizon dashboard authorization gate can be customized via Horizon::auth() — exposing the dashboard without authentication in production is a common security gap.
- Horizon metrics (throughput, runtime, wait time) are stored in Redis with a retention period configured via 	rim — long retention can consume significant Redis memory in high-throughput environments.
- The horizon:snapshot command generates a work-in-progress report of all supervisors, processes, and queue metrics — useful for debugging queue backlogs during incidents.
- Silenced job tags in Horizon prevent specific job types from appearing in the "Completed Jobs" and "Failed Jobs" lists — this is a display-only filter that does not affect job processing or logging.
- Horizon's queue:monitor integration was added in Laravel 12 — it provides a Pulse integration for queue health dashboards beyond Horizon's own UI.

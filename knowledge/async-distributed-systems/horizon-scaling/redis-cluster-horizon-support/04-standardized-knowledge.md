# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Horizon Scaling & Monitoring
- **Knowledge Unit:** K081 — Redis Cluster Support in Horizon (v5.46+)
- **Knowledge ID:** K081
- **Difficulty Level:** Expert
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Horizon: Redis Cluster
  - Laravel Source — `Laravel\Horizon` v5.46+
  - Redis Cluster specification

---

# Overview

Horizon v5.46+ added support for Redis Cluster, enabling distributed Redis topologies for high-availability and sharded throughput. Redis Cluster distributes keys across multiple nodes using hash slots, providing automatic failover and horizontal write scaling. However, Horizon's reliance on specific Redis commands and key patterns creates compatibility constraints: multi-key operations require keys in the same hash slot, and `BRPOP` blocking pop is not fully supported in cluster mode.

---

# Core Concepts

- **Redis Cluster:** Data sharded across 16384 hash slots across N nodes.
- **Hash tags:** `{...}` in key names force slot calculation to use the content inside braces.
- **Cross-slot operations:** Commands on multiple keys fail if keys are in different slots.
- **`BRPOP` in cluster:** Blocking pop works only on the local node. Cross-node blocking requires client routing.
- **Horizon compatibility:** Horizon uses `{horizon}` hash tag for internal keys.

---

# When To Use

- Single Redis throughput insufficient (>10K jobs/sec, >100K connections)
- High-availability requirement with automatic Redis failover
- Horizontal write scaling needed for Redis

---

# When NOT To Use

- 95% of deployments — single Redis with replica is simpler and fully compatible
- When `BRPOP` reliability is critical — cluster mode has edge cases with blocking operations
- When the team lacks Redis Cluster operational expertise

---

# Best Practices

- **Prefer single Redis with replica for most deployments.** Simpler, fully compatible, fewer edge cases. *Why: Redis Cluster introduces `BRPOP` limitations, cross-slot constraints, and configuration complexity that most applications don't need.*
- **Enable hash tags on queue keys if using Cluster.** Configure `queue_key_hash_tag` to wrap keys in `{horizon}`. *Why: Without hash tags, queue keys may land on different nodes — `BRPOP` connects to a single node and may not find the queue key.*
- **Use Horizon v5.46+ minimum.** Earlier versions do not support Cluster mode. *Why: Cluster support was added in v5.46 — earlier versions have no cluster awareness and will fail.*
- **Test failover behavior.** When a Cluster node fails, Horizon clients must reconnect to the new master. *Why: Unhandled failover can cause workers to hang or lose connections.*

---

# Architecture Guidelines

- Horizon internal keys use `{horizon}` hash tag: `{horizon}:supervisors`, `{horizon}:metrics:*`.
- Queue keys (`queues:default`) do NOT use hash tags by default.
- In cluster mode, `BRPOP` on a queue key may fail if the key is on a different node.
- Cluster mode requires Predis (which supports cluster) or phpredis with Cluster support.
- Hash tags force related keys to a single node, reducing sharding benefits.

---

# Performance Considerations

- Cluster mode adds network hop for cross-node requests: ~1-5ms per operation.
- `BRPOP` in cluster keeps a connection to the node hosting the queue key's slot.
- Hash tags reduce sharding distribution for Horizon keyspace — may overload one node.
- Client-side routing overhead during MOVED/ASK redirections adds latency.

---

# Security Considerations

- Redis Cluster does not encrypt inter-node communication by default — use TLS or trusted network.
- Cluster mode changes the Redis attack surface — more nodes to secure.
- All nodes share the same authentication — one compromised node exposes the cluster.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Cluster without hash tags on queue keys | Missing `queue_key_hash_tag` config | `BRPOP` connects to wrong node — MOVED errors | Enable hash tags on queue keys |
| Assuming transparent Cluster mode | Not testing client library compatibility | Connection failures at runtime | Test Predis/phpredis Cluster support |
| Not testing failover | Assuming nodes never fail | Workers hang during failover — no processing | Test with node failure in staging |
| Cross-slot MULTI/EXEC | Using transactions across slots | Redis Cluster rejects transaction | Avoid multi-key transactions in cluster |

---

# Anti-Patterns

- **Using Redis Cluster as a "scale-up" instead of "scale-out":** Cluster adds complexity — scale vertically first before adding cluster complexity.
- **Hash tag everything:** Using `{horizon}` on all keys concentrates load on one node — defeats sharding purpose.
- **No fallback plan:** Deploying Cluster without ability to fall back to single Redis if issues arise.

---

# Examples

```php
// config/database.php — Redis Cluster configuration
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),
    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', ''),
    ],
    'clusters' => [
        'default' => [
            [
                'host' => env('REDIS_HOST', '127.0.0.1'),
                'port' => env('REDIS_PORT', 7000),
            ],
        ],
    ],
],

// config/horizon.php — enable queue key hash tags
'queue_key_hash_tag' => true, // use {horizon} hash tag on queue keys
```

---

# Related Topics

- **K040 Redis Streams as Queue Backend (K040)** — Alternative to Cluster
- **K049 Multi-Server Horizon (K049)** — Scaling strategy comparison

---

# AI Agent Notes

- Redis Cluster is an advanced configuration — recommend single Redis with replica for most deployments.
- If generating Cluster config, include `queue_key_hash_tag: true` in Horizon config.
- Test `BRPOP` behavior in staging before production — this is the most common source of issues.

---

# Verification

- [ ] Horizon starts with Redis Cluster — verify no connection errors
- [ ] `BRPOP` works on queue keys — verify workers can pop jobs
- [ ] Hash tags on queue keys — verify `{horizon}:queues:*` key pattern
- [ ] Failover works — simulate node failure, verify Horizon reconnects
- [ ] Cross-slot operations avoided — verify no MOVED redirection errors in logs

# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Horizon Scaling
**Knowledge Unit:** redis-cluster-horizon-support
**Generated:** 2026-06-03

---

# Decision Inventory

* Redis Cluster vs Single Redis for Horizon

---

# Architecture-Level Decision Trees

---

## Redis Cluster vs Single Redis for Horizon

---

### Decision Context

Whether to use Redis Cluster or a single Redis instance for Horizon's queue backend.

---

### Decision Criteria

* Redis data size exceeds single instance capacity
* High availability requirements
* Throughput needs beyond single instance
* Operational complexity tolerance

---

### Decision Tree

Single Redis instance has sufficient capacity?
YES → Use single instance — simpler, Horizon fully supports it
NO → Need more memory than single instance provides?
    YES → Use Redis Cluster — shard data across nodes
NO → Need HA (failover without data loss)?
    YES → Use Redis Sentinel (not Cluster) — simpler HA with single instance
NO → Throughput exceeds single instance?
    YES → Use Redis Cluster — distribute load across nodes

---

### Rationale

Horizon supports Redis Cluster but with limitations: blocking commands (BRPOP) behave differently across cluster nodes, and the `allkeys-lru` eviction policy must be avoided. Redis Sentinel provides high availability with simpler operations.

---

### Recommended Default

**Default:** Use a single Redis instance for most applications; Redis Cluster only when data exceeds single instance capacity
**Reason:** Single instance is simpler, fully supported, and avoids cluster-related edge cases (BRPOP, key distribution, pipeline limitations).

---

### Risks Of Wrong Choice

- Cluster when Sentinel suffices: unnecessary complexity
- Single instance for cluster-scale data: memory exhaustion
- Cluster with BRPOP: blocking across cluster nodes is unreliable
- Eviction policy conflict: allkeys-lru in cluster deletes queue keys

---

### Related Rules

- separate-queue-redis-from-cache

---

### Related Skills

- Configure Redis Cluster for Horizon
- Configure Multi-Server Horizon

# Metadata

**Domain:** real-time-systems
**Subdomain:** scaling-production
**Knowledge Unit:** redis-dependency-failure-modes
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] AOF persistence enabled for queue Redis
- [ ] Connection retry with backoff configured in Reverb
- [ ] Dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Always Configure Redis Authentication and Network Isolation
- [ ] Always Enable AOF Persistence for Queue Redis
- [ ] Always Set TTL on Presence Channel Keys
- [ ] Always Use a Dedicated Redis Instance for Reverb Pub/Sub
- [ ] Always Use Redis Sentinel or Cluster for High Availability
- [ ] `maxmemory-policy` set appropriately per instance (noeviction for queue/Reverb)
- [ ] AOF persistence enabled for queue Redis
- [ ] Dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Configure `requirepass` and bind to internal IP with firewall
- [ ] Configure Reverb connection retry with backoff for Redis disconnections
- [ ] Configure TTL on presence channel member keys via `REVERB_ACTIVITY_TIMEOUT`
- [ ] Automatic failover restores service within acceptable window
- [ ] Presence channel data has bounded memory growth (TTL configured)
- [ ] Queued broadcast events survive Redis restarts (AOF persistence)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `requirepass` and bind to internal IP with firewall
- [ ] Configure Reverb connection retry with backoff for Redis disconnections
- [ ] Configure TTL on presence channel member keys via `REVERB_ACTIVITY_TIMEOUT`
- [ ] Deploy Redis Sentinel or Cluster for automatic failover
- [ ] Enable AOF persistence for queue Redis (`appendonly yes`, `appendfsync everysec`)
- [ ] Provision a dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Set `maxmemory-policy noeviction` for Reverb and queue Redis; `allkeys-lru` for cache Redis
- [ ] Set up monitoring: Redis memory, connected clients, pub/sub message rate
- [ ] Test failure scenarios: Redis restart, network partition, OOM condition
- [ ] Update Reverb to v1.7.0+ (CVE-2026-23524 fix)
- [ ] Always Configure Redis Authentication and Network Isolation
- [ ] Always Enable AOF Persistence for Queue Redis

---

# Performance Checklist

- [ ] Each Reverb instance uses two Redis connections (subscribe + publish)
- [ ] High-throughput pub/sub (10k+ msg/s) consumes Redis network I/O
- [ ] Presence channel membership data grows with concurrent connections; set TTLs aggressively
- [ ] Redis pub/sub latency: sub-millisecond in same datacenter, 1-5ms across availability zones
- [ ] Redis-based queue throughput depends on list operations (LPUSH/BRPOP) which are O(1)
- [ ] Each Reverb instance uses two Redis connections (subscribe + publish)
- [ ] Monitor Redis memory, connected clients, and pub/sub rates
- [ ] Redis pub/sub is fire-and-forget â€” messages are not queued for disconnected subscribers

---

# Security Checklist

- [ ] CVE-2026-23524 (RCE via insecure deserialization) was fixed in Reverb v1.7.0â€”always update
- [ ] Enable `requirepass` for authentication
- [ ] Redis must not be exposed to the public internetâ€”bind to internal IP and use firewalls
- [ ] Use a separate Redis instance for Reverb scaling (not shared with cache/queue)

---

# Reliability Checklist

- [ ] CVE-2026-23524 vulnerability
- [ ] Queued broadcast events lost on restart
- [ ] Queued events dropped under memory pressure
- [ ] Reverb instances stop coordinating
- [ ] Unbounded Redis memory growth
- [ ] Always Configure Redis Authentication and Network Isolation
- [ ] Always Enable AOF Persistence for Queue Redis
- [ ] Always Set TTL on Presence Channel Keys
- [ ] Always Use a Dedicated Redis Instance for Reverb Pub/Sub
- [ ] Always Use Redis Sentinel or Cluster for High Availability

---

# Testing Checklist

- [ ] `maxmemory-policy` set appropriately per instance (noeviction for queue/Reverb)
- [ ] AOF persistence enabled for queue Redis
- [ ] Automatic failover restores service within acceptable window
- [ ] Connection retry with backoff configured in Reverb
- [ ] Dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Presence channel data has bounded memory growth (TTL configured)
- [ ] Queued broadcast events survive Redis restarts (AOF persistence)
- [ ] Redis authentication configured (`requirepass`)
- [ ] Redis bound to internal IP with firewall
- [ ] Redis failure does not cause permanent data loss or extended outage

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Single Shared Redis Instance for Everything]
- [ ] [No Redis Authentication or Network Isolation]
- [ ] [No TTL on Presence Channel Keys]
- [ ] [No AOF Persistence for Queue Redis]
- [ ] [Wrong maxmemory-policy for Redis Role]
- [ ] Assigning more memory than needed without eviction policy
- [ ] No Redis monitoring
- [ ] Single massive Redis instance for everything

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor Redis memory, connected clients, and pub/sub rates

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md



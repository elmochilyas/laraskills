# Metadata

**Domain:** real-time-systems
**Subdomain:** websocket-servers
**Knowledge Unit:** reverb-horizontal-scaling-redis
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `phpredis` extension installed in production
- [ ] `REVERB_SCALING_ENABLED=true` configured
- [ ] Dedicated Redis instance for Reverb (separate from cache/queue)
- [ ] Always Configure Sticky Sessions on the Load Balancer
- [ ] Always Enable REVERB_SCALING_ENABLED=true for Multi-Instance Setups
- [ ] Always Use a Dedicated Redis Instance for Reverb Scaling
- [ ] Always Use a Unique Scaling Channel Per Environment
- [ ] Always Use phpredis in Production Over Predis
- [ ] `phpredis` extension installed in production
- [ ] `REVERB_SCALING_ENABLED=true` configured
- [ ] Dedicated Redis instance for Reverb scaling
- [ ] Configure `REVERB_SCALING_ENABLED=true` and `REVERB_SCALING_DRIVER=redis`
- [ ] Configure Redis authentication and network isolation
- [ ] Configure sticky sessions on load balancer (cookie-based preferred)
- [ ] Each environment has isolated scaling channels (no cross-environment leakage)
- [ ] Events broadcast on any Reverb instance reach clients connected to all instances
- [ ] Reconnecting clients return to their original instance (sticky sessions)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `REVERB_SCALING_ENABLED=true` and `REVERB_SCALING_DRIVER=redis`
- [ ] Configure Redis authentication and network isolation
- [ ] Configure sticky sessions on load balancer (cookie-based preferred)
- [ ] Deploy Redis with replication (Sentinel or Cluster) for HA
- [ ] Install `phpredis` extension for production performance
- [ ] Provision a dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Set a unique `REVERB_SCALING_CHANNEL` per environment
- [ ] Set Redis connection details (`REVERB_REDIS_HOST`, `REVERB_REDIS_PORT`, `REVERB_REDIS_PASSWORD`)
- [ ] Test: disconnect a Reverb instance and verify clients reconnect to remaining instances
- [ ] Update Reverb to v1.7.0+ (CVE-2026-23524 fix)
- [ ] Always Configure Sticky Sessions on the Load Balancer
- [ ] Always Enable REVERB_SCALING_ENABLED=true for Multi-Instance Setups

---

# Performance Checklist

- [ ] Each Reverb instance consumes a Redis connection for subscribing
- [ ] Network latency between Reverb instances and Redis is criticalâ€”deploy in the same VPC/region
- [ ] Redis pub/sub adds ~1-5ms latency per broadcast event in the same datacenter
- [ ] Redis throughput must accommodate peak message rates; benchmark with `redis-benchmark` pub/sub tests
- [ ] Each Reverb instance consumes a Redis connection for subscribing â€” monitor `maxclients`
- [ ] Redis pub/sub adds ~1-5ms latency per broadcast event (same datacenter)
- [ ] Use TLS for Redis connections in production

---

# Security Checklist

- [ ] Configure Redis `requirepass` and bind to internal network interfaces
- [ ] Redis must be protected with authentication and network isolation (CVE-2026-23524)
- [ ] Redis pub/sub does not encrypt messages by default; use TLS for Redis in production
- [ ] Use a dedicated Redis instance for Reverb scaling to limit blast radius
- [ ] Redis must be protected with authentication and network isolation
- [ ] Use TLS for Redis connections in production

---

# Reliability Checklist

- [ ] Clients lose subscriptions on reconnect
- [ ] Cross-environment message leakage
- [ ] Events reach only clients on one instance
- [ ] High broadcast latency
- [ ] RCE vulnerability
- [ ] Redis becomes bottleneck at high load
- [ ] Always Configure Sticky Sessions on the Load Balancer
- [ ] Always Enable REVERB_SCALING_ENABLED=true for Multi-Instance Setups
- [ ] Always Use a Dedicated Redis Instance for Reverb Scaling
- [ ] Always Use a Unique Scaling Channel Per Environment

---

# Testing Checklist

- [ ] `phpredis` extension installed in production
- [ ] `REVERB_SCALING_ENABLED=true` configured
- [ ] Dedicated Redis instance for Reverb (separate from cache/queue)
- [ ] Dedicated Redis instance for Reverb scaling
- [ ] Each environment has isolated scaling channels (no cross-environment leakage)
- [ ] Events broadcast on any Reverb instance reach clients connected to all instances
- [ ] Reconnecting clients return to their original instance (sticky sessions)
- [ ] Redis authentication and network isolation configured
- [ ] Redis deployed with replication (Sentinel/Cluster) for HA
- [ ] Redis deployed with replication for HA

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Adding more Reverb instances without monitoring Redis throughput
- [ ] Not testing reconnection during instance failure
- [ ] Single Redis for all environments

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Each Reverb instance consumes a Redis connection for subscribing â€” monitor `maxclients`

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



# Metadata

**Domain:** real-time-systems
**Subdomain:** laravel-echo
**Knowledge Unit:** dedicated-reverb-fleet-architecture
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Application server broadcasting config matches Reverb fleet credentials
- [ ] Auto-scaling is configured based on aggregate connection count
- [ ] Connection draining is implemented for deployments
- [ ] Always Configure Sticky Sessions on the Load Balancer
- [ ] Always Implement Connection Draining on Deployment
- [ ] Always Monitor Connection Distribution Across Fleet Instances
- [ ] Always Set File Descriptor Limits Adequately
- [ ] Always Use a Dedicated Redis Instance for Fleet Pub/Sub
- [ ] Connection draining (`stopwaitsecs`) matches deployment strategy
- [ ] Dedicated Redis instance for fleet pub/sub (not shared with cache/queue)
- [ ] File descriptor limits adequate for expected connections
- [ ] Configure `REVERB_SCALING_ENABLED=true` and `REVERB_SCALING_DRIVER=redis` on all instances
- [ ] Configure health checks that verify Reverb is accepting WebSocket connections
- [ ] Configure the load balancer with cookie-based sticky sessions (not IP hash)
- [ ] Connection distribution is balanced across fleet instances
- [ ] Events reach all clients regardless of which instance they're connected to
- [ ] Fleet handles target concurrent connections with headroom

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure `REVERB_SCALING_ENABLED=true` and `REVERB_SCALING_DRIVER=redis` on all instances
- [ ] Configure health checks that verify Reverb is accepting WebSocket connections
- [ ] Configure the load balancer with cookie-based sticky sessions (not IP hash)
- [ ] Implement rolling deployments: restart one instance at a time
- [ ] Monitor per-instance connection distribution for balanced load
- [ ] Provision a dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
- [ ] Set `proxy_read_timeout` higher than Reverb's activity timeout
- [ ] Set `ulimit -n` to exceed expected max connections by at least 25%
- [ ] Set a unique `REVERB_SCALING_CHANNEL` per environment
- [ ] Set Supervisor `stopwaitsecs` to at least 2x `activity_timeout` for connection draining
- [ ] Always Configure Sticky Sessions on the Load Balancer
- [ ] Always Implement Connection Draining on Deployment

---

# Performance Checklist

- [ ] Connection distribution depends on load balancer algorithm; IP hash can cause uneven distribution
- [ ] File descriptors (`ulimit -n`) must be provisioned adequately
- [ ] Fleet instances can be right-sized for WebSocket workload (network I/O optimized, memory-bound rather than CPU-bound)
- [ ] Redis pub/sub throughput becomes the bottleneck; benchmark with `redis-benchmark` for pub/sub capacity
- [ ] Sticky sessions reduce load balancer flexibility compared to round-robin
- [ ] File descriptor limits must exceed expected max connections by 25%
- [ ] Redis pub/sub throughput is the bottleneckâ€”benchmark with `redis-benchmark`
- [ ] Right-size fleet instances for WebSocket workload (network I/O optimized, memory-bound)

---

# Security Checklist

- [ ] Deployment storms trigger reconnection waves that overwhelm auth endpoint
- [ ] Fleet misconfiguration (wrong app credentials) silently drops broadcasts
- [ ] Load balancer session affinity loss bounces clients between instances, losing subscription state
- [ ] Redis pub/sub partition creates isolated island Reverb instances, losing cross-instance event delivery

---

# Reliability Checklist

- [ ] Clients bounce between instances
- [ ] Cross-environment event leakage
- [ ] Events don't reach some clients
- [ ] Reconnection storm on deploy
- [ ] Always Configure Sticky Sessions on the Load Balancer
- [ ] Always Implement Connection Draining on Deployment
- [ ] Always Monitor Connection Distribution Across Fleet Instances
- [ ] Always Set File Descriptor Limits Adequately
- [ ] Always Use a Dedicated Redis Instance for Fleet Pub/Sub
- [ ] Never Share Fleet Credentials Across Environments

---

# Testing Checklist

- [ ] Application server broadcasting config matches Reverb fleet credentials
- [ ] Auto-scaling is configured based on aggregate connection count
- [ ] Connection distribution is balanced across fleet instances
- [ ] Connection draining (`stopwaitsecs`) matches deployment strategy
- [ ] Connection draining is implemented for deployments
- [ ] Dedicated Redis instance for fleet pub/sub (not shared with cache/queue)
- [ ] Events reach all clients regardless of which instance they're connected to
- [ ] File descriptor limits adequate for expected connections
- [ ] Fleet handles target concurrent connections with headroom
- [ ] Fleet instances have adequate file descriptor limits

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Sticky Sessions on Load Balancer]
- [ ] [Shared Redis for Fleet Pub/Sub and Cache/Queue]
- [ ] [No Connection Draining on Deployment]
- [ ] [Under-Provisioned File Descriptors]
- [ ] [Sharing Fleet Credentials Across Environments]
- [ ] Monolithic Redis
- [ ] Round-robin load balancer
- [ ] Single Reverb instance at scale

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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



# Metadata

**Domain:** laravel-execution-lifecycle
**Subdomain:** Long Running Processes
**Knowledge Unit:** Octane Configuration And Workers
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Understand each `config/octane.php` option and its effect
- [ ] Calculate optimal `max_requests` based on memory profiling
- [ ] Set `worker_count` based on workload type (CPU-bound vs I/O-bound)
- [ ] `max_requests` calculated from profiled memory data with 20% safety margin, never 0 or null
- [ ] `worker_count` set to CPU core count (or `auto`), not concurrent user count
- [ ] Runtime-specific timeout matches slowest legitimate request + safety margin
- [ ] Set worker count to CPU core count, not concurrent user count. followed
- [ ] Always set max_requests based on profiled memory growth. followed
- [ ] Understand that max_requests is per-worker, not global. followed
- [ ] Use staged max_requests reduction for zero-downtime deployments. followed
- [ ] Configure graceful shutdown timeouts per runtime. followed
- [ ] Match runtime-specific timeout config to application needs. followed
- [ ] Set `worker_count` based on workload applied
- [ ] Profile memory growth to set `max_requests` applied
- [ ] Never disable `max_requests` applied
- [ ] Use staged rollout for config changes applied
- [ ] Over-Provisioning Workers prevented
- [ ] Single max_requests for All Routes prevented
- [ ] Setting worker_count = expected concurrent users prevented
- [ ] Thinking max_requests is global prevented

---

# Architecture Checklist

- [ ] `auto` worker count defaults to CPU cores architecture followed
- [ ] `max_requests` default 500 architecture followed
- [ ] Swoole `max_execution_time` defaults to 30 architecture followed
- [ ] RoadRunner uses separate PHP processes architecture followed
- [ ] Worker spawning architecture followed

---

# Implementation Checklist

- [ ] Set worker count to CPU core count, not concurrent user count. followed
- [ ] Always set max_requests based on profiled memory growth. followed
- [ ] Understand that max_requests is per-worker, not global. followed
- [ ] Use staged max_requests reduction for zero-downtime deployments. followed
- [ ] Configure graceful shutdown timeouts per runtime. followed
- [ ] Set `worker_count` based on workload applied
- [ ] Profile memory growth to set `max_requests` applied
- [ ] Never disable `max_requests` applied
- [ ] Use staged rollout for config changes applied
- [ ] Setting worker_count = expected concurrent users prevented
- [ ] Thinking max_requests is global prevented
- [ ] Disabling max_requests entirely prevented

---

# Performance Checklist

- [ ] Performance benchmarks established

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Over-Provisioning Workers prevented
- [ ] Single max_requests for All Routes prevented
- [ ] Ignoring RoadRunner .rr.yaml prevented
- [ ] No Graceful Shutdown Timeout prevented
- [ ] Disabling max_requests Entirely prevented
- [ ] Set worker count to CPU core count, not concurrent user count. followed
- [ ] Always set max_requests based on profiled memory growth. followed
- [ ] Understand that max_requests is per-worker, not global. followed
- [ ] Use staged max_requests reduction for zero-downtime deployments. followed
- [ ] Configure graceful shutdown timeouts per runtime. followed
- [ ] Match runtime-specific timeout config to application needs. followed

---

# Testing Checklist

- [ ] `max_requests` calculated from profiled memory data with 20% safety margin, never 0 or null
- [ ] `worker_count` set to CPU core count (or `auto`), not concurrent user count
- [ ] Runtime-specific timeout matches slowest legitimate request + safety margin
- [ ] Graceful shutdown timeout (`max_wait_time`) configured appropriately
- [ ] Understand each `config/octane.php` option and its effect
- [ ] Calculate optimal `max_requests` based on memory profiling
- [ ] Set `worker_count` based on workload type (CPU-bound vs I/O-bound)
- [ ] Test with over-provisioned worker_count â€” observe context switching overhead
- [ ] Workers run to max_requests without hitting memory_limit
- [ ] CPU utilization is balanced â€” no context-switch thrashing from over-provisioned workers
- [ ] Slowest legitimate request completes within runtime timeout without being killed
- [ ] Graceful shutdown completes all in-flight requests before worker termination

---

# Maintainability Checklist

- [ ] Documentation kept up to date

---

# Anti-Pattern Prevention Checklist

- [ ] Over-Provisioning Workers prevented
- [ ] Single max_requests for All Routes prevented
- [ ] Ignoring RoadRunner .rr.yaml prevented
- [ ] No Graceful Shutdown Timeout prevented
- [ ] Disabling max_requests Entirely prevented

---

# Production Readiness Checklist

- [ ] Production readiness reviewed

---

# Final Approval Checklist

- [ ] All critical checklist items pass
- [ ] No known edge cases unhandled
- [ ] Code reviewed by domain expert

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

- octane-architecture-overview (worker lifecycle context)
- octane-lifecycle-hooks (worker lifecycle events)
- static-property-accumulation (max_requests as safety valve)
- memory-profiling-and-observability (profiling to set max_requests)

---



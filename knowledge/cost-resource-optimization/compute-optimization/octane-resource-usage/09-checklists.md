# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Octane Resource Usage
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Octane worker count = CPU cores (or N-1 for management overhead)
- [ ] Memory growth per worker monitored for 24 hours
- [ ] OPcache + JIT enabled for Octane workers
- [ ] Global state reset per request (Sandbox/State pattern)
- [ ] Worker restart configured (memory limit, health checks)
- [ ] Set worker count to CPU cores applied
- [ ] Monitor memory growth per worker applied
- [ ] Use `Octane::tick()` for periodic cleanup applied
- [ ] Octane for simple CRUD apps prevented
- [ ] No OPcache with Octane prevented
- [ ] Too many workers configured prevented
- [ ] No memory monitoring prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Add 1-2 extra workers beyond CPU count for I/O-heavy apps (database, cache, API calls)
- [ ] Architecture guideline: Set memory limit per worker
- [ ] Architecture guideline: Monitor worker restarts
- [ ] Architecture guideline: Use supervisord or Kubernetes liveness probes to restart stuck workers
- [ ] Architecture guideline: For container/orchestration

---

# Implementation Checklist

- [ ] Best practice applied: Set worker count to CPU cores
- [ ] Best practice applied: Monitor memory growth per worker
- [ ] Best practice applied: Use `Octane::tick()` for periodic cleanup
- [ ] Best practice applied: Enable OPcache + JIT for Octane
- [ ] Best practice applied: Run RoadRunner for simpler deployment
- [ ] Workflow step completed: Inventory current Octane Resource Usage resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Octane vs PHP-FPM
- [ ] Memory
- [ ] 4-core server
- [ ] Swoole vs RoadRunner
- [ ] Request latency

---

# Security Checklist

- [ ] Octane runs as a single PHP process; if compromised, attacker has access to all in-memory data
- [ ] Long-lived workers
- [ ] Memory inspection
- [ ] `flush()` state
- [ ] Use Octane's `Sandbox` and `State` separation for tenant data

---

# Reliability Checklist

- [ ] Mistake prevented: Too many workers configured
- [ ] Mistake prevented: No memory monitoring
- [ ] Mistake prevented: Global state mutation

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Octane worker count = CPU cores (or N-1 for management overhead)
- [ ] Memory growth per worker monitored for 24 hours
- [ ] OPcache + JIT enabled for Octane workers
- [ ] Global state reset per request (Sandbox/State pattern)
- [ ] Worker restart configured (memory limit, health checks)
- [ ] Benchmark confirms throughput improvement over PHP-FPM

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Octane Resource Usage configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Octane for simple CRUD apps
- [ ] Anti-pattern prevented: No OPcache with Octane
- [ ] Anti-pattern prevented: Singleton abuse
- [ ] Common mistake prevented: Too many workers configured
- [ ] Common mistake prevented: No memory monitoring
- [ ] Common mistake prevented: Global state mutation

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Octane worker count = CPU cores (or N-1 for management overhead)
- [ ] Verification passed: Memory growth per worker monitored for 24 hours
- [ ] Verification passed: OPcache + JIT enabled for Octane workers

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |

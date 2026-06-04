# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Context Switching
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Web and queue workers on separate servers
- [ ] vmstat context switch rate < 20000/sec per core
- [ ] Run queue length < 2x CPU cores during peak
- [ ] cgroups configured if mixed workloads on same server
- [ ] Octane workers CPU-pinned to cores (if applicable)
- [ ] Monitor vmstat context switch rate applied
- [ ] Set workers to CPU cores for CPU-bound applied
- [ ] Use cgroups for resource limits applied
- [ ] Queue + web co-location prevented
- [ ] Workers = 10x CPU cores prevented
- [ ] Running queue workers on web servers prevented
- [ ] Ignoring run queue length prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Web servers
- [ ] Architecture guideline: Queue servers
- [ ] Architecture guideline: Batch processing servers
- [ ] Architecture guideline: Monitor `/proc/stat` `ctxt` counter daily; trend indicates worker allocation health
- [ ] Architecture guideline: Use `taskset` for Octane worker CPU pinning in production

---

# Implementation Checklist

- [ ] Best practice applied: Monitor vmstat context switch rate
- [ ] Best practice applied: Set workers to CPU cores for CPU-bound
- [ ] Best practice applied: Use cgroups for resource limits
- [ ] Best practice applied: Separate web and queue servers
- [ ] Best practice applied: Set process affinity for Octane workers
- [ ] Workflow step completed: Inventory current Context Switching resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Context switch cost
- [ ] TLB flush cost
- [ ] CPU cache pollution
- [ ] Hyperthreading
- [ ] PHP-FPM vs Octane

---

# Security Checklist

- [ ] Context switching rate can be used for side-channel attacks (timing differences in cache access)
- [ ] Process isolation
- [ ] Time-sharing
- [ ] Nice values can be manipulated by compromised workers; monitor for unexpected priority changes

---

# Reliability Checklist

- [ ] Mistake prevented: Running queue workers on web servers
- [ ] Mistake prevented: Ignoring run queue length
- [ ] Mistake prevented: Maximum workers always

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Verification (from standardized knowledge)
- [ ] Web and queue workers on separate servers
- [ ] vmstat context switch rate < 20000/sec per core
- [ ] Run queue length < 2x CPU cores during peak
- [ ] cgroups configured if mixed workloads on same server
- [ ] Octane workers CPU-pinned to cores (if applicable)
- [ ] No queue workers on production web servers

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Context Switching configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Queue + web co-location
- [ ] Anti-pattern prevented: Workers = 10x CPU cores
- [ ] Anti-pattern prevented: No CPU limit on workers
- [ ] Common mistake prevented: Running queue workers on web servers
- [ ] Common mistake prevented: Ignoring run queue length
- [ ] Common mistake prevented: Maximum workers always

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Verification passed: Web and queue workers on separate servers
- [ ] Verification passed: vmstat context switch rate < 20000/sec per core
- [ ] Verification passed: Run queue length < 2x CPU cores during peak

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

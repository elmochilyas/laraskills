# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 09-server-sizing-autoscaling
**Knowledge Unit:** Octane Sizing for Laravel
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Set worker count to (vCPU * 2) for general Laravel web apps applied
- [ ] Calculate max workers from memory budget applied
- [ ] Monitor per-worker memory growth over time applied
- [ ] Set Worker Count to 2x vCPUs for General Laravel Apps followed
- [ ] Calculate Max Workers from Memory Budget, Not CPU followed
- [ ] Monitor Per-Worker Memory Growth Ã¢â‚¬â€ Investigate >10%/Hour Increase followed
- [ ] Infinite worker count prevented
- [ ] No memory growth monitoring prevented
- [ ] Too many workers exhausting memory prevented
- [ ] Using PHP-FPM sizing mental model prevented

---

# Architecture Checklist

- [ ] Architecture guideline: 2 vCPU / 4GB as baseline for Octane; scale horizontally before scaling vertically
- [ ] Architecture guideline: Worker count
- [ ] Architecture guideline: Use Octane's Swoole or RoadRunner server; FrankenPHP for simpler deployments
- [ ] Architecture guideline: Connection pooling via Octane's built-in persistent connections; RDS Proxy for Lambda
- [ ] Architecture guideline: Deploy behind ALB for health checks and traffic distribution
- [ ] Architecture guideline: Use Octane's `tables` feature for in-memory caching between workers
- [ ] Set Worker Count to 2x vCPUs for General Laravel Apps followed
- [ ] Calculate Max Workers from Memory Budget, Not CPU followed
- [ ] Monitor Per-Worker Memory Growth Ã¢â‚¬â€ Investigate >10%/Hour Increase followed
- [ ] Set max_requests Per Worker (1000-10000) followed
- [ ] Scale Horizontally Before Vertically for Octane followed

---

# Implementation Checklist

- [ ] Best practice applied: Set worker count to (vCPU * 2) for general Laravel web apps
- [ ] Best practice applied: Calculate max workers from memory budget
- [ ] Best practice applied: Monitor per-worker memory growth over time
- [ ] Best practice applied: Use Horizon for queue worker pooling
- [ ] Best practice applied: Set max_requests per worker
- [ ] Set Worker Count to 2x vCPUs for General Laravel Apps followed
- [ ] Calculate Max Workers from Memory Budget, Not CPU followed
- [ ] Monitor Per-Worker Memory Growth Ã¢â‚¬â€ Investigate >10%/Hour Increase followed
- [ ] Set max_requests Per Worker (1000-10000) followed
- [ ] Scale Horizontally Before Vertically for Octane followed
- [ ] Workflow step completed: Inventory current Octane Sizing Laravel resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Octane throughput
- [ ] Per-worker memory stable after warm-up (no per-request bootstrap overhead)
- [ ] Swoole
- [ ] RoadRunner
- [ ] FrankenPHP
- [ ] Connection reuse eliminates 90%+ of database connection churn

---

# Security Checklist

- [ ] Octane workers run as long-lived processes; security updates require restart
- [ ] Ensure `open_basedir` or other PHP security restrictions work with Octane
- [ ] Swoole/RoadRunner run as system services; secure their management endpoints
- [ ] Octane's `tables` data persists across requests; don't store sensitive data without encryption
- [ ] WebSocket connections via Octane/Laravel Reverb need dedicated security consideration

---

# Reliability Checklist

- [ ] Mistake prevented: Too many workers exhausting memory
- [ ] Mistake prevented: Using PHP-FPM sizing mental model
- [ ] Mistake prevented: Not configuring max_requests
- [ ] Mistake prevented: Scaling vertically before horizontally

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team

### Success Criteria
- [ ] Octane Sizing Laravel configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Set Worker Count to 2x vCPUs for General Laravel Apps followed
- [ ] Calculate Max Workers from Memory Budget, Not CPU followed
- [ ] Monitor Per-Worker Memory Growth Ã¢â‚¬â€ Investigate >10%/Hour Increase followed
- [ ] Set max_requests Per Worker (1000-10000) followed
- [ ] Scale Horizontally Before Vertically for Octane followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Infinite worker count
- [ ] Anti-pattern prevented: No memory growth monitoring
- [ ] Anti-pattern prevented: Octane without opcache
- [ ] Anti-pattern prevented: Same scaling for queue and web workers
- [ ] Common mistake prevented: Too many workers exhausting memory
- [ ] Common mistake prevented: Using PHP-FPM sizing mental model
- [ ] Common mistake prevented: Not configuring max_requests
- [ ] Common mistake prevented: Scaling vertically before horizontally

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

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

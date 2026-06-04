# Metadata

**Domain:** Cost Resource Optimization
**Subdomain:** 01-compute-optimization
**Knowledge Unit:** Laravel Octane Throughput & Cost Impact
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Enable Octane by default for all production Laravel deployments applied
- [ ] Use FrankenPHP for new deployments; Swoole for maximum throughput applied
- [ ] Set max_requests per worker to prevent memory leaks applied
- [ ] PHP-FPM as default prevented
- [ ] No max_requests prevented
- [ ] Not testing with PHP extension compatibility prevented
- [ ] Using static properties for request-scoped data prevented

---

# Architecture Checklist

- [ ] Architecture guideline: Use Octane + FrankenPHP for Laravel Cloud deployments
- [ ] Architecture guideline: Use Octane + Swoole for self-managed EC2/Fargate with highest throughput needs
- [ ] Architecture guideline: Use Octane + RoadRunner when debugging simplicity matters more than peak throughput
- [ ] Architecture guideline: Separate Octane workers from queue workers on different servers
- [ ] Architecture guideline: Configure graceful worker restart to release accumulated memory without dropping requests
- [ ] Architecture guideline: Implement Laravel Horizon for queue workers alongside Octane for web serving

---

# Implementation Checklist

- [ ] Best practice applied: Enable Octane by default for all production Laravel deployments
- [ ] Best practice applied: Use FrankenPHP for new deployments; Swoole for maximum throughput
- [ ] Best practice applied: Set max_requests per worker to prevent memory leaks
- [ ] Best practice applied: Monitor resident memory growth over 24h
- [ ] Best practice applied: Worker count: CPU-bound Ã¢â€ â€™ n+1 workers; I/O-bound Ã¢â€ â€™ 2n to 4n workers
- [ ] Workflow step completed: Inventory current Laravel Octane Throughput resources, configurations, and usage patterns
- [ ] Workflow step completed: Calculate current monthly spend and cost per unit of work
- [ ] Workflow step completed: Identify optimization opportunities: right-sizing, reserved capacity, spot usage
- [ ] Workflow step completed: Implement highest-ROI optimizations first
- [ ] Workflow step completed: Measure cost impact after each optimization change

---

# Performance Checklist

- [ ] Worker memory
- [ ] Connection pooling
- [ ] Real-world
- [ ] Octane's `tick` and `timer` can replace external cron for periodic tasks
- [ ] Actual throughput multiplier depends on app complexity

---

# Security Checklist

- [ ] Octane state management
- [ ] Singleton services must be request-scoped safe (no user-specific data in shared instances)
- [ ] Octane sandbox provides request-scoped state isolation
- [ ] Long-running workers mean memory-resident secrets persist longer Ã¢â‚¬â€ rotate credentials more frequently
- [ ] Package compatibility audit required before Octane deployment

---

# Reliability Checklist

- [ ] Mistake prevented: Not testing with PHP extension compatibility
- [ ] Mistake prevented: Using static properties for request-scoped data
- [ ] Mistake prevented: Not setting max_requests
- [ ] Mistake prevented: Ignoring package compatibility

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
- [ ] Laravel Octane Throughput configured and functioning correctly
- [ ] Operational runbooks documented
- [ ] Monitoring dashboards and alerts active

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: PHP-FPM as default
- [ ] Anti-pattern prevented: No max_requests
- [ ] Anti-pattern prevented: Static property abuse
- [ ] Anti-pattern prevented: Shared server for web + queues
- [ ] Common mistake prevented: Not testing with PHP extension compatibility
- [ ] Common mistake prevented: Using static properties for request-scoped data
- [ ] Common mistake prevented: Not setting max_requests
- [ ] Common mistake prevented: Ignoring package compatibility

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
